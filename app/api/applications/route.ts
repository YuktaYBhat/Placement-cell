import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// Helper to check tier eligibility
function canApplyToTier(studentTier: string | null, jobTier: string, isDreamOffer: boolean): { eligible: boolean; reason?: string } {
    if (isDreamOffer) return { eligible: true }
    if (!studentTier) return { eligible: true }

    if (studentTier === "TIER_1") {
        return { eligible: false, reason: "You are already placed in Tier 1 and blocked from further placements" }
    }
    if (studentTier === "TIER_2") {
        if (jobTier === "TIER_1") return { eligible: true }
        return { eligible: false, reason: "You are placed in Tier 2. You can only apply for Tier 1 jobs (>9 LPA)" }
    }
    if (studentTier === "TIER_3") {
        if (jobTier === "TIER_1" || jobTier === "TIER_2") return { eligible: true }
        return { eligible: false, reason: "You are placed in Tier 3. You can only apply for Tier 1 or Tier 2 jobs" }
    }
    return { eligible: true }
}

// Helper to extract batch year
function getBatchYear(batch: string | null | undefined): string {
    if (!batch || typeof batch !== 'string') return ""
    const parts = batch.split('-')
    return parts[parts.length - 1].trim()
}

// GET - Get user's applications
export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "10")
        const skip = (page - 1) * limit

        const where = {
            userId: session.user.id,
            isRemoved: false
        }

        const [applications, total] = await Promise.all([
            prisma.application.findMany({
                where,
                orderBy: { appliedAt: "desc" },
                skip,
                take: limit,
                include: {
                    job: {
                        select: {
                            id: true,
                            title: true,
                            companyName: true,
                            companyLogo: true,
                            location: true,
                            category: true,
                            tier: true,
                            jobType: true,
                            workMode: true,
                            salary: true,
                            deadline: true,
                            status: true
                        }
                    }
                }
            }),
            prisma.application.count({ where })
        ])

        return NextResponse.json({
            applications,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        })

    } catch (error) {
        console.error("Error fetching applications:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST - Apply to a job
export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { jobId, responses } = body

        if (!jobId) {
            return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
        }

        // 1. Fetch Job, User Profile, and Placements in parallel
        const [job, user] = await Promise.all([
            prisma.job.findUnique({
                where: { id: jobId },
                include: {
                    customFields: {
                        orderBy: { createdAt: "asc" }
                    }
                }
            }),
            prisma.user.findUnique({
                where: { id: session.user.id },
                include: {
                    profile: true,
                    placements: {
                        where: { isException: false }
                    }
                }
            })
        ])

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 })
        }

        if (!user || user.role !== "STUDENT") {
            return NextResponse.json({ error: "Only students can apply for jobs" }, { status: 403 })
        }

        // 2. Job Status & Deadline Check
        if (job.status !== "ACTIVE") {
            return NextResponse.json({ error: "This job is no longer accepting applications" }, { status: 400 })
        }

        if (job.deadline && new Date(job.deadline) < new Date()) {
            return NextResponse.json({ error: "The application deadline has passed" }, { status: 400 })
        }

        // 3. KYC Status Check
        if (!user.profile || user.profile.kycStatus !== "VERIFIED") {
            return NextResponse.json({
                error: "Your profile must be KYC verified before applying. Current status: " + (user.profile?.kycStatus || "PENDING")
            }, { status: 403 })
        }

        // 4. Duplicate Application Check
        const existingApp = await prisma.application.findUnique({
            where: {
                jobId_userId: {
                    jobId,
                    userId: session.user.id
                }
            }
        })

        if (existingApp && !existingApp.isRemoved) {
            return NextResponse.json({ error: "You have already applied for this job" }, { status: 400 })
        }

        // 5. Tier Eligibility Check
        let highestTierPlacement: string | null = null
        const tierOrder = ["TIER_1", "TIER_2", "TIER_3", "DREAM"]
        for (const p of user.placements) {
            if (!highestTierPlacement || tierOrder.indexOf(p.tier) < tierOrder.indexOf(highestTierPlacement)) {
                highestTierPlacement = p.tier
            }
        }

        const tierCheck = canApplyToTier(highestTierPlacement, job.tier, job.isDreamOffer)
        if (!tierCheck.eligible) {
            return NextResponse.json({ error: tierCheck.reason }, { status: 400 })
        }

        // 6. Profile Eligibility Checks (CGPA, Branch, Batch, Backlogs)
        const profile = user.profile
        const cgpa = profile.finalCgpa || profile.cgpa || 0

        if (job.minCGPA && cgpa < job.minCGPA) {
            return NextResponse.json({
                error: `Minimum CGPA required: ${job.minCGPA}. Your CGPA: ${cgpa.toFixed(2)}`
            }, { status: 400 })
        }

        if (job.allowedBranches.length > 0 && profile.branch) {
            if (!job.allowedBranches.includes(profile.branch)) {
                return NextResponse.json({
                    error: `Your branch (${profile.branch}) is not eligible for this job`
                }, { status: 400 })
            }
        }

        if (job.eligibleBatch && profile.batch) {
            const studentBatchYear = getBatchYear(profile.batch)
            const jobBatchYear = getBatchYear(job.eligibleBatch)
            if (studentBatchYear !== jobBatchYear) {
                return NextResponse.json({
                    error: `Only ${job.eligibleBatch} batch is eligible. Your batch: ${profile.batch}`
                }, { status: 400 })
            }
        }

        const hasActiveBacklogs = profile.activeBacklogs || profile.hasBacklogs === "yes"
        if (job.maxBacklogs !== null && job.maxBacklogs === 0 && hasActiveBacklogs) {
            return NextResponse.json({ error: "No active backlogs allowed for this job" }, { status: 400 })
        }

        // 7. Custom Fields Validation
        if (job.customFields && job.customFields.length > 0) {
            for (const field of job.customFields) {
                const response = responses?.find((r: any) => r.fieldId === field.id)
                if (field.required && (!response || !response.value || response.value.trim() === "")) {
                    return NextResponse.json({ error: `Please provide a value for ${field.label}` }, { status: 400 })
                }
            }
        }

        // 8. Create Application
        const application = await prisma.$transaction(async (tx) => {
            // If there was a removed application, we should probably update it instead of creating a new one
            // but prisma.application.create usually works fine due to cuid() if we don't care about history.
            // However, the unique constraint is on jobId_userId.

            if (existingApp && existingApp.isRemoved) {
                // Update the removed one
                return await tx.application.update({
                    where: { id: existingApp.id },
                    data: {
                        isRemoved: false,
                        removedAt: null,
                        removedBy: null,
                        removalReason: null,
                        appliedAt: new Date(),
                        resumeUsed: profile.resumeUpload || profile.resume,
                        responses: responses && Array.isArray(responses) ? {
                            deleteMany: {}, // Clear old responses
                            create: responses.map((r: any) => ({
                                fieldId: r.fieldId,
                                value: r.value
                            }))
                        } : undefined
                    }
                })
            }

            return await tx.application.create({
                data: {
                    jobId,
                    userId: session.user.id,
                    resumeUsed: profile.resumeUpload || profile.resume,
                    responses: responses && Array.isArray(responses) ? {
                        create: responses.map((r: any) => ({
                            fieldId: r.fieldId,
                            value: r.value
                        }))
                    } : undefined
                }
            })
        })

        return NextResponse.json({
            success: true,
            message: `Successfully applied to ${job.title} at ${job.companyName}`,
            application
        }, { status: 201 })

    } catch (error: any) {
        console.error("Error applying to job:", error)
        return NextResponse.json({
            error: "Internal server error",
            details: error.message
        }, { status: 500 })
    }
}

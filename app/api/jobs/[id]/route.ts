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

// GET - Get single job by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const { id } = await params

        // Fetch the single job with all details
        const job = await prisma.job.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                companyId: true,
                companyName: true,
                companyLogo: true,
                description: true,
                location: true,
                category: true,
                tier: true,
                isDreamOffer: true,
                jobType: true,
                workMode: true,
                salary: true,
                minSalary: true,
                maxSalary: true,
                minCGPA: true,
                allowedBranches: true,
                eligibleBatch: true,
                maxBacklogs: true,
                requiredSkills: true,
                preferredSkills: true,
                deadline: true,
                startDate: true,
                noOfPositions: true,
                status: true,
                isVisible: true,
                googleFormUrl: true,
                createdAt: true,
                updatedAt: true,
                updates: {
                    orderBy: { createdAt: "desc" },
                    take: 5,
                    select: {
                        id: true,
                        title: true,
                        message: true,
                        createdAt: true
                    }
                },
                customFields: {
                    orderBy: { createdAt: "asc" },
                    select: {
                        id: true,
                        label: true,
                        type: true,
                        required: true,
                        options: true
                    }
                },
                _count: {
                    select: {
                        applications: {
                            where: { isRemoved: false }
                        }
                    }
                }
            }
        })

        if (!job) {
            return NextResponse.json(
                { error: "Job not found" },
                { status: 404 }
            )
        }

        // Check if user has already applied
        const existingApplication = await prisma.application.findFirst({
            where: {
                userId: session.user.id,
                jobId: id,
                isRemoved: false
            },
            select: { id: true, appliedAt: true }
        })

        const hasApplied = !!existingApplication

        // Get user profile and placement status for eligibility check
        const [userProfile, userPlacements] = await Promise.all([
            prisma.profile.findUnique({
                where: { userId: session.user.id },
                select: {
                    branch: true,
                    batch: true,
                    finalCgpa: true,
                    cgpa: true,
                    activeBacklogs: true,
                    hasBacklogs: true,
                    kycStatus: true,
                }
            }),
            prisma.placement.findMany({
                where: { userId: session.user.id },
                select: { tier: true, isException: true }
            })
        ])

        // Determine highest tier placement
        let highestTierPlacement: string | null = null
        const tierOrder = ["TIER_1", "TIER_2", "TIER_3", "DREAM"]
        for (const placement of userPlacements) {
            if (!placement.isException) {
                if (!highestTierPlacement || tierOrder.indexOf(placement.tier) < tierOrder.indexOf(highestTierPlacement)) {
                    highestTierPlacement = placement.tier
                }
            }
        }

        // Calculate eligibility
        let isEligible = true
        const eligibilityIssues: string[] = []

        const tierCheck = canApplyToTier(highestTierPlacement, job.tier, job.isDreamOffer)
        if (!tierCheck.eligible) {
            isEligible = false
            if (tierCheck.reason) eligibilityIssues.push(tierCheck.reason)
        }

        if (userProfile) {
            const cgpa = userProfile.finalCgpa || userProfile.cgpa || 0

            if (job.minCGPA && cgpa < job.minCGPA) {
                isEligible = false
                eligibilityIssues.push(`Minimum CGPA required: ${job.minCGPA} (yours: ${cgpa.toFixed(2)})`)
            }

            if (job.allowedBranches.length > 0 && userProfile.branch) {
                if (!job.allowedBranches.includes(userProfile.branch)) {
                    isEligible = false
                    eligibilityIssues.push(`Your branch (${userProfile.branch}) is not eligible`)
                }
            }

            if (job.eligibleBatch && userProfile.batch) {
                const studentBatchYear = getBatchYear(userProfile.batch)
                const jobBatchYear = getBatchYear(job.eligibleBatch)
                if (studentBatchYear !== jobBatchYear) {
                    isEligible = false
                    eligibilityIssues.push(`Only ${job.eligibleBatch} batch is eligible`)
                }
            }

            const hasActiveBacklogs = userProfile.activeBacklogs || userProfile.hasBacklogs === "yes"
            if (job.maxBacklogs !== null && job.maxBacklogs === 0 && hasActiveBacklogs) {
                isEligible = false
                eligibilityIssues.push(`No active backlogs allowed`)
            }
        }

        if (job.deadline && new Date(job.deadline) < new Date()) {
            isEligible = false
            eligibilityIssues.push("Application deadline has passed")
        }

        return NextResponse.json({
            job: {
                ...job,
                isEligible,
                eligibilityIssues,
                hasUpdates: job.updates?.length > 0,
                latestUpdate: job.updates?.[0] || null
            },
            hasApplied,
            appliedAt: existingApplication?.appliedAt || null,
            userPlacementTier: highestTierPlacement,
        })

    } catch (error: any) {
        console.error("Error fetching job detail:", error)
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error.message || "Unknown error",
            },
            { status: 500 }
        )
    }
}
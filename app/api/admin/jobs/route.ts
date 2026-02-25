import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, sanitizeInput, logSecurityEvent } from "@/lib/auth-helpers"
import { emitNotification } from "@/lib/socket"

// Helper to determine tier from salary
function determineTier(salary: number | null, isDreamOffer: boolean): string {
    if (isDreamOffer) return "DREAM"
    if (!salary) return "TIER_3"
    if (salary > 9) return "TIER_1"
    if (salary > 5) return "TIER_2"
    return "TIER_3"
}

// Helper to notify eligible students about new job
async function notifyEligibleStudents(jobId: string, jobTitle: string, companyName: string, allowedBranches: string[] | null, salary: number | null) {
    try {
        // Get eligible students (with verified KYC and matching branch)
        // If allowedBranches is null or empty, it means ALL branches are allowed
        const branchFilter = allowedBranches && allowedBranches.length > 0
            ? { branch: { in: allowedBranches as any } }
            : {}

        const eligibleUsers = await prisma.user.findMany({
            where: {
                role: "STUDENT",
            },
            select: { id: true }
        })

        console.log(`DEBUG: Found ${eligibleUsers.length} eligible students for job ${jobTitle}.`)
        if (eligibleUsers.length > 0) {
            console.log("DEBUG: Sample eligible userId:", eligibleUsers[0].id)
        }

        if (eligibleUsers.length > 0) {
            // Get company logo for notifications
            const jobWithLogo = await prisma.job.findUnique({
                where: { id: jobId },
                select: { companyLogo: true }
            })
            const companyLogo = jobWithLogo?.companyLogo || null

            // Create notifications for all eligible students
            const notificationData = eligibleUsers.map((user: { id: string }) => ({
                userId: user.id,
                title: `New Job: ${jobTitle}`,
                message: `${companyName} is hiring! Check out the new job posting and apply before the deadline.`,
                type: "JOB_POSTED" as const,
                data: {
                    jobId,
                    salary: salary ? `${salary} LPA` : "Not Disclosed",
                    eligibility: allowedBranches && allowedBranches.length > 0 ? allowedBranches.join(", ") : "All Branches",
                    companyName,
                    jobTitle,
                    companyLogo
                }
            }))

            await prisma.notification.createMany({
                data: notificationData
            })

            // Emit socket events and send FCM notifications
            const { sendMulticastFCMNotification } = await import("@/lib/firebase-admin")

            // Emit socket events
            for (const user of eligibleUsers) {
                const notification = notificationData.find(n => n.userId === user.id)
                if (notification) {
                    emitNotification(user.id, notification)
                }
            }

            // Send FCM multicast notifications
            const usersWithTokens = await (prisma.user as any).findMany({
                where: {
                    id: { in: eligibleUsers.map(u => u.id) },
                    fcmToken: { not: null }
                },
                select: { fcmToken: true }
            })

            const tokens = usersWithTokens.map((u: any) => u.fcmToken as string)
            if (tokens.length > 0) {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3500'
                await sendMulticastFCMNotification(
                    tokens,
                    `New Job: ${jobTitle}`,
                    `${companyName} is hiring! Check out the new job posting.`,
                    {
                        jobId,
                        companyName,
                        jobTitle,
                        companyLogo: companyLogo || ""
                    },
                    `${appUrl}/jobs/${jobId}`
                )
            }
        }

        return eligibleUsers.length
    } catch (error) {
        console.error("Error notifying students:", error)
        return 0
    }
}

// GET - List all jobs (for admin)
export async function GET(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()

        if (error || !session) {
            logSecurityEvent("unauthorized_admin_access", {
                endpoint: "/api/admin/jobs",
                ip: request.headers.get("x-forwarded-for") || "unknown"
            })
            return error
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get("status")
        const category = searchParams.get("category")
        const tier = searchParams.get("tier")
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "10")
        const skip = (page - 1) * limit

        const where: any = {}
        if (status && status !== "ALL") {
            where.status = status
        }
        if (category && category !== "ALL") {
            where.category = category
        }
        if (tier && tier !== "ALL") {
            where.tier = tier
        }

        const [jobs, total] = await Promise.all([
            prisma.job.findMany({
                where,
                orderBy: {
                    createdAt: "desc"
                },
                skip,
                take: limit,
                include: {
                    company: {
                        select: { id: true, name: true, logo: true }
                    },
                    _count: {
                        select: {
                            applications: {
                                where: { isRemoved: false }
                            }
                        }
                    }
                }
            }),
            prisma.job.count({ where })
        ])

        return NextResponse.json({
            jobs,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        })

    } catch (error) {
        console.error("Error fetching jobs:", error)
        logSecurityEvent("jobs_fetch_error", {
            error: error instanceof Error ? error.message : "Unknown error"
        })
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

// POST - Create a new job
export async function POST(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()

        if (error || !session) {
            logSecurityEvent("unauthorized_admin_access", {
                endpoint: "/api/admin/jobs",
                ip: request.headers.get("x-forwarded-for") || "unknown"
            })
            return error
        }

        const data = await request.json()

        // Validate required fields
        if (!data.title || !data.companyName || !data.description || !data.location) {
            return NextResponse.json(
                { error: "Missing required fields: title, companyName, description, location" },
                { status: 400 }
            )
        }

        // Determine tier from salary
        const maxSalary = data.maxSalary ? parseFloat(data.maxSalary) : null
        const tier = data.tier || determineTier(maxSalary, data.isDreamOffer || false)

        // Sanitize inputs
        const sanitizedData = {
            title: sanitizeInput(data.title),
            companyId: data.companyId || null,
            companyName: sanitizeInput(data.companyName),
            description: data.description, // HTML content
            location: sanitizeInput(data.location),
            category: data.category || "FTE",
            tier: tier,
            isDreamOffer: data.isDreamOffer || false,
            jobType: data.jobType || "FULL_TIME",
            workMode: data.workMode || "OFFICE",
            minCGPA: data.minCGPA ? parseFloat(data.minCGPA) : null,
            allowedBranches: data.allowedBranches || [],
            eligibleBatch: data.eligibleBatch ? sanitizeInput(data.eligibleBatch) : null,
            maxBacklogs: (data.maxBacklogs !== undefined && data.maxBacklogs !== null) ? parseInt(data.maxBacklogs) : null,
            salary: data.salary ? Math.round(parseFloat(data.salary.toString().replace(/[^0-9.]/g, '')) || 0) : null,
            minSalary: data.minSalary ? parseFloat(data.minSalary) : null,
            maxSalary: maxSalary,
            companyLogo: data.companyLogo || null,
            deadline: data.deadline ? new Date(data.deadline) : null,
            startDate: data.startDate ? new Date(data.startDate) : null,
            noOfPositions: data.noOfPositions ? parseInt(data.noOfPositions) : 1,
            status: data.status || "DRAFT",
            isVisible: data.isVisible !== undefined ? data.isVisible : true,
            postedBy: session.user.id,
            customFields: data.customFields && Array.isArray(data.customFields) ? {
                create: data.customFields.map((field: any) => ({
                    label: field.label,
                    type: field.type,
                    required: field.required || false,
                    options: field.options || null
                }))
            } : undefined
        }

        const job = await prisma.job.create({
            data: sanitizedData
        })

        // Send notifications to eligible students if job is ACTIVE
        let notifiedCount = 0
        if (job.status === "ACTIVE") {
            notifiedCount = await notifyEligibleStudents(
                job.id,
                job.title,
                job.companyName,
                job.allowedBranches,
                job.salary
            )
        }

        logSecurityEvent("job_created", {
            adminId: session.user.id,
            jobId: job.id,
            company: job.companyName,
            tier: job.tier,
            notifiedStudents: notifiedCount,
            timestamp: new Date().toISOString()
        })

        return NextResponse.json({
            success: true,
            job,
            notifiedStudents: notifiedCount
        }, { status: 201 })

    } catch (error) {
        console.error("Error creating job:", error)
        logSecurityEvent("job_creation_error", {
            error: error instanceof Error ? error.message : "Unknown error"
        })
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

// PUT - Update a job
export async function PUT(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()

        if (error || !session) {
            return error
        }

        const data = await request.json()
        const { id, ...updateData } = data

        if (!id) {
            return NextResponse.json(
                { error: "Job ID is required" },
                { status: 400 }
            )
        }

        // Check if job exists
        const existingJob = await prisma.job.findUnique({
            where: { id }
        })

        if (!existingJob) {
            return NextResponse.json(
                { error: "Job not found" },
                { status: 404 }
            )
        }

        // Sanitize and prepare update data
        const sanitizedData: any = {}

        if (updateData.title) sanitizedData.title = sanitizeInput(updateData.title)
        if (updateData.companyId !== undefined) sanitizedData.companyId = updateData.companyId
        if (updateData.companyName) sanitizedData.companyName = sanitizeInput(updateData.companyName)
        if (updateData.description) sanitizedData.description = updateData.description
        if (updateData.location) sanitizedData.location = sanitizeInput(updateData.location)
        if (updateData.category) sanitizedData.category = updateData.category
        if (updateData.tier) sanitizedData.tier = updateData.tier
        if (updateData.isDreamOffer !== undefined) sanitizedData.isDreamOffer = updateData.isDreamOffer
        if (updateData.jobType) sanitizedData.jobType = updateData.jobType
        if (updateData.workMode) sanitizedData.workMode = updateData.workMode
        if (updateData.minCGPA !== undefined) sanitizedData.minCGPA = updateData.minCGPA ? parseFloat(updateData.minCGPA) : null
        if (updateData.allowedBranches !== undefined) sanitizedData.allowedBranches = updateData.allowedBranches || []
        if (updateData.eligibleBatch !== undefined) sanitizedData.eligibleBatch = updateData.eligibleBatch ? sanitizeInput(updateData.eligibleBatch) : null
        if (updateData.maxBacklogs !== undefined) sanitizedData.maxBacklogs = (updateData.maxBacklogs !== null) ? parseInt(updateData.maxBacklogs) : null
        if (updateData.salary !== undefined) sanitizedData.salary = updateData.salary ? Math.round(parseFloat(updateData.salary.toString().replace(/[^0-9.]/g, '')) || 0) : null
        if (updateData.minSalary !== undefined) sanitizedData.minSalary = updateData.minSalary ? parseFloat(updateData.minSalary) : null
        if (updateData.maxSalary !== undefined) sanitizedData.maxSalary = updateData.maxSalary ? parseFloat(updateData.maxSalary) : null
        if (updateData.companyLogo !== undefined) sanitizedData.companyLogo = updateData.companyLogo
        if (updateData.deadline !== undefined) sanitizedData.deadline = updateData.deadline ? new Date(updateData.deadline) : null
        if (updateData.startDate !== undefined) sanitizedData.startDate = updateData.startDate ? new Date(updateData.startDate) : null
        if (updateData.noOfPositions !== undefined) sanitizedData.noOfPositions = parseInt(updateData.noOfPositions)
        if (updateData.status) sanitizedData.status = updateData.status
        if (updateData.isVisible !== undefined) sanitizedData.isVisible = updateData.isVisible

        // Handle custom fields update
        if (updateData.customFields && Array.isArray(updateData.customFields)) {
            sanitizedData.customFields = {
                deleteMany: {}, // Simple approach: replace all
                create: updateData.customFields.map((field: any) => ({
                    label: field.label,
                    type: field.type,
                    required: field.required || false,
                    options: field.options || null
                }))
            }
        }

        // Check if deadline was extended
        const deadlineExtended = updateData.deadline &&
            existingJob.deadline &&
            new Date(updateData.deadline) > existingJob.deadline

        const job = await prisma.job.update({
            where: { id },
            data: sanitizedData
        })

        // If deadline was extended, notify all students
        if (deadlineExtended) {
            // Re-fetch eligible profiles based on new/existing criteria
            const branchFilter = job.allowedBranches && job.allowedBranches.length > 0
                ? { branch: { in: job.allowedBranches as any } }
                : {}

            const eligibleProfiles = await prisma.profile.findMany({
                where: {
                    kycStatus: "VERIFIED",
                    ...branchFilter
                },
                select: { userId: true }
            })

            if (eligibleProfiles.length > 0) {
                await prisma.notification.createMany({
                    data: eligibleProfiles.map((profile: { userId: string }) => ({
                        userId: profile.userId,
                        title: `Deadline Extended: ${job.title}`,
                        message: `Good news! The deadline for ${job.companyName} - ${job.title} has been extended. Apply now!`,
                        type: "JOB_DEADLINE_EXTENDED" as const,
                        data: { jobId: job.id }
                    }))
                })
            }
        }

        logSecurityEvent("job_updated", {
            adminId: session.user.id,
            jobId: job.id,
            deadlineExtended,
            timestamp: new Date().toISOString()
        })

        return NextResponse.json({ success: true, job, deadlineExtended })

    } catch (error) {
        console.error("Error updating job:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

// DELETE - Delete a job
export async function DELETE(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()

        if (error || !session) {
            return error
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json(
                { error: "Job ID is required" },
                { status: 400 }
            )
        }

        // Check if job has applications
        const job = await prisma.job.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        applications: true
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

        if (job._count.applications > 0) {
            return NextResponse.json(
                { error: "Cannot delete job with existing applications. Consider closing it instead." },
                { status: 400 }
            )
        }

        await prisma.job.delete({
            where: { id }
        })

        logSecurityEvent("job_deleted", {
            adminId: session.user.id,
            jobId: id,
            timestamp: new Date().toISOString()
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("Error deleting job:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

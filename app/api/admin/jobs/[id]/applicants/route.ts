import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, logSecurityEvent } from "@/lib/auth-helpers"

type ApplicationWithUser = {
    id: string
    appliedAt: Date
    isRemoved: boolean
    removedAt: Date | null
    removedBy: string | null
    removalReason: string | null
    resumeUsed: string | null
    user: {
        id: string
        name: string | null
        email: string
        profile: {
            firstName: string | null
            lastName: string | null
            branch: string | null
            batch: string | null
            usn: string | null
            finalCgpa: number | null
            cgpa: number | null
            callingMobile: string | null
            whatsappMobile: string | null
            resumeUpload: string | null
            resume: string | null
            linkedinLink: string | null
            githubLink: string | null
            kycStatus: string | null
        } | null
    }
}

// GET - Get applicants for a job
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, session } = await requireAdmin()
        if (error || !session) {
            return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: jobId } = await params
        const { searchParams } = request.nextUrl
        const includeRemoved = searchParams.get("includeRemoved") === "true"
        const search = searchParams.get("search") || ""

        // Verify job exists
        const job = await prisma.job.findUnique({
            where: { id: jobId },
            select: { id: true, title: true, companyName: true }
        })

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 })
        }

        const applications = await prisma.application.findMany({
            where: {
                jobId,
                ...(includeRemoved ? {} : { isRemoved: false }),
                ...(search && {
                    user: {
                        OR: [
                            { name: { contains: search, mode: "insensitive" } },
                            { email: { contains: search, mode: "insensitive" } }
                        ]
                    }
                })
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profile: {
                            select: {
                                firstName: true,
                                lastName: true,
                                branch: true,
                                batch: true,
                                usn: true,
                                finalCgpa: true,
                                cgpa: true,
                                callingMobile: true,
                                whatsappMobile: true,
                                resumeUpload: true,
                                resume: true,
                                linkedinLink: true,
                                githubLink: true,
                                kycStatus: true
                            }
                        }
                    }
                }
            },
            orderBy: { appliedAt: "desc" }
        })

        // Format applicants data
        const applicants = applications.map((app: ApplicationWithUser) => ({
            applicationId: app.id,
            appliedAt: app.appliedAt,
            isRemoved: app.isRemoved,
            removedAt: app.removedAt,
            removedBy: app.removedBy,
            removalReason: app.removalReason,
            resumeUsed: app.resumeUsed,
            user: {
                id: app.user.id,
                name: app.user.name || `${app.user.profile?.firstName || ''} ${app.user.profile?.lastName || ''}`.trim(),
                email: app.user.email,
                usn: app.user.profile?.usn,
                branch: app.user.profile?.branch,
                batch: app.user.profile?.batch,
                cgpa: app.user.profile?.finalCgpa || app.user.profile?.cgpa,
                phone: app.user.profile?.callingMobile,
                whatsapp: app.user.profile?.whatsappMobile,
                resume: app.resumeUsed || app.user.profile?.resumeUpload || app.user.profile?.resume,
                linkedin: app.user.profile?.linkedinLink,
                github: app.user.profile?.githubLink,
                kycStatus: app.user.profile?.kycStatus
            }
        }))

        return NextResponse.json({
            job,
            applicants,
            total: applicants.length,
            activeCount: applicants.filter((a: { isRemoved: boolean }) => !a.isRemoved).length
        })

    } catch (error) {
        console.error("Error fetching applicants:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// DELETE - Remove an applicant (soft delete)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, session } = await requireAdmin()
        if (error || !session) {
            return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: jobId } = await params
        const { applicationId, reason } = await request.json()

        if (!applicationId) {
            return NextResponse.json({ error: "Application ID is required" }, { status: 400 })
        }

        // Update application as removed
        const application = await prisma.application.update({
            where: { id: applicationId },
            data: {
                isRemoved: true,
                removedAt: new Date(),
                removedBy: session.user.id,
                removalReason: reason || "Removed by admin"
            }
        })

        logSecurityEvent("applicant_removed", {
            adminId: session.user.id,
            jobId,
            applicationId,
            reason,
            timestamp: new Date().toISOString()
        })

        return NextResponse.json({ success: true, application })

    } catch (error) {
        console.error("Error removing applicant:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// PATCH - Restore a removed applicant
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, session } = await requireAdmin()
        if (error || !session) {
            return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: jobId } = await params
        const { applicationId } = await request.json()

        if (!applicationId) {
            return NextResponse.json({ error: "Application ID is required" }, { status: 400 })
        }

        const application = await prisma.application.update({
            where: { id: applicationId },
            data: {
                isRemoved: false,
                removedAt: null,
                removedBy: null,
                removalReason: null
            }
        })

        logSecurityEvent("applicant_restored", {
            adminId: session.user.id,
            jobId,
            applicationId,
            timestamp: new Date().toISOString()
        })

        return NextResponse.json({ success: true, application })

    } catch (error) {
        console.error("Error restoring applicant:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

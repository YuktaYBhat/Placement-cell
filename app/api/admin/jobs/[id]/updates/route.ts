import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, sanitizeInput } from "@/lib/auth-helpers"

// POST - Add an update to a job posting
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, session } = await requireAdmin()
        if (error || !session) {
            return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: jobId } = await params
        const { title, message } = await request.json()

        if (!title || !message) {
            return NextResponse.json(
                { error: "Title and message are required" },
                { status: 400 }
            )
        }

        // Check if job exists
        const job = await prisma.job.findUnique({
            where: { id: jobId },
            select: {
                id: true,
                title: true,
                companyName: true,
                allowedBranches: true
            }
        })

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 })
        }

        // Create the update
        const update = await prisma.jobUpdate.create({
            data: {
                jobId,
                title: sanitizeInput(title),
                message: sanitizeInput(message),
                createdBy: session.user.id
            }
        })

        // Notify all eligible students about the update
        const eligibleProfiles = await prisma.profile.findMany({
            where: {
                kycStatus: "VERIFIED",
                ...(job.allowedBranches.length > 0 && {
                    branch: { in: job.allowedBranches as any }
                })
            },
            select: { userId: true }
        })

        if (eligibleProfiles.length > 0) {
            await prisma.notification.createMany({
                data: eligibleProfiles.map((profile: { userId: string }) => ({
                    userId: profile.userId,
                    title: `Update: ${job.title}`,
                    message: `${job.companyName}: ${title}`,
                    type: "JOB_UPDATED" as const,
                    data: { jobId, updateId: update.id }
                }))
            })
        }

        return NextResponse.json({
            success: true,
            update,
            notifiedCount: eligibleProfiles.length
        }, { status: 201 })

    } catch (error) {
        console.error("Error adding job update:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

// GET - Get all updates for a job
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: jobId } = await params

        const updates = await prisma.jobUpdate.findMany({
            where: { jobId },
            orderBy: { createdAt: "desc" }
        })

        return NextResponse.json({ updates })

    } catch (error) {
        console.error("Error fetching job updates:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

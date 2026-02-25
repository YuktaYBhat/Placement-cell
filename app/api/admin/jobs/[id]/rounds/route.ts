import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-helpers"

// GET - Get rounds for a job
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, session } = await requireAdmin()
        if (error || !session) return error

        const { id: jobId } = await params

        const rounds = await prisma.jobRound.findMany({
            where: { jobId },
            orderBy: { order: "asc" },
            include: {
                sessions: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    select: {
                        id: true,
                        status: true,
                        startTime: true,
                        endTime: true,
                    },
                },
                _count: {
                    select: {
                        attendances: true,
                    },
                },
            },
        })

        return NextResponse.json({ rounds })
    } catch (error) {
        console.error("Error fetching rounds:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST - Add a new round to a job
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, session } = await requireAdmin()
        if (error || !session) return error

        const { id: jobId } = await params
        const { name, order } = await request.json()

        if (!name || order === undefined) {
            return NextResponse.json(
                { error: "Round name and order are required" },
                { status: 400 }
            )
        }

        // Check job exists
        const job = await prisma.job.findUnique({ where: { id: jobId } })
        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 })
        }

        // Check if order already exists (and is not removed)
        const existingRound = await prisma.jobRound.findFirst({
            where: { jobId, order, isRemoved: false },
        })
        if (existingRound) {
            // Shift orders up for existing rounds at or above this order
            await prisma.jobRound.updateMany({
                where: { jobId, order: { gte: order }, isRemoved: false },
                data: { order: { increment: 1 } },
            })
        }

        const round = await prisma.jobRound.create({
            data: {
                jobId,
                name,
                order,
            },
        })

        return NextResponse.json({ round }, { status: 201 })
    } catch (error) {
        console.error("Error creating round:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// PUT - Update rounds (reorder, rename, remove)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, session } = await requireAdmin()
        if (error || !session) return error

        const { id: jobId } = await params
        const { roundId, action, name, order } = await request.json()

        if (!roundId || !action) {
            return NextResponse.json(
                { error: "roundId and action are required" },
                { status: 400 }
            )
        }

        const round = await prisma.jobRound.findFirst({
            where: { id: roundId, jobId },
        })

        if (!round) {
            return NextResponse.json({ error: "Round not found" }, { status: 404 })
        }

        switch (action) {
            case "rename": {
                if (!name) {
                    return NextResponse.json({ error: "Name is required for rename" }, { status: 400 })
                }
                const updated = await prisma.jobRound.update({
                    where: { id: roundId },
                    data: { name },
                })
                return NextResponse.json({ round: updated })
            }

            case "remove": {
                // Check if round has any active sessions
                const activeSession = await prisma.driveSession.findFirst({
                    where: { roundId, status: "ACTIVE" },
                })
                if (activeSession) {
                    return NextResponse.json(
                        { error: "Cannot remove round with active session. Close the session first." },
                        { status: 400 }
                    )
                }
                const updated = await prisma.jobRound.update({
                    where: { id: roundId },
                    data: { isRemoved: true },
                })
                return NextResponse.json({ round: updated })
            }

            case "restore": {
                const updated = await prisma.jobRound.update({
                    where: { id: roundId },
                    data: { isRemoved: false },
                })
                return NextResponse.json({ round: updated })
            }

            case "reorder": {
                if (order === undefined) {
                    return NextResponse.json({ error: "Order is required for reorder" }, { status: 400 })
                }
                const updated = await prisma.jobRound.update({
                    where: { id: roundId },
                    data: { order },
                })
                return NextResponse.json({ round: updated })
            }

            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 })
        }
    } catch (error) {
        console.error("Error updating round:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

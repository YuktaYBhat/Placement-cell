import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, logSecurityEvent } from "@/lib/auth-helpers"

// GET - Get all sessions for a job
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, session } = await requireAdmin()
        if (error || !session) return error

        const { id: jobId } = await params
        const { searchParams } = new URL(request.url)
        const roundId = searchParams.get("roundId")

        const where: any = { jobId }
        if (roundId) where.roundId = roundId

        const sessions = await prisma.driveSession.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                round: {
                    select: { id: true, name: true, order: true },
                },
                _count: {
                    select: { attendances: true },
                },
            },
        })

        return NextResponse.json({ sessions })
    } catch (error) {
        console.error("Error fetching sessions:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST - Start a new session for a round
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, session } = await requireAdmin()
        if (error || !session) return error

        const { id: jobId } = await params
        const { roundId } = await request.json()

        if (!roundId) {
            return NextResponse.json({ error: "roundId is required" }, { status: 400 })
        }

        // Check round exists and belongs to this job
        const round = await prisma.jobRound.findFirst({
            where: { id: roundId, jobId, isRemoved: false },
        })

        if (!round) {
            return NextResponse.json({ error: "Round not found or removed" }, { status: 404 })
        }

        // Check no ACTIVE session exists for this round
        const activeSession = await prisma.driveSession.findFirst({
            where: { roundId, status: "ACTIVE" },
        })

        if (activeSession) {
            return NextResponse.json(
                { error: "An active session already exists for this round" },
                { status: 400 }
            )
        }

        // Check no PERM_CLOSED session exists (can't reopen permanently closed)
        const permClosedSession = await prisma.driveSession.findFirst({
            where: { roundId, status: "PERM_CLOSED" },
        })

        if (permClosedSession) {
            return NextResponse.json(
                { error: "This round has been permanently closed. Cannot start a new session." },
                { status: 400 }
            )
        }

        const driveSession = await prisma.driveSession.create({
            data: {
                jobId,
                roundId,
                status: "ACTIVE",
                createdBy: session.user.id,
            },
            include: {
                round: { select: { name: true, order: true } },
            },
        })

        logSecurityEvent("session_started", {
            adminId: session.user.id,
            jobId,
            roundId,
            sessionId: driveSession.id,
        })

        return NextResponse.json({ session: driveSession }, { status: 201 })
    } catch (error) {
        console.error("Error starting session:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// PUT - Update session status (TEMP_CLOSE, PERM_CLOSE, REOPEN)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, session } = await requireAdmin()
        if (error || !session) return error

        const { id: jobId } = await params
        const { sessionId, action } = await request.json()

        if (!sessionId || !action) {
            return NextResponse.json(
                { error: "sessionId and action are required" },
                { status: 400 }
            )
        }

        const driveSession = await prisma.driveSession.findFirst({
            where: { id: sessionId, jobId },
        })

        if (!driveSession) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 })
        }

        switch (action) {
            case "TEMP_CLOSE": {
                if (driveSession.status !== "ACTIVE") {
                    return NextResponse.json(
                        { error: "Can only temporarily close an active session" },
                        { status: 400 }
                    )
                }
                const updated = await prisma.driveSession.update({
                    where: { id: sessionId },
                    data: { status: "TEMP_CLOSED" },
                    include: { round: { select: { name: true } } },
                })

                logSecurityEvent("session_temp_closed", {
                    adminId: session.user.id,
                    sessionId,
                })

                return NextResponse.json({ session: updated })
            }

            case "PERM_CLOSE": {
                if (driveSession.status === "PERM_CLOSED") {
                    return NextResponse.json(
                        { error: "Session is already permanently closed" },
                        { status: 400 }
                    )
                }
                const updated = await prisma.driveSession.update({
                    where: { id: sessionId },
                    data: {
                        status: "PERM_CLOSED",
                        endTime: new Date(),
                    },
                    include: { round: { select: { name: true } } },
                })

                logSecurityEvent("session_perm_closed", {
                    adminId: session.user.id,
                    sessionId,
                })

                return NextResponse.json({ session: updated })
            }

            case "REOPEN": {
                if (driveSession.status !== "TEMP_CLOSED") {
                    return NextResponse.json(
                        { error: "Can only reopen a temporarily closed session" },
                        { status: 400 }
                    )
                }
                const updated = await prisma.driveSession.update({
                    where: { id: sessionId },
                    data: { status: "ACTIVE" },
                    include: { round: { select: { name: true } } },
                })

                logSecurityEvent("session_reopened", {
                    adminId: session.user.id,
                    sessionId,
                })

                return NextResponse.json({ session: updated })
            }

            default:
                return NextResponse.json({ error: "Invalid action. Use TEMP_CLOSE, PERM_CLOSE, or REOPEN" }, { status: 400 })
        }
    } catch (error) {
        console.error("Error updating session:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

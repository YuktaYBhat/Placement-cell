import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, logSecurityEvent } from "@/lib/auth-helpers"

// POST - Admin confirms attendance after scanning QR and reviewing student info
export async function POST(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()

        if (error || !session) {
            return error
        }

        const { userId, jobId, roundId, sessionId } = await request.json()

        if (!userId || !jobId || !roundId || !sessionId) {
            return NextResponse.json(
                { error: "userId, jobId, roundId, and sessionId are all required" },
                { status: 400 }
            )
        }

        // Re-validate everything to prevent race conditions

        // 1. Session still active?
        const driveSession = await prisma.driveSession.findFirst({
            where: { id: sessionId, status: "ACTIVE" },
            include: { round: { select: { name: true } } },
        })

        if (!driveSession) {
            return NextResponse.json(
                { error: "Session is no longer active" },
                { status: 400 }
            )
        }

        // 2. Student still applied?
        const application = await prisma.application.findFirst({
            where: { jobId, userId, isRemoved: false },
        })

        if (!application) {
            return NextResponse.json(
                { error: "Student application not found" },
                { status: 400 }
            )
        }

        // 3. Not already attended?
        const existing = await prisma.roundAttendance.findUnique({
            where: { userId_roundId: { userId, roundId } },
        })

        if (existing) {
            return NextResponse.json(
                { error: "Attendance already recorded for this round" },
                { status: 409 }
            )
        }

        // 4. Create attendance record
        const attendance = await prisma.roundAttendance.create({
            data: {
                userId,
                jobId,
                roundId,
                sessionId,
                markedByAdminId: session.user.id,
                status: "ATTENDED",
            },
            include: {
                user: { select: { name: true, email: true } },
                round: { select: { name: true, order: true } },
            },
        })

        logSecurityEvent("round_attendance_confirmed", {
            adminId: session.user.id,
            userId,
            jobId,
            roundId,
            sessionId,
            attendanceId: attendance.id,
        })

        return NextResponse.json({
            success: true,
            message: `Attendance confirmed for ${driveSession.round.name}`,
            attendance,
        })
    } catch (error) {
        console.error("Error confirming attendance:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

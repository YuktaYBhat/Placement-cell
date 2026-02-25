import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { generateQRToken } from "@/lib/qr-token"

// GET - Get QR token and round status for a student's job application
export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const jobId = searchParams.get("jobId")

        if (!jobId) {
            return NextResponse.json({ error: "jobId is required" }, { status: 400 })
        }

        // Check student has applied to this job
        const application = await prisma.application.findFirst({
            where: {
                jobId,
                userId: session.user.id,
                isRemoved: false,
            },
        })

        if (!application) {
            return NextResponse.json(
                { error: "You have not applied to this job" },
                { status: 403 }
            )
        }

        // Check student is KYC verified
        const profile = await prisma.profile.findUnique({
            where: { userId: session.user.id },
            select: { kycStatus: true },
        })

        if (!profile || profile.kycStatus !== "VERIFIED") {
            return NextResponse.json(
                { error: "Your KYC must be verified to access attendance", kycRequired: true },
                { status: 403 }
            )
        }

        // Get all rounds for this job
        const rounds = await prisma.jobRound.findMany({
            where: { jobId, isRemoved: false },
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
            },
        })

        // Get student's attendance for all rounds of this job
        const attendances = await prisma.roundAttendance.findMany({
            where: {
                userId: session.user.id,
                jobId,
            },
            include: {
                round: { select: { id: true, name: true, order: true } },
            },
        })

        const attendanceMap = new Map(attendances.map((a) => [a.roundId, a]))

        // Build round status for student
        const roundStatuses = rounds.map((round) => {
            const latestSession = round.sessions[0] || null
            const attendance = attendanceMap.get(round.id)

            let status: string
            let qrToken: string | null = null

            if (attendance) {
                // Already attended this round
                status = `ATTENDED_${attendance.status}`
            } else if (!latestSession) {
                status = "NOT_STARTED"
            } else if (latestSession.status === "ACTIVE") {
                // Check eligibility for this round (must have passed previous rounds)
                const isEligible = checkEligibilityForRound(round.order, rounds, attendanceMap)
                if (isEligible) {
                    // Generate a fresh signed QR token
                    qrToken = generateQRToken({
                        userId: session.user.id,
                        jobId,
                        roundId: round.id,
                        sessionId: latestSession.id,
                    })
                    status = "ACTIVE"
                } else {
                    status = "NOT_ELIGIBLE"
                }
            } else if (latestSession.status === "TEMP_CLOSED") {
                status = "TEMP_CLOSED"
            } else if (latestSession.status === "PERM_CLOSED") {
                status = "PERM_CLOSED"
            } else {
                status = "NOT_STARTED"
            }

            return {
                roundId: round.id,
                roundName: round.name,
                roundOrder: round.order,
                status,
                qrToken,
                attendance: attendance
                    ? {
                        markedAt: attendance.markedAt,
                        result: attendance.status,
                    }
                    : null,
            }
        })

        return NextResponse.json({ rounds: roundStatuses })
    } catch (error) {
        console.error("Error generating attendance QR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

/**
 * Check if student is eligible for a given round
 * Student must have attended (and not failed) all previous non-removed rounds
 */
function checkEligibilityForRound(
    targetOrder: number,
    allRounds: Array<{ id: string; order: number; isRemoved: boolean }>,
    attendanceMap: Map<string, { status: string }>
): boolean {
    // For round 1, everyone is eligible
    if (targetOrder === 1) return true

    // Check all previous rounds (by order)
    const previousRounds = allRounds
        .filter((r) => r.order < targetOrder && !r.isRemoved)
        .sort((a, b) => a.order - b.order)

    for (const prevRound of previousRounds) {
        const attendance = attendanceMap.get(prevRound.id)
        if (!attendance) return false // Not attended
        if (attendance.status === "FAILED") return false // Failed
    }

    return true
}

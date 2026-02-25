import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, logSecurityEvent } from "@/lib/auth-helpers"

// GET - Get attendance records for a job (filterable by round)
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
        const status = searchParams.get("status")
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "50")
        const skip = (page - 1) * limit

        const where: any = { jobId }
        if (roundId) where.roundId = roundId
        if (status) where.status = status

        const [attendances, total] = await Promise.all([
            prisma.roundAttendance.findMany({
                where,
                orderBy: { markedAt: "desc" },
                skip,
                take: limit,
                include: {
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                    round: {
                        select: { id: true, name: true, order: true },
                    },
                    session: {
                        select: { id: true, status: true },
                    },
                },
            }),
            prisma.roundAttendance.count({ where }),
        ])

        // Enrich with profile data
        const userIds = attendances.map((a) => a.userId)
        const profiles = await prisma.profile.findMany({
            where: { userId: { in: userIds } },
            select: {
                userId: true,
                usn: true,
                branch: true,
                profilePhoto: true,
                finalCgpa: true,
                cgpa: true,
                resumeUpload: true,
                resume: true,
                firstName: true,
                lastName: true,
            },
        })

        const profileMap = new Map(profiles.map((p) => [p.userId, p]))

        const enriched = attendances.map((a) => ({
            ...a,
            profile: profileMap.get(a.userId) || null,
        }))

        return NextResponse.json({
            attendances: enriched,
            pagination: { total, page, limit, pages: Math.ceil(total / limit) },
        })
    } catch (error) {
        console.error("Error fetching round attendance:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// PUT - Update attendance status (PASSED/FAILED)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, session } = await requireAdmin()
        if (error || !session) return error

        const { id: jobId } = await params
        const { attendanceId, status } = await request.json()

        if (!attendanceId || !status) {
            return NextResponse.json(
                { error: "attendanceId and status are required" },
                { status: 400 }
            )
        }

        if (!["ATTENDED", "PASSED", "FAILED"].includes(status)) {
            return NextResponse.json(
                { error: "Invalid status. Use ATTENDED, PASSED, or FAILED" },
                { status: 400 }
            )
        }

        const attendance = await prisma.roundAttendance.findFirst({
            where: { id: attendanceId, jobId },
        })

        if (!attendance) {
            return NextResponse.json({ error: "Attendance record not found" }, { status: 404 })
        }

        const updated = await prisma.roundAttendance.update({
            where: { id: attendanceId },
            data: { status },
            include: {
                user: { select: { name: true, email: true } },
                round: { select: { name: true } },
            },
        })

        logSecurityEvent("attendance_status_updated", {
            adminId: session.user.id,
            attendanceId,
            oldStatus: attendance.status,
            newStatus: status,
        })

        return NextResponse.json({ attendance: updated })
    } catch (error) {
        console.error("Error updating attendance status:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

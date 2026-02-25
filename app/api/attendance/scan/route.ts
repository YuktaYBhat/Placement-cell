import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, logSecurityEvent } from "@/lib/auth-helpers"
import { verifyQRToken } from "@/lib/qr-token"

// POST - Scan and validate a QR token for round-based attendance
export async function POST(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()

        if (error || !session) {
            return error
        }

        const { qrData, location, jobId: filterJobId } = await request.json()

        if (!qrData) {
            return NextResponse.json(
                { error: "QR data is required" },
                { status: 400 }
            )
        }

        // First try to verify as a signed token (new system)
        const tokenPayload = verifyQRToken(qrData)

        if (tokenPayload) {
            // === NEW ROUND-BASED FLOW ===
            return await handleRoundBasedScan(tokenPayload, session.user.id, location)
        }

        // === LEGACY FLOW (backward compatibility) ===
        // If token verification fails, try legacy application ID approach
        let applicationId: string
        try {
            const parsedData = JSON.parse(qrData)
            applicationId = parsedData.applicationId
        } catch {
            applicationId = qrData
        }

        // Find as legacy attendance
        const attendance = await prisma.attendance.findFirst({
            where: { qrCode: applicationId },
        })

        if (!attendance) {
            const application = await prisma.application.findUnique({
                where: { id: applicationId },
                include: {
                    job: { select: { id: true, title: true, companyName: true } },
                },
            })

            if (!application) {
                return NextResponse.json(
                    { error: "Invalid QR code - token verification failed and no matching application found" },
                    { status: 404 }
                )
            }

            if (filterJobId && application.jobId !== filterJobId) {
                return NextResponse.json(
                    { error: "This application is for a different job" },
                    { status: 400 }
                )
            }

            const newAttendance = await prisma.attendance.create({
                data: {
                    studentId: application.userId,
                    jobId: application.jobId,
                    qrCode: applicationId,
                    scannedAt: new Date(),
                    scannedBy: session.user.id,
                    location: location || null,
                },
            })

            const profile = await prisma.profile.findUnique({
                where: { userId: application.userId },
                include: { user: { select: { name: true, email: true } } },
            })

            logSecurityEvent("legacy_attendance_recorded", {
                adminId: session.user.id,
                applicationId,
                studentId: application.userId,
            })

            return NextResponse.json({
                success: true,
                message: "Attendance recorded successfully (legacy mode)",
                student: {
                    name: profile?.user?.name || `${profile?.firstName} ${profile?.lastName}`,
                    email: profile?.user?.email,
                    usn: profile?.usn,
                    branch: profile?.branch,
                },
                job: {
                    title: application.job.title,
                    company: application.job.companyName,
                },
                scannedAt: newAttendance.scannedAt,
            })
        }

        if (attendance.scannedAt) {
            const profile = await prisma.profile.findUnique({
                where: { userId: attendance.studentId },
                include: { user: { select: { name: true, email: true } } },
            })

            const job = attendance.jobId
                ? await prisma.job.findUnique({
                    where: { id: attendance.jobId },
                    select: { title: true, companyName: true },
                })
                : null

            return NextResponse.json(
                {
                    success: false,
                    message: "Attendance already recorded",
                    student: {
                        name: profile?.user?.name || `${profile?.firstName} ${profile?.lastName}`,
                        email: profile?.user?.email,
                        usn: profile?.usn,
                        branch: profile?.branch,
                    },
                    job: job ? { title: job.title, company: job.companyName } : null,
                    scannedAt: attendance.scannedAt,
                },
                { status: 409 }
            )
        }

        const updatedAttendance = await prisma.attendance.update({
            where: { id: attendance.id },
            data: {
                scannedAt: new Date(),
                scannedBy: session.user.id,
                location: location || attendance.location,
            },
        })

        const profile = await prisma.profile.findUnique({
            where: { userId: attendance.studentId },
            include: { user: { select: { name: true, email: true } } },
        })

        const job = attendance.jobId
            ? await prisma.job.findUnique({
                where: { id: attendance.jobId },
                select: { title: true, companyName: true },
            })
            : null

        return NextResponse.json({
            success: true,
            message: "Attendance recorded successfully",
            student: {
                name: profile?.user?.name || `${profile?.firstName} ${profile?.lastName}`,
                email: profile?.user?.email,
                usn: profile?.usn,
                branch: profile?.branch,
            },
            job: job ? { title: job.title, company: job.companyName } : null,
            scannedAt: updatedAttendance.scannedAt,
        })
    } catch (error) {
        console.error("Error recording attendance:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

/**
 * Handle round-based attendance from a signed QR token
 */
async function handleRoundBasedScan(
    payload: { userId: string; jobId: string; roundId: string; sessionId: string },
    adminId: string,
    location?: string
) {
    const { userId, jobId, roundId, sessionId } = payload

    // 1. Verify session is still ACTIVE
    const driveSession = await prisma.driveSession.findFirst({
        where: { id: sessionId, jobId, roundId },
        include: {
            round: { select: { name: true, order: true } },
        },
    })

    if (!driveSession) {
        return NextResponse.json(
            { error: "Session not found. The QR code may be invalid." },
            { status: 404 }
        )
    }

    if (driveSession.status !== "ACTIVE") {
        return NextResponse.json(
            {
                error: `Session is ${driveSession.status === "TEMP_CLOSED" ? "temporarily" : "permanently"} closed. QR is no longer valid.`,
                sessionStatus: driveSession.status,
            },
            { status: 400 }
        )
    }

    // 2. Verify student has applied
    const application = await prisma.application.findFirst({
        where: { jobId, userId, isRemoved: false },
        include: {
            job: { select: { title: true, companyName: true } },
        },
    })

    if (!application) {
        return NextResponse.json(
            { error: "Student has not applied to this job" },
            { status: 400 }
        )
    }

    // 3. Verify KYC status
    const profile = await prisma.profile.findUnique({
        where: { userId },
        include: { user: { select: { name: true, email: true, image: true } } },
    })

    if (!profile || profile.kycStatus !== "VERIFIED") {
        return NextResponse.json(
            { error: "Student's KYC is not verified" },
            { status: 400 }
        )
    }

    // 4. Check not already attended
    const existingAttendance = await prisma.roundAttendance.findUnique({
        where: { userId_roundId: { userId, roundId } },
    })

    if (existingAttendance) {
        return NextResponse.json(
            {
                success: false,
                message: "Attendance already recorded for this round",
                alreadyAttended: true,
                student: {
                    name: profile.user?.name || `${profile.firstName} ${profile.lastName}`,
                    email: profile.user?.email,
                    usn: profile.usn,
                    branch: profile.branch,
                    photo: profile.profilePhoto || profile.user?.image,
                    cgpa: profile.finalCgpa || profile.cgpa,
                    resume: profile.resumeUpload || profile.resume,
                },
                round: {
                    name: driveSession.round.name,
                    order: driveSession.round.order,
                },
                job: {
                    title: application.job.title,
                    company: application.job.companyName,
                },
                markedAt: existingAttendance.markedAt,
            },
            { status: 409 }
        )
    }

    // 5. Check eligibility for this round (must have passed previous rounds)
    const allRounds = await prisma.jobRound.findMany({
        where: { jobId, isRemoved: false },
        orderBy: { order: "asc" },
    })

    const previousRounds = allRounds.filter((r) => r.order < driveSession.round.order)

    for (const prevRound of previousRounds) {
        const prevAttendance = await prisma.roundAttendance.findUnique({
            where: { userId_roundId: { userId, roundId: prevRound.id } },
        })

        if (!prevAttendance) {
            return NextResponse.json(
                {
                    error: `Student has not attended the "${prevRound.name}" round yet`,
                    missingRound: prevRound.name,
                },
                { status: 400 }
            )
        }

        if (prevAttendance.status === "FAILED") {
            return NextResponse.json(
                {
                    error: `Student failed the "${prevRound.name}" round and is not eligible`,
                    failedRound: prevRound.name,
                },
                { status: 400 }
            )
        }
    }

    // 6. All validations passed — return student info for admin confirmation
    // DON'T create attendance yet — admin must click "MARK ATTENDED"
    return NextResponse.json({
        success: true,
        message: "Student verified. Ready to mark attendance.",
        requireConfirmation: true,
        student: {
            name: profile.user?.name || `${profile.firstName} ${profile.lastName}`,
            email: profile.user?.email,
            usn: profile.usn,
            branch: profile.branch,
            photo: profile.profilePhoto || profile.user?.image,
            cgpa: profile.finalCgpa || profile.cgpa,
            resume: profile.resumeUpload || profile.resume,
        },
        round: {
            id: roundId,
            name: driveSession.round.name,
            order: driveSession.round.order,
        },
        job: {
            title: application.job.title,
            company: application.job.companyName,
        },
        tokenData: {
            userId,
            jobId,
            roundId,
            sessionId,
        },
    })
}

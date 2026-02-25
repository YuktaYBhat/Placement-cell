import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { NotificationType } from "@prisma/client"

// POST /api/admin/notifications - Send bulk notifications
export async function POST(req: Request) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        })

        if (user?.role !== 'ADMIN') {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        const body = await req.json()
        const {
            title,
            message,
            type = "SYSTEM",
            targetType, // "all", "verified", "branch", "batch", "specific"
            targetValue, // branch name, batch year, or array of user IDs
            data
        } = body

        if (!title || !message) {
            return NextResponse.json(
                { error: "Title and message are required" },
                { status: 400 }
            )
        }

        // Build user filter based on target type
        let userFilter: any = { role: 'STUDENT' }

        switch (targetType) {
            case "verified":
                userFilter.profile = { kycStatus: 'VERIFIED' }
                break
            case "branch":
                if (!targetValue) {
                    return NextResponse.json(
                        { error: "Branch is required for branch targeting" },
                        { status: 400 }
                    )
                }
                userFilter.profile = { branch: targetValue }
                break
            case "batch":
                if (!targetValue) {
                    return NextResponse.json(
                        { error: "Batch year is required for batch targeting" },
                        { status: 400 }
                    )
                }
                userFilter.profile = { graduationYear: parseInt(targetValue) }
                break
            case "specific":
                if (!targetValue || !Array.isArray(targetValue) || targetValue.length === 0) {
                    return NextResponse.json(
                        { error: "User IDs are required for specific targeting" },
                        { status: 400 }
                    )
                }
                userFilter = { id: { in: targetValue } }
                break
            case "all":
            default:
                // All students (already set)
                break
        }

        // Get target users
        const users = await prisma.user.findMany({
            where: userFilter,
            select: { id: true }
        })

        if (users.length === 0) {
            return NextResponse.json(
                { error: "No users match the target criteria" },
                { status: 400 }
            )
        }

        // Create notifications for all target users
        const notifications = await prisma.notification.createMany({
            data: users.map((user: { id: string }) => ({
                userId: user.id,
                title,
                message,
                type: type as NotificationType,
                data: data || null
            }))
        })

        return NextResponse.json({
            success: true,
            count: notifications.count,
            message: `Notification sent to ${notifications.count} users`
        })
    } catch (error) {
        console.error("Error sending notifications:", error)
        return NextResponse.json(
            { error: "Failed to send notifications" },
            { status: 500 }
        )
    }
}

// GET /api/admin/notifications - Get notification analytics
export async function GET(req: Request) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        })

        if (user?.role !== 'ADMIN') {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const days = parseInt(searchParams.get("days") || "7")

        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        // Get notification stats
        const [totalSent, totalRead, byType, recent] = await Promise.all([
            prisma.notification.count({
                where: { createdAt: { gte: startDate } }
            }),
            prisma.notification.count({
                where: {
                    createdAt: { gte: startDate },
                    isRead: true
                }
            }),
            prisma.notification.groupBy({
                by: ['type'],
                where: { createdAt: { gte: startDate } },
                _count: { type: true }
            }),
            prisma.notification.findMany({
                where: { createdAt: { gte: startDate } },
                orderBy: { createdAt: 'desc' },
                take: 10,
                distinct: ['title', 'message'],
                select: {
                    title: true,
                    message: true,
                    type: true,
                    createdAt: true
                }
            })
        ])

        return NextResponse.json({
            period: days,
            stats: {
                totalSent,
                totalRead,
                readRate: totalSent > 0 ? Math.round((totalRead / totalSent) * 100) : 0,
                byType
            },
            recent
        })
    } catch (error) {
        console.error("Error fetching notification analytics:", error)
        return NextResponse.json(
            { error: "Failed to fetch analytics" },
            { status: 500 }
        )
    }
}

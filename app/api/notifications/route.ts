import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// GET /api/notifications - Get user's notifications
export async function GET(req: Request) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const loggedInUserId = session.user.id

        const userProfile = await prisma.profile.findUnique({
            where: { userId: loggedInUserId }
        })

        const { searchParams } = new URL(req.url)
        const unreadOnly = searchParams.get("unread") === "true"
        const limit = parseInt(searchParams.get("limit") || "20")

        const notifications = await prisma.notification.findMany({
            where: {
                userId: loggedInUserId,
                ...(unreadOnly && { isRead: false }),
                OR: [
                    { scheduledAt: null },
                    { scheduledAt: { lte: new Date() } }
                ]
            },
            orderBy: { createdAt: "desc" },
            take: limit
        })


        // Get unread count
        const unreadCount = await prisma.notification.count({
            where: {
                userId: session.user.id,
                isRead: false,
                OR: [
                    { scheduledAt: null },
                    { scheduledAt: { lte: new Date() } }
                ]
            }
        })

        return NextResponse.json({
            notifications,
            unreadCount,
            userId: loggedInUserId,
        })
    } catch (error) {
        console.error("Error fetching notifications:", error)
        return NextResponse.json(
            { error: "Failed to fetch notifications" },
            { status: 500 }
        )
    }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(req: Request) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { notificationIds, markAllRead } = body

        if (markAllRead) {
            // Mark all notifications as read
            await prisma.notification.updateMany({
                where: {
                    userId: session.user.id,
                    isRead: false
                },
                data: {
                    isRead: true,
                    readAt: new Date()
                }
            })
        } else if (notificationIds && Array.isArray(notificationIds)) {
            // Mark specific notifications as read
            await prisma.notification.updateMany({
                where: {
                    id: { in: notificationIds },
                    userId: session.user.id
                },
                data: {
                    isRead: true,
                    readAt: new Date()
                }
            })
        } else {
            return NextResponse.json(
                { error: "Invalid request body" },
                { status: 400 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error updating notifications:", error)
        return NextResponse.json(
            { error: "Failed to update notifications" },
            { status: 500 }
        )
    }
}

// DELETE /api/notifications - Delete notifications
export async function DELETE(req: Request) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const notificationId = searchParams.get("id")
        const deleteAll = searchParams.get("all") === "true"

        if (deleteAll) {
            await prisma.notification.deleteMany({
                where: { userId: session.user.id }
            })
        } else if (notificationId) {
            await prisma.notification.delete({
                where: {
                    id: notificationId,
                    userId: session.user.id
                }
            })
        } else {
            return NextResponse.json(
                { error: "Notification ID or 'all' flag required" },
                { status: 400 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting notifications:", error)
        return NextResponse.json(
            { error: "Failed to delete notifications" },
            { status: 500 }
        )
    }
}


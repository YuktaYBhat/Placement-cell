import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: notificationId } = await params
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const notification = await prisma.notification.findFirst({
            where: {
                id: notificationId,
                userId: session.user.id
            },
            include: {
                files: true
            }
        })

        if (!notification) {
            return NextResponse.json({ error: "Notification not found" }, { status: 404 })
        }

        // Mark as read if it's being viewed
        if (!notification.isRead) {
            await prisma.notification.update({
                where: { id: notificationId },
                data: { isRead: true, readAt: new Date() }
            })
        }

        return NextResponse.json(notification)
    } catch (error) {
        console.error("Error fetching notification:", error)
        return NextResponse.json(
            { error: "Failed to fetch notification" },
            { status: 500 }
        )
    }
}

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import NotificationDetailClient from "./notification-detail-client"

interface PageProps {
    params: {
        id: string
    }
}

export default async function NotificationDetailPage({ params }: PageProps) {
    const { id: notificationId } = await params
    const session = await auth()

    if (!session?.user?.id) {
        redirect("/login")
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
        notFound()
    }

    // Mark as read (server-side for SEO/initial load efficiency)
    if (!notification.isRead) {
        await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true, readAt: new Date() }
        })
    }

    // Transform Decimal/Date/Json objects for Client Component
    const transformedNotification = {
        ...notification,
        createdAt: notification.createdAt.toISOString(),
        readAt: notification.readAt?.toISOString() || null,
        data: notification.data as any,
        files: notification.files.map(f => ({
            ...f,
            createdAt: f.createdAt.toISOString()
        }))
    }

    return <NotificationDetailClient notification={transformedNotification} />
}

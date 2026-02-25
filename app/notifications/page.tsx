import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { NotificationsClient } from "./notifications-client"
import { NotificationType } from "@prisma/client"

type Notification = {
    id: string
    userId: string
    type: NotificationType
    title: string
    message: string
    data: unknown
    isRead: boolean
    readAt: Date | null
    createdAt: Date
}

export default async function NotificationsPage() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect("/login")
    }

    const notifications = await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 50
    })

    // Transform Prisma types to match client component expectations
    const transformedNotifications = notifications.map((n: Notification) => ({
        ...n,
        data: n.data as Record<string, unknown> | undefined
    }))

    return <NotificationsClient initialNotifications={transformedNotifications} />
}

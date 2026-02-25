import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import webpush from "web-push"

// Configure web-push with VAPID keys
// Generate VAPID keys using: npx web-push generate-vapid-keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ""

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
        "mailto:placement@college.edu",
        vapidPublicKey,
        vapidPrivateKey
    )
}

interface SendNotificationRequest {
    title: string
    body: string
    url?: string
    userIds?: string[] // Specific users, or empty for all
    tag?: string
}

type PushSubscription = {
    endpoint: string
    p256dh: string
    auth: string
    userId: string
}

// POST - Send push notification (Admin only)
export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        })

        if (user?.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            )
        }

        const { title, body, url, userIds, tag }: SendNotificationRequest = await request.json()

        if (!title || !body) {
            return NextResponse.json(
                { error: "Title and body are required" },
                { status: 400 }
            )
        }

        // Get subscriptions
        let subscriptions
        if (userIds && userIds.length > 0) {
            subscriptions = await prisma.pushSubscription.findMany({
                where: { userId: { in: userIds } }
            })
        } else {
            subscriptions = await prisma.pushSubscription.findMany()
        }

        if (subscriptions.length === 0) {
            return NextResponse.json({
                success: true,
                sent: 0,
                message: "No subscriptions found"
            })
        }

        const payload = JSON.stringify({
            title,
            body,
            icon: "/images/logo.png",
            badge: "/images/badge.png",
            tag: tag || "notification",
            data: { url: url || "/" }
        })

        let successCount = 0
        let failedCount = 0
        const failedEndpoints: string[] = []

        // Send to all subscriptions
        await Promise.all(
            subscriptions.map(async (sub: PushSubscription) => {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: {
                                p256dh: sub.p256dh,
                                auth: sub.auth
                            }
                        },
                        payload
                    )
                    successCount++
                } catch (error: any) {
                    failedCount++
                    // If subscription is no longer valid, remove it
                    if (error.statusCode === 404 || error.statusCode === 410) {
                        failedEndpoints.push(sub.endpoint)
                    }
                    console.error(`Failed to send to ${sub.endpoint}:`, error.message)
                }
            })
        )

        // Clean up invalid subscriptions
        if (failedEndpoints.length > 0) {
            await prisma.pushSubscription.deleteMany({
                where: { endpoint: { in: failedEndpoints } }
            })
        }

        return NextResponse.json({
            success: true,
            sent: successCount,
            failed: failedCount,
            cleaned: failedEndpoints.length
        })
    } catch (error) {
        console.error("Error sending push notification:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

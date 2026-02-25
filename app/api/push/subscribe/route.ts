import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST - Subscribe to push notifications
export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const { subscription } = await request.json()

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json(
                { error: "Invalid subscription" },
                { status: 400 }
            )
        }

        // Check if subscription already exists
        const existingSubscription = await prisma.pushSubscription.findFirst({
            where: {
                userId: session.user.id,
                endpoint: subscription.endpoint
            }
        })

        if (existingSubscription) {
            // Update existing subscription
            await prisma.pushSubscription.update({
                where: { id: existingSubscription.id },
                data: {
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth
                }
            })
        } else {
            // Create new subscription
            await prisma.pushSubscription.create({
                data: {
                    userId: session.user.id,
                    endpoint: subscription.endpoint,
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth
                }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error subscribing to push:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

// DELETE - Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const { endpoint } = await request.json()

        if (!endpoint) {
            return NextResponse.json(
                { error: "Endpoint required" },
                { status: 400 }
            )
        }

        await prisma.pushSubscription.deleteMany({
            where: {
                userId: session.user.id,
                endpoint: endpoint
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error unsubscribing from push:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

// GET - Check subscription status
export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId: session.user.id },
            select: { endpoint: true, createdAt: true }
        })

        return NextResponse.json({
            isSubscribed: subscriptions.length > 0,
            subscriptions: subscriptions.map((s: { endpoint: string; createdAt: Date }) => ({
                endpoint: s.endpoint,
                subscribedAt: s.createdAt
            }))
        })
    } catch (error) {
        console.error("Error checking push status:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

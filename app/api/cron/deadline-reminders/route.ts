import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import webpush from "web-push"

type UpcomingJob = {
    id: string
    title: string
    companyName: string
    deadline: Date | null
}

// Configure VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ""
const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:admin@example.com"

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

// This endpoint is designed to be called by a cron job (e.g., Vercel Cron)
// It finds jobs with deadlines in the next 6 hours and sends push reminders

export async function POST(request: Request) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get("authorization")
        const cronSecret = process.env.CRON_SECRET

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        // Find jobs with deadlines in the next 6 hours that haven't been reminded yet
        const now = new Date()
        const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000)

        // Get jobs with upcoming deadlines
        const upcomingJobs = await prisma.job.findMany({
            where: {
                deadline: {
                    gte: now,
                    lte: sixHoursFromNow,
                },
                status: "ACTIVE",
                isVisible: true,
            },
            select: {
                id: true,
                title: true,
                companyName: true,
                deadline: true,
            },
        })

        if (upcomingJobs.length === 0) {
            return NextResponse.json({ message: "No upcoming deadlines", sent: 0 })
        }

        // Check which jobs already had reminders sent
        const jobIds = upcomingJobs.map((j: UpcomingJob) => j.id)
        const alreadySent = await prisma.deadlineReminder.findMany({
            where: {
                jobId: { in: jobIds },
            },
            select: { jobId: true },
        })

        const alreadySentIds = new Set(alreadySent.map((r: { jobId: string }) => r.jobId))
        const jobsToRemind = upcomingJobs.filter((j: UpcomingJob) => !alreadySentIds.has(j.id))

        if (jobsToRemind.length === 0) {
            return NextResponse.json({ message: "All reminders already sent", sent: 0 })
        }

        // Get all push subscriptions
        const subscriptions = await prisma.pushSubscription.findMany()

        if (subscriptions.length === 0) {
            // Still mark jobs as reminded to avoid repeated checks
            await prisma.deadlineReminder.createMany({
                data: jobsToRemind.map((job: UpcomingJob) => ({
                    jobId: job.id,
                })),
                skipDuplicates: true,
            })
            return NextResponse.json({ message: "No push subscriptions", sent: 0 })
        }

        // Send notifications for each job
        let sentCount = 0
        const failedSubscriptions: string[] = []

        for (const job of jobsToRemind) {
            const hoursRemaining = Math.ceil(
                (new Date(job.deadline!).getTime() - now.getTime()) / (1000 * 60 * 60)
            )

            const payload = JSON.stringify({
                title: "⏰ Application Deadline Reminder",
                body: `${job.title} at ${job.companyName} closes in ${hoursRemaining} hours!`,
                icon: "/images/logo.png",
                url: `/jobs/${job.id}`,
            })

            // Send to all subscribers
            for (const subscription of subscriptions) {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: subscription.endpoint,
                            keys: {
                                p256dh: subscription.p256dh,
                                auth: subscription.auth,
                            },
                        },
                        payload
                    )
                    sentCount++
                } catch (error: unknown) {
                    const pushError = error as { statusCode?: number }
                    console.error("Push notification error:", error)
                    // If subscription is no longer valid, mark for removal
                    if (pushError.statusCode === 410 || pushError.statusCode === 404) {
                        failedSubscriptions.push(subscription.endpoint)
                    }
                }
            }

            // Mark job as reminded
            await prisma.deadlineReminder.create({
                data: { jobId: job.id },
            }).catch(() => {
                // Ignore duplicate errors
            })
        }

        // Cleanup invalid subscriptions
        if (failedSubscriptions.length > 0) {
            await prisma.pushSubscription.deleteMany({
                where: {
                    endpoint: { in: failedSubscriptions },
                },
            })
        }

        return NextResponse.json({
            message: "Reminders sent",
            jobsReminded: jobsToRemind.length,
            notificationsSent: sentCount,
            invalidSubscriptionsRemoved: failedSubscriptions.length,
        })
    } catch (error) {
        console.error("Deadline reminder error:", error)
        return NextResponse.json(
            { error: "Failed to send reminders" },
            { status: 500 }
        )
    }
}

// GET endpoint to check status (for testing)
export async function GET(request: Request) {
    try {
        // Verify cron secret for security
        const { searchParams } = new URL(request.url)
        const secret = searchParams.get("secret")
        const cronSecret = process.env.CRON_SECRET

        if (cronSecret && secret !== cronSecret) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const now = new Date()
        const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000)

        // Get upcoming jobs with deadlines
        const upcomingJobs = await prisma.job.findMany({
            where: {
                deadline: {
                    gte: now,
                    lte: sixHoursFromNow,
                },
                status: "ACTIVE",
                isVisible: true,
            },
            select: {
                id: true,
                title: true,
                companyName: true,
                deadline: true,
            },
        })

        // Get already sent reminders
        const sentReminders = await prisma.deadlineReminder.findMany({
            where: {
                jobId: { in: upcomingJobs.map((j: UpcomingJob) => j.id) },
            },
        })

        const sentJobIds = new Set(sentReminders.map((r: { jobId: string }) => r.jobId))

        return NextResponse.json({
            currentTime: now.toISOString(),
            sixHoursFromNow: sixHoursFromNow.toISOString(),
            upcomingJobs: upcomingJobs.map((j: UpcomingJob) => ({
                ...j,
                reminderSent: sentJobIds.has(j.id),
            })),
            totalSubscriptions: await prisma.pushSubscription.count(),
        })
    } catch (error) {
        console.error("Error checking deadline status:", error)
        return NextResponse.json(
            { error: "Failed to check status" },
            { status: 500 }
        )
    }
}

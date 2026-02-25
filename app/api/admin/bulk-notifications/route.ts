import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, sanitizeInput, logSecurityEvent } from "@/lib/auth-helpers"
import { emitNotification } from "@/lib/socket"
import { randomUUID } from "crypto"

export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const { error, session } = await requireAdmin()

    if (error || !session) {
      logSecurityEvent("unauthorized_admin_access", {
        endpoint: "/api/admin/bulk-notifications",
        ip: request.headers.get("x-forwarded-for") || "unknown"
      })
      return error
    }

    const {
      subject,
      message,
      targetGroup,
      selectedBranches,
      verifiedOnly,
      isScheduled,
      scheduledDate,
      scheduledTime,
      attachments,
      adminId
    } = await request.json()

    console.log("DEBUG: Bulk notification request received:", { subject, attachmentCount: attachments?.length || 0 })

    // Input validation
    if (!subject || !message || !adminId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Verify adminId matches session
    if (adminId !== session.user.id) {
      logSecurityEvent("admin_id_mismatch", {
        sessionUserId: session.user.id,
        providedAdminId: adminId
      })
      return NextResponse.json(
        { error: "Invalid admin ID" },
        { status: 403 }
      )
    }

    // Sanitize inputs
    const sanitizedSubject = sanitizeInput(subject)
    const sanitizedMessage = sanitizeInput(message)

    // Validate subject and message length
    if (sanitizedSubject.length > 200 || sanitizedMessage.length > 5000) {
      return NextResponse.json(
        { error: "Subject or message too long" },
        { status: 400 }
      )
    }

    // Validate targetGroup
    const validTargetGroups = ['all', 'verified', 'branches']
    if (!validTargetGroups.includes(targetGroup)) {
      return NextResponse.json(
        { error: "Invalid target group" },
        { status: 400 }
      )
    }

    // Build the user filter based on targeting options
    let userFilter: any = { role: 'STUDENT' }

    if (targetGroup === 'verified' || (targetGroup === 'all' && verifiedOnly)) {
      userFilter.profile = {
        kycStatus: 'VERIFIED'
      }
    } else if (targetGroup === 'branches' && Array.isArray(selectedBranches) && selectedBranches.length > 0) {
      userFilter.profile = {
        branch: { in: selectedBranches }
      }
    }

    // Get target users
    const targetUsers = await prisma.user.findMany({
      where: userFilter,
      select: {
        id: true,
        email: true,
        name: true
      }
    })

    // Log the notification attempt
    logSecurityEvent("bulk_notification_sent", {
      adminId: session.user.id,
      recipientCount: targetUsers.length,
      targetGroup,
      isScheduled,
      timestamp: new Date().toISOString()
    })

    // Create notifications for each target user
    if (targetUsers.length > 0) {
      const notificationsData = targetUsers.map((user: { id: string; name: string | null }) => {
        const id = randomUUID()
        return {
          id,
          userId: user.id,
          title: sanitizedSubject,
          message: sanitizedMessage,
          type: 'SYSTEM' as const,
          isRead: false,
          scheduledAt: isScheduled ? new Date(`${scheduledDate}T${scheduledTime}`) : null,
          data: {
            sentBy: adminId,
            targetGroup,
            isScheduled,
            scheduledFor: isScheduled ? `${scheduledDate}T${scheduledTime}` : null,
          }
        }
      })

      const filesData: any[] = []
      notificationsData.forEach(notif => {
        if (attachments && attachments.length > 0) {
          attachments.forEach((file: { url: string; name: string }) => {
            filesData.push({
              notificationId: notif.id,
              fileName: file.name,
              fileUrl: file.url
            })
          })
        }
      })

      // Create all notifications and their files in a transaction
      await prisma.$transaction([
        prisma.notification.createMany({
          data: notificationsData
        }),
        prisma.notificationFile.createMany({
          data: filesData
        })
      ])

      // Emit real-time notifications for non-scheduled messages
      if (!isScheduled) {
        const { sendMulticastFCMNotification } = await import("@/lib/firebase-admin")

        // Emit socket events
        for (const notification of notificationsData) {
          emitNotification(notification.userId, {
            ...notification,
            createdAt: new Date().toISOString()
          })
        }

        // Send FCM multicast notifications
        const usersWithTokens = await (prisma.user as any).findMany({
          where: {
            id: { in: targetUsers.map(u => u.id) },
            fcmToken: { not: null }
          },
          select: { fcmToken: true }
        })

        const tokens = usersWithTokens.map((u: any) => u.fcmToken as string)
        if (tokens.length > 0) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3500'
          await sendMulticastFCMNotification(
            tokens,
            sanitizedSubject,
            sanitizedMessage,
            {
              sentBy: adminId,
              targetGroup,
              type: 'SYSTEM'
            },
            `${appUrl}/notifications`
          )
        }
      }

      console.log(`Bulk notification sent to ${targetUsers.length} users`)
    }

    return NextResponse.json({
      success: true,
      recipientCount: targetUsers.length,
      message: "Notification sent successfully"
    })

  } catch (error) {
    console.error("Error sending bulk notification:", error)
    logSecurityEvent("bulk_notification_error", {
      error: error instanceof Error ? error.message : "Unknown error"
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

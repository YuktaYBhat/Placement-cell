"use client"

import { useState, useEffect, useRef } from "react"
import { BellIcon } from "lucide-react"
import { io, Socket } from "socket.io-client"
import { formatDistanceToNow } from "date-fns"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
  data?: any
}

function Dot({ className }: { className?: string }) {
  return (
    <svg
      width="6"
      height="6"
      fill="currentColor"
      viewBox="0 0 6 6"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="3" cy="3" r="3" />
    </svg>
  )
}

export default function NotificationMenu() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Socket.io integration
    const socket = io(window.location.origin, {
      path: "/api/socket/io",
      addTrailingSlash: false,
    })
    socketRef.current = socket

    socket.on("connect", () => {
      console.log("DEBUG: Socket connected, ID:", socket.id)
      fetchNotifications()
    })

    socket.on("new_notification", (notification: Notification) => {
      console.log("DEBUG: Received real-time notification:", notification)
      setNotifications((prev) => [notification, ...prev])
      setUnreadCount((prev) => prev + 1)
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)

        // Join room after we have the user info
        if (socketRef.current) {
          if (data.userId) {
            socketRef.current.emit("join-room", data.userId)
          } else if (data.notifications && data.notifications.length > 0) {
            socketRef.current.emit("join-room", data.notifications[0].userId)
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ markAllRead: true }),
        headers: { 'Content-Type': 'application/json' }
      })
      if (response.ok) {
        setNotifications(
          notifications.map((notification) => ({
            ...notification,
            isRead: true,
          }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const handleNotificationClick = async (id: string, data?: any) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ notificationIds: [id] }),
        headers: { 'Content-Type': 'application/json' }
      })
      if (response.ok) {
        setNotifications(
          notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          )
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))

        // Redirect logic
        const jobId = data?.jobId
        if (jobId) {
          window.location.href = `/jobs/${jobId}`
        } else {
          window.location.href = `/notifications/${id}`
        }
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="text-muted-foreground relative size-8 rounded-full shadow-none"
          aria-label="Open notifications"
        >
          <BellIcon size={16} aria-hidden="true" />
          {unreadCount > 0 && (
            <div
              aria-hidden="true"
              className="bg-primary absolute top-0.5 right-0.5 size-1 rounded-full"
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-1">
        <div className="flex items-baseline justify-between gap-4 px-3 py-2">
          <div className="text-sm font-semibold">Notifications</div>
          {unreadCount > 0 && (
            <button
              className="text-xs font-medium hover:underline"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </button>
          )}
        </div>
        <div
          role="separator"
          aria-orientation="horizontal"
          className="bg-border -mx-1 my-1 h-px"
        ></div>
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="hover:bg-accent border-b last:border-0 p-3 text-sm transition-colors relative"
              >
                <div className="flex items-start gap-3">
                  {/* Unread Indicator Dot - Moved to left and made larger */}
                  {!notification.isRead && (
                    <div className="flex shrink-0 items-center justify-center pt-3">
                      <div className="size-2 rounded-full bg-primary" aria-hidden="true" />
                    </div>
                  )}

                  {/* Company Logo or Initial - Made rounded-full */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-muted font-bold text-muted-foreground uppercase overflow-hidden">
                    {notification.data?.companyLogo ? (
                      <img
                        src={notification.data.companyLogo}
                        alt={notification.data.companyName}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span>{(notification.data?.companyName || notification.title || "?").charAt(0)}</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <button
                      className="text-foreground/80 text-left after:absolute after:inset-0 block w-full"
                      onClick={() => handleNotificationClick(notification.id, notification.data)}
                    >
                      {notification.type === 'JOB_POSTED' && notification.data?.jobTitle ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-foreground font-semibold text-sm leading-tight">
                            {notification.data.jobTitle} | {notification.data.companyName}
                          </span>
                          <span className="text-muted-foreground text-[11px] font-medium">
                            Package: {notification.data.salary} | Eligibility: {notification.data.eligibility}
                          </span>
                        </div>
                      ) : (
                        <>
                          <span className="text-foreground font-medium">
                            {notification.title}
                          </span>{" "}
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message.length > 120
                              ? notification.message.substring(0, 120) + "..."
                              : notification.message}
                          </div>
                        </>
                      )}
                    </button>
                    <div className="text-muted-foreground text-[10px] mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

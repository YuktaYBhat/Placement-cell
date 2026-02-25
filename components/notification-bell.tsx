"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface Notification {
    id: string
    title: string
    message: string
    type: string
    isRead: boolean
    createdAt: string
    data?: Record<string, unknown>
}

const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
    JOB_POSTED: { icon: "💼", color: "bg-blue-100 text-blue-600" },
    APPLICATION_STATUS: { icon: "📋", color: "bg-purple-100 text-purple-600" },
    INTERVIEW_SCHEDULED: { icon: "📅", color: "bg-cyan-100 text-cyan-600" },
    KYC_UPDATE: { icon: "✅", color: "bg-green-100 text-green-600" },
    EVENT_REMINDER: { icon: "⏰", color: "bg-amber-100 text-amber-600" },
    SYSTEM: { icon: "🔔", color: "bg-gray-100 text-gray-600" },
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)

    const fetchNotifications = useCallback(async () => {
        try {
            setIsLoading(true)
            const response = await fetch("/api/notifications?limit=10")
            if (response.ok) {
                const data = await response.json()
                setNotifications(data.notifications)
                setUnreadCount(data.unreadCount)
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Fetch notifications on mount and every 30 seconds
    useEffect(() => {
        fetchNotifications()

        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [fetchNotifications])

    // Refetch when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications()
        }
    }, [isOpen, fetchNotifications])

    const markAsRead = async (notificationIds: string[]) => {
        try {
            const response = await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationIds })
            })

            if (response.ok) {
                setNotifications(prev =>
                    prev.map(n =>
                        notificationIds.includes(n.id) ? { ...n, isRead: true } : n
                    )
                )
                setUnreadCount(prev => Math.max(0, prev - notificationIds.length))
            }
        } catch (error) {
            console.error("Failed to mark notifications as read:", error)
        }
    }

    const markAllAsRead = async () => {
        try {
            const response = await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAllRead: true })
            })

            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
                setUnreadCount(0)
            }
        } catch (error) {
            console.error("Failed to mark all as read:", error)
        }
    }

    const deleteNotification = async (id: string) => {
        try {
            const response = await fetch(`/api/notifications?id=${id}`, {
                method: "DELETE"
            })

            if (response.ok) {
                const notification = notifications.find(n => n.id === id)
                setNotifications(prev => prev.filter(n => n.id !== id))
                if (notification && !notification.isRead) {
                    setUnreadCount(prev => Math.max(0, prev - 1))
                }
            }
        } catch (error) {
            console.error("Failed to delete notification:", error)
        }
    }

    const getTypeInfo = (type: string) => {
        return TYPE_ICONS[type] || TYPE_ICONS.SYSTEM
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto py-1 px-2 text-xs"
                            onClick={markAllAsRead}
                        >
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <ScrollArea className="h-[400px]">
                    {isLoading && notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                            Loading...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="py-1">
                            {notifications.map((notification) => {
                                const typeInfo = getTypeInfo(notification.type)
                                return (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "group relative flex gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors",
                                            !notification.isRead && "bg-primary/5"
                                        )}
                                        onClick={() => {
                                            if (!notification.isRead) {
                                                markAsRead([notification.id])
                                            }
                                        }}
                                    >
                                        <div className={cn(
                                            "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm",
                                            typeInfo.color
                                        )}>
                                            {typeInfo.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn(
                                                    "text-sm line-clamp-1",
                                                    !notification.isRead && "font-medium"
                                                )}>
                                                    {notification.title}
                                                </p>
                                                {!notification.isRead && (
                                                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 absolute top-2 right-2"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                deleteNotification(notification.id)
                                            }}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </ScrollArea>

                {notifications.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <div className="p-2">
                            <Button
                                variant="ghost"
                                className="w-full text-sm"
                                size="sm"
                                asChild
                            >
                                <a href="/notifications">View all notifications</a>
                            </Button>
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

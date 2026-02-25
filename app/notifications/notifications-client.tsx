"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Check, CheckCheck, Trash2, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { formatDistanceToNow, format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { BulkNotificationView } from "@/components/notifications/bulk-notification-view"

interface Notification {
    id: string
    title: string
    message: string
    type: string
    isRead: boolean
    createdAt: Date
    readAt?: Date | null
    data?: Record<string, unknown>
}

interface NotificationsClientProps {
    initialNotifications: Notification[]
}

const TYPE_INFO: Record<string, { label: string; icon: string; color: string }> = {
    JOB_POSTED: { label: "New Job", icon: "💼", color: "bg-blue-100 text-blue-600" },
    APPLICATION_STATUS: { label: "Application Update", icon: "📋", color: "bg-purple-100 text-purple-600" },
    INTERVIEW_SCHEDULED: { label: "Interview", icon: "📅", color: "bg-cyan-100 text-cyan-600" },
    KYC_UPDATE: { label: "KYC", icon: "✅", color: "bg-green-100 text-green-600" },
    EVENT_REMINDER: { label: "Reminder", icon: "⏰", color: "bg-amber-100 text-amber-600" },
    SYSTEM: { label: "System", icon: "🔔", color: "bg-gray-100 text-gray-600" },
}

export function NotificationsClient({ initialNotifications }: NotificationsClientProps) {
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
    const [filter, setFilter] = useState<string>("all")
    const [tab, setTab] = useState<string>("all")
    const router = useRouter()

    const filteredNotifications = notifications.filter(n => {
        const matchesFilter = filter === "all" || n.type === filter
        const matchesTab = tab === "all" || (tab === "unread" ? !n.isRead : n.isRead)
        return matchesFilter && matchesTab
    })

    const unreadCount = notifications.filter(n => !n.isRead).length

    const markAsRead = async (ids: string[]) => {
        try {
            const response = await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationIds: ids })
            })

            if (response.ok) {
                setNotifications(prev =>
                    prev.map(n => ids.includes(n.id) ? { ...n, isRead: true } : n)
                )
                toast.success("Marked as read")
            }
        } catch (error) {
            toast.error("Failed to mark as read")
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
                toast.success("All notifications marked as read")
            }
        } catch (error) {
            toast.error("Failed to mark all as read")
        }
    }

    const deleteNotification = async (id: string) => {
        try {
            const response = await fetch(`/api/notifications?id=${id}`, {
                method: "DELETE"
            })

            if (response.ok) {
                setNotifications(prev => prev.filter(n => n.id !== id))
                toast.success("Notification deleted")
            }
        } catch (error) {
            toast.error("Failed to delete notification")
        }
    }

    const deleteAllNotifications = async () => {
        try {
            const response = await fetch("/api/notifications?all=true", {
                method: "DELETE"
            })

            if (response.ok) {
                setNotifications([])
                toast.success("All notifications deleted")
            }
        } catch (error) {
            toast.error("Failed to delete notifications")
        }
    }

    const getTypeInfo = (type: string) => {
        return TYPE_INFO[type] || TYPE_INFO.SYSTEM
    }

    // Types that have a jobId for click-through navigation
    const JOB_NOTIFICATION_TYPES = ["JOB_POSTED", "JOB_UPDATED", "JOB_DEADLINE_REMINDER", "JOB_DEADLINE_EXTENDED"]

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read if unread
        if (!notification.isRead) {
            await markAsRead([notification.id])
        }

        const jobId = notification.data?.jobId as string | undefined
        const isJobNotification = JOB_NOTIFICATION_TYPES.includes(notification.type) && !!jobId

        if (isJobNotification) {
            router.push(`/jobs/${jobId}`)
        } else {
            router.push(`/notifications/${notification.id}`)
        }
    }

    const isClickable = (notification: Notification) => {
        return true
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
                <h1 className="text-3xl font-bold">Notifications</h1>
            </div>

            <div className="container mx-auto max-w-4xl px-4 py-8">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="h-5 w-5" />
                                    All Notifications
                                </CardTitle>
                                <CardDescription>
                                    {unreadCount > 0
                                        ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                                        : 'All caught up!'
                                    }
                                </CardDescription>
                            </div>

                            <div className="flex items-center gap-2">
                                <Select value={filter} onValueChange={setFilter}>
                                    <SelectTrigger className="w-[160px]">
                                        <Filter className="h-4 w-4 mr-2" />
                                        <SelectValue placeholder="Filter by type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        {Object.entries(TYPE_INFO).map(([key, info]) => (
                                            <SelectItem key={key} value={key}>
                                                {info.icon} {info.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {unreadCount > 0 && (
                                    <Button variant="outline" size="sm" onClick={markAllAsRead}>
                                        <CheckCheck className="h-4 w-4 mr-2" />
                                        Mark all read
                                    </Button>
                                )}

                                {notifications.length > 0 && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" size="sm" className="text-destructive">
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Clear all
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete all notifications?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. All your notifications will be permanently deleted.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={deleteAllNotifications}>
                                                    Delete All
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <Tabs value={tab} onValueChange={setTab}>
                            <TabsList className="mb-4">
                                <TabsTrigger value="all">
                                    All ({notifications.length})
                                </TabsTrigger>
                                <TabsTrigger value="unread">
                                    Unread ({unreadCount})
                                </TabsTrigger>
                                <TabsTrigger value="read">
                                    Read ({notifications.length - unreadCount})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value={tab} className="mt-0">
                                {filteredNotifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                        <h3 className="text-lg font-medium">No notifications</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {tab === "unread"
                                                ? "You're all caught up!"
                                                : "Your notifications will appear here"
                                            }
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {filteredNotifications.map((notification) => {
                                            const typeInfo = getTypeInfo(notification.type)
                                            return (
                                                <div
                                                    key={notification.id}
                                                    onClick={() => handleNotificationClick(notification)}
                                                    className={cn(
                                                        "group relative flex gap-4 p-5 rounded-xl border shadow-sm transition-all hover:shadow-md hover:bg-muted/30 mb-3",
                                                        !notification.isRead && "bg-primary/5 border-primary/20 ring-1 ring-primary/5",
                                                        isClickable(notification) && "cursor-pointer"
                                                    )}
                                                >
                                                    {/* Unread dot on the left */}
                                                    {!notification.isRead && (
                                                        <div className="flex shrink-0 items-center justify-center pt-5">
                                                            <div className="h-2 w-2 rounded-full bg-primary" />
                                                        </div>
                                                    )}

                                                    {/* Company Logo or Initial - Made rounded-full */}
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border bg-muted font-bold text-muted-foreground uppercase text-lg shadow-sm overflow-hidden">
                                                        {notification.data?.companyLogo ? (
                                                            <img
                                                                src={notification.data.companyLogo as string}
                                                                alt={notification.data.companyName as string}
                                                                className="h-full w-full object-contain p-1"
                                                            />
                                                        ) : (
                                                            <span>{(notification.data?.companyName as string || notification.title || "?").charAt(0)}</span>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className={cn(
                                                                    "text-sm",
                                                                    !notification.isRead && "font-semibold"
                                                                )}>
                                                                    {notification.type === "JOB_POSTED" && notification.data?.jobTitle ? (
                                                                        <span className="flex flex-col gap-1">
                                                                            <span className="font-semibold text-base">
                                                                                {notification.data.jobTitle as string} | {notification.data.companyName as string}
                                                                            </span>
                                                                            <span className="text-sm font-normal text-muted-foreground">
                                                                                Package: {notification.data.salary as string} | Eligibility: {notification.data.eligibility as string}
                                                                            </span>
                                                                        </span>
                                                                    ) : (
                                                                        notification.title
                                                                    )}
                                                                </h4>
                                                                {notification.type !== "JOB_POSTED" && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {typeInfo.label}
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {!notification.isRead && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8"
                                                                        onClick={() => markAsRead([notification.id])}
                                                                    >
                                                                        <Check className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                                    onClick={() => deleteNotification(notification.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        <div className="text-sm text-foreground/70 mt-1">
                                                            {notification.message.length > 150
                                                                ? (
                                                                    <>
                                                                        {notification.message.substring(0, 150)}...
                                                                        <span className="text-primary font-medium ml-1">Read More</span>
                                                                    </>
                                                                )
                                                                : notification.message
                                                            }
                                                        </div>

                                                        <div className="flex items-center gap-4 mt-2">
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {format(new Date(notification.createdAt), "MMM d, yyyy 'at' h:mm a")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

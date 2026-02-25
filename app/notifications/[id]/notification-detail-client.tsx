"use client"

import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Bell, ArrowLeft, Calendar, User, FileIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BulkNotificationView } from "@/components/notifications/bulk-notification-view"
import { Badge } from "@/components/ui/badge"

interface Notification {
    id: string
    title: string
    message: string
    type: string
    createdAt: string
    data?: any
    files?: any[]
}

interface NotificationDetailClientProps {
    notification: Notification
}

export default function NotificationDetailClient({ notification }: NotificationDetailClientProps) {
    const router = useRouter()

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-8 pt-0">
            <div className="flex h-16 shrink-0 items-center gap-2 border-b mb-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="mr-2"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold truncate">Notification Details</h1>
            </div>

            <div className="container mx-auto max-w-4xl">
                <Card className="shadow-lg border-primary/10 overflow-hidden">
                    <div className="bg-primary/5 p-6 border-b flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border bg-background font-bold text-muted-foreground uppercase text-xl shadow-inner overflow-hidden">
                            {notification.data?.companyLogo ? (
                                <img
                                    src={notification.data.companyLogo}
                                    alt={notification.data.companyName || "Logo"}
                                    className="h-full w-full object-contain p-2"
                                />
                            ) : (
                                <span>{(notification.data?.companyName || notification.title || "?").charAt(0)}</span>
                            )}
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-2xl font-bold text-foreground leading-tight">
                                    {notification.title}
                                </h2>
                                <Badge variant="secondary" className="px-2 py-0.5 text-xs font-medium">
                                    {notification.type}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    <span>{format(new Date(notification.createdAt), "MMMM d, yyyy 'at' h:mm a")}</span>
                                </div>
                                {notification.data?.sentBy && (
                                    <div className="flex items-center gap-1.5">
                                        <User className="h-4 w-4" />
                                        <span>Official Notice</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <CardContent className="p-8">
                        {notification.type === "SYSTEM" ? (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <BulkNotificationView
                                    message={notification.message}
                                    data={notification.data}
                                    files={notification.files}
                                />
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">
                                    {notification.message}
                                </div>

                                {notification.type === 'JOB_POSTED' && notification.data && (
                                    <Card className="bg-muted/30 border-dashed">
                                        <CardContent className="p-6">
                                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                                <Badge className="bg-blue-500">Job Details</Badge>
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Salary Package</p>
                                                    <p className="text-xl font-bold text-primary">{notification.data.salary}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Eligibility</p>
                                                    <p className="text-xl font-bold">{notification.data.eligibility}</p>
                                                </div>
                                            </div>
                                            <Button
                                                className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                                                onClick={() => router.push(`/jobs/${notification.data.jobId}`)}
                                            >
                                                View Full Job Description
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

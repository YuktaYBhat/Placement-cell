"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function NotificationsLoading() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-8 w-40 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-32" />
                    <Skeleton className="h-9 w-28" />
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-8 w-24 rounded-full" />
                ))}
            </div>

            {/* Notifications List */}
            <Card>
                <CardHeader className="pb-0">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-36" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="space-y-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div
                                key={i}
                                className="flex items-start gap-4 p-4 rounded-lg border-b last:border-0"
                            >
                                {/* Icon */}
                                <Skeleton className="h-10 w-10 rounded-full shrink-0" />

                                {/* Content */}
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-start justify-between gap-4">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-16 shrink-0" />
                                    </div>
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-2/3" />
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <Skeleton className="h-8 w-8 rounded" />
                                    <Skeleton className="h-8 w-8 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex justify-center gap-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-16" />
            </div>
        </div>
    )
}

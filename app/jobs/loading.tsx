"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function JobsLoading() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header Skeleton */}
            <div>
                <Skeleton className="h-9 w-56 mb-2" />
                <Skeleton className="h-4 w-80" />
            </div>

            {/* Filters Skeleton */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <Skeleton className="flex-1 h-10" />
                        <Skeleton className="w-full md:w-[180px] h-10" />
                        <Skeleton className="w-full md:w-[180px] h-10" />
                        <Skeleton className="w-20 h-10" />
                    </div>
                </CardContent>
            </Card>

            {/* Jobs List Skeleton */}
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-start gap-4">
                                        <Skeleton className="w-12 h-12 rounded-lg" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-5 w-48" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                    </div>

                                    {/* Job Details */}
                                    <div className="flex flex-wrap gap-4 mt-4">
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-4 w-4 rounded" />
                                            <Skeleton className="h-3 w-20" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-4 w-4 rounded" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-4 w-4 rounded" />
                                            <Skeleton className="h-3 w-14" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-4 w-4 rounded" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </div>

                                    {/* Skills */}
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {[1, 2, 3, 4].map((j) => (
                                            <Skeleton key={j} className="h-5 w-16 rounded-full" />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <Skeleton className="h-9 w-28" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Pagination Skeleton */}
            <div className="flex justify-center gap-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-16" />
            </div>
        </div>
    )
}

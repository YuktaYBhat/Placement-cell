"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ApplicationsLoading() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header Skeleton */}
            <div>
                <Skeleton className="h-9 w-48 mb-2" />
                <Skeleton className="h-4 w-72" />
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-12 mb-1" />
                            <Skeleton className="h-3 w-20" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters Skeleton */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <Skeleton className="flex-1 h-10" />
                        <Skeleton className="w-full md:w-[180px] h-10" />
                        <Skeleton className="w-20 h-10" />
                    </div>
                </CardContent>
            </Card>

            {/* Applications Table Skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent>
                    {/* Table Header */}
                    <div className="grid grid-cols-5 gap-4 pb-4 border-b">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-14" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                    </div>

                    {/* Table Rows */}
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="grid grid-cols-5 gap-4 py-4 border-b last:border-0 items-center">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-lg" />
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            </div>
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-8 w-20" />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Pagination Skeleton */}
            <div className="flex justify-center gap-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-16" />
            </div>
        </div>
    )
}

"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileLoading() {
    return (
        <main className="flex-1 bg-background min-h-screen">
            <div className="container mx-auto py-8 flex flex-col gap-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <Skeleton className="h-8 w-64 mx-auto" />
                    <Skeleton className="h-4 w-96 mx-auto" />
                </div>

                {/* Progress */}
                <div className="max-w-3xl mx-auto w-full">
                    <div className="flex items-center justify-between mb-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                </div>

                {/* Steps Navigation */}
                <div className="max-w-4xl mx-auto w-full">
                    <div className="flex items-center justify-between">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center">
                                <div className="flex flex-col items-center gap-2">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                                {i < 5 && <Skeleton className="h-0.5 w-16 mx-4" />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Card */}
                <Card className="max-w-3xl mx-auto w-full">
                    <CardHeader>
                        <Skeleton className="h-6 w-48 mb-2" />
                        <Skeleton className="h-4 w-80" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Form Fields */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>

                        {/* Full Width Field */}
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-24 w-full" />
                        </div>

                        {/* Upload Section */}
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-32 w-full rounded-lg" />
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between pt-4">
                            <Skeleton className="h-10 w-24" />
                            <Skeleton className="h-10 w-24" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}

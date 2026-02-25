"use client"

import { cn } from "@/lib/utils"
import { IconLoader2 } from "@tabler/icons-react"

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg" | "xl"
    className?: string
    text?: string
}

const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
    return (
        <div className={cn("flex items-center justify-center gap-2", className)}>
            <IconLoader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
            {text && <span className="text-sm text-muted-foreground">{text}</span>}
        </div>
    )
}

interface LoadingDotsProps {
    className?: string
}

export function LoadingDots({ className }: LoadingDotsProps) {
    return (
        <span className={cn("inline-flex items-center gap-1", className)}>
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
        </span>
    )
}

interface LoadingCardProps {
    className?: string
}

export function LoadingCard({ className }: LoadingCardProps) {
    return (
        <div className={cn("animate-pulse rounded-lg border bg-card p-6", className)}>
            <div className="space-y-4">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted" />
                <div className="space-y-2">
                    <div className="h-3 rounded bg-muted" />
                    <div className="h-3 w-5/6 rounded bg-muted" />
                </div>
            </div>
        </div>
    )
}

interface PageLoadingProps {
    message?: string
}

export function PageLoading({ message = "Loading..." }: PageLoadingProps) {
    return (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
            <div className="relative">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-primary" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full bg-background" />
                </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground">{message}</p>
        </div>
    )
}

interface TableLoadingProps {
    rows?: number
    columns?: number
}

export function TableLoading({ rows = 5, columns = 4 }: TableLoadingProps) {
    return (
        <div className="w-full animate-pulse">
            {/* Header */}
            <div className="flex gap-4 border-b pb-4">
                {Array.from({ length: columns }).map((_, i) => (
                    <div key={i} className="h-4 flex-1 rounded bg-muted" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex gap-4 border-b py-4">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <div
                            key={colIndex}
                            className="h-4 flex-1 rounded bg-muted"
                            style={{ opacity: 1 - rowIndex * 0.1 }}
                        />
                    ))}
                </div>
            ))}
        </div>
    )
}

interface FormLoadingProps {
    fields?: number
}

export function FormLoading({ fields = 4 }: FormLoadingProps) {
    return (
        <div className="space-y-6 animate-pulse">
            {Array.from({ length: fields }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <div className="h-4 w-24 rounded bg-muted" />
                    <div className="h-10 rounded-md bg-muted" />
                </div>
            ))}
            <div className="flex gap-3 pt-4">
                <div className="h-10 w-24 rounded-md bg-muted" />
                <div className="h-10 w-20 rounded-md bg-muted" />
            </div>
        </div>
    )
}

interface ButtonLoadingProps {
    children: React.ReactNode
    isLoading: boolean
    loadingText?: string
    className?: string
}

export function ButtonLoading({
    children,
    isLoading,
    loadingText,
    className
}: ButtonLoadingProps) {
    if (isLoading) {
        return (
            <span className={cn("inline-flex items-center gap-2", className)}>
                <IconLoader2 className="h-4 w-4 animate-spin" />
                {loadingText || <LoadingDots />}
            </span>
        )
    }
    return <>{children}</>
}

// Skeleton variants for common use cases
export function AvatarSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("h-10 w-10 animate-pulse rounded-full bg-muted", className)} />
    )
}

export function CardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("animate-pulse rounded-xl border bg-card", className)}>
            <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-muted" />
                    <div className="space-y-2 flex-1">
                        <div className="h-4 w-1/3 rounded bg-muted" />
                        <div className="h-3 w-1/2 rounded bg-muted" />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="h-3 rounded bg-muted" />
                    <div className="h-3 w-4/5 rounded bg-muted" />
                </div>
                <div className="flex gap-2 pt-2">
                    <div className="h-6 w-16 rounded-full bg-muted" />
                    <div className="h-6 w-20 rounded-full bg-muted" />
                </div>
            </div>
        </div>
    )
}

export function StatCardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("animate-pulse rounded-xl border bg-card p-6", className)}>
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-3 w-20 rounded bg-muted" />
                    <div className="h-8 w-16 rounded bg-muted" />
                </div>
                <div className="h-10 w-10 rounded-lg bg-muted" />
            </div>
        </div>
    )
}

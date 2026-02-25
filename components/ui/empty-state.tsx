"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
    FileSearch,
    Inbox,
    Search,
    FolderOpen,
    AlertCircle,
    RefreshCw,
    Plus,
    Database,
    Users,
    Calendar,
    Briefcase,
    Bell
} from "lucide-react"
import { Button } from "@/components/ui/button"

type EmptyStateVariant =
    | "default"
    | "search"
    | "folder"
    | "inbox"
    | "error"
    | "database"
    | "users"
    | "calendar"
    | "jobs"
    | "notifications"

interface EmptyStateProps {
    variant?: EmptyStateVariant
    title: string
    description?: string
    icon?: React.ReactNode
    action?: {
        label: string
        onClick: () => void
        variant?: "default" | "outline" | "ghost"
    }
    secondaryAction?: {
        label: string
        onClick: () => void
    }
    className?: string
    compact?: boolean
}

const variantIcons: Record<EmptyStateVariant, React.ReactNode> = {
    default: <FileSearch className="h-12 w-12" />,
    search: <Search className="h-12 w-12" />,
    folder: <FolderOpen className="h-12 w-12" />,
    inbox: <Inbox className="h-12 w-12" />,
    error: <AlertCircle className="h-12 w-12" />,
    database: <Database className="h-12 w-12" />,
    users: <Users className="h-12 w-12" />,
    calendar: <Calendar className="h-12 w-12" />,
    jobs: <Briefcase className="h-12 w-12" />,
    notifications: <Bell className="h-12 w-12" />,
}

const variantColors: Record<EmptyStateVariant, string> = {
    default: "text-neutral-400",
    search: "text-neutral-400",
    folder: "text-neutral-400",
    inbox: "text-neutral-400",
    error: "text-red-400",
    database: "text-neutral-400",
    users: "text-neutral-400",
    calendar: "text-neutral-400",
    jobs: "text-neutral-400",
    notifications: "text-neutral-400",
}

export function EmptyState({
    variant = "default",
    title,
    description,
    icon,
    action,
    secondaryAction,
    className,
    compact = false,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center text-center",
                compact ? "py-8 px-4" : "py-16 px-6",
                className
            )}
        >
            {/* Icon */}
            <div
                className={cn(
                    "mb-4 rounded-full p-4",
                    variant === "error" ? "bg-red-50" : "bg-neutral-100",
                    variantColors[variant]
                )}
            >
                {icon || variantIcons[variant]}
            </div>

            {/* Title */}
            <h3
                className={cn(
                    "font-semibold text-neutral-900",
                    compact ? "text-base" : "text-lg"
                )}
            >
                {title}
            </h3>

            {/* Description */}
            {description && (
                <p
                    className={cn(
                        "text-neutral-500 max-w-sm",
                        compact ? "text-sm mt-1" : "text-base mt-2"
                    )}
                >
                    {description}
                </p>
            )}

            {/* Actions */}
            {(action || secondaryAction) && (
                <div className={cn("flex items-center gap-3", compact ? "mt-4" : "mt-6")}>
                    {action && (
                        <Button
                            onClick={action.onClick}
                            variant={action.variant || "default"}
                            size={compact ? "sm" : "default"}
                        >
                            {action.label}
                        </Button>
                    )}
                    {secondaryAction && (
                        <Button
                            onClick={secondaryAction.onClick}
                            variant="ghost"
                            size={compact ? "sm" : "default"}
                        >
                            {secondaryAction.label}
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}

// Specialized Empty States
export function NoSearchResults({
    query,
    onClear,
    className,
}: {
    query?: string
    onClear?: () => void
    className?: string
}) {
    return (
        <EmptyState
            variant="search"
            title="No results found"
            description={query ? `No results for "${query}". Try adjusting your search.` : "Try adjusting your search or filters."}
            action={onClear ? { label: "Clear search", onClick: onClear, variant: "outline" } : undefined}
            className={className}
        />
    )
}

export function NoDataYet({
    type = "items",
    onAdd,
    className,
}: {
    type?: string
    onAdd?: () => void
    className?: string
}) {
    return (
        <EmptyState
            variant="inbox"
            title={`No ${type} yet`}
            description={`Get started by adding your first ${type.replace(/s$/, '')}.`}
            action={onAdd ? { label: `Add ${type.replace(/s$/, '')}`, onClick: onAdd } : undefined}
            icon={<Plus className="h-12 w-12" />}
            className={className}
        />
    )
}

export function ErrorState({
    message = "Something went wrong",
    onRetry,
    className,
}: {
    message?: string
    onRetry?: () => void
    className?: string
}) {
    return (
        <EmptyState
            variant="error"
            title="Error"
            description={message}
            action={onRetry ? { label: "Try again", onClick: onRetry } : undefined}
            icon={<RefreshCw className="h-12 w-12" />}
            className={className}
        />
    )
}

export { type EmptyStateVariant }

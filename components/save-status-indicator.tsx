"use client"

import { IconCircleCheck, IconCloud, IconCloudOff, IconLoader2, IconRefresh } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { SaveStatus } from "@/hooks/use-profile-form"

interface SaveStatusIndicatorProps {
    status: SaveStatus
    lastSaved: Date | null
    onRetry?: () => void
    className?: string
    showText?: boolean
}

export function SaveStatusIndicator({
    status,
    lastSaved,
    onRetry,
    className,
    showText = true
}: SaveStatusIndicatorProps) {
    const getStatusDisplay = () => {
        switch (status) {
            case "saving":
                return {
                    icon: <IconLoader2 className="h-4 w-4 animate-spin" />,
                    text: "Saving...",
                    color: "text-blue-600 dark:text-blue-400"
                }
            case "saved":
                return {
                    icon: <IconCircleCheck className="h-4 w-4" />,
                    text: lastSaved
                        ? `Saved ${getTimeAgo(lastSaved)}`
                        : "Saved",
                    color: "text-green-600 dark:text-green-400"
                }
            case "error":
                return {
                    icon: <IconCloudOff className="h-4 w-4" />,
                    text: "Failed to save",
                    color: "text-red-600 dark:text-red-400"
                }
            default:
                return {
                    icon: <IconCloud className="h-4 w-4" />,
                    text: "Not saved",
                    color: "text-muted-foreground"
                }
        }
    }

    const display = getStatusDisplay()

    if (status === "error" && onRetry) {
        return (
            <div className={cn("flex items-center gap-2", className)}>
                <div className={cn("flex items-center gap-1.5", display.color)}>
                    {display.icon}
                    {showText && <span className="text-sm font-medium">{display.text}</span>}
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onRetry}
                    className="h-7 px-2 text-xs"
                >
                    <IconRefresh className="h-3 w-3 mr-1" />
                    Retry
                </Button>
            </div>
        )
    }

    return (
        <div className={cn("flex items-center gap-1.5", display.color, className)}>
            {display.icon}
            {showText && <span className="text-sm font-medium">{display.text}</span>}
        </div>
    )
}

function getTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

    if (seconds < 10) return "just now"
    if (seconds < 60) return `${seconds}s ago`

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`

    return date.toLocaleDateString()
}

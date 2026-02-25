"use client"

import { cn } from "@/lib/utils"

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6">
        {/* Animated logo/spinner */}
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-background shadow-sm" />
          </div>
        </div>

        {/* Loading text with pulse */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-lg font-semibold text-foreground">Loading</span>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </div>
  )
} 
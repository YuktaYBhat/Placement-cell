"use client"
import { AlertTriangle } from "lucide-react"

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 p-8 rounded-lg shadow-lg bg-white dark:bg-background">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-2" />
        <h1 className="text-2xl font-bold text-red-600 mb-2">Something went wrong</h1>
        <p className="text-muted-foreground text-center mb-4 max-w-md">
          An unexpected error occurred. Please try reloading the page or contact support if the problem persists.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-2 rounded bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition"
        >
          Reload Page
        </button>
      </div>
    </div>
  )
} 
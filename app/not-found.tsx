"use client"
import Link from "next/link"
import { Ghost } from "lucide-react"

export default function NotFound() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 p-8 rounded-lg shadow-lg bg-white dark:bg-background">
        <Ghost className="w-12 h-12 text-primary mb-2" />
        <h1 className="text-4xl font-bold text-primary mb-2">404</h1>
        <p className="text-muted-foreground text-center mb-4 max-w-md">
          Sorry, the page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="px-6 py-2 rounded bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
} 
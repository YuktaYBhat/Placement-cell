"use client"

import { useSession } from "next-auth/react"
import Navbar from "@/components/navbar"

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { data: session, status } = useSession()

    // Only show navbar if user is authenticated
    if (status === "loading") {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>
    }

    return (
        <>
            {session && <Navbar />}
            {children}
        </>
    )
}

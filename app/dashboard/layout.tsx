import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Navbar from "@/components/navbar"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    return (
        <>
            <Navbar />
            {children}
        </>
    )
}

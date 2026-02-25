import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Check if user is authenticated
  if (!session?.user) {
    redirect("/login")
  }

  // Check if user has admin role
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard") // Redirect non-admins to dashboard
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="flex flex-1 flex-col">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

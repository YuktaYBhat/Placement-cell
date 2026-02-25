import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { BulkNotifications } from "@/components/bulk-notifications"

export default async function NotificationsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Get user with role information
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })

  const isAdmin = user?.role === 'ADMIN'

  if (!isAdmin) {
    redirect("/dashboard")
  }

  // Get student statistics for targeting
  const [
    totalStudents,
    verifiedStudents,
    branches
  ] = await Promise.all([
    prisma.user.count({
      where: { role: 'STUDENT' }
    }),
    prisma.profile.count({
      where: { kycStatus: 'VERIFIED' }
    }),
    prisma.profile.groupBy({
      by: ['branch'],
      where: {
        branch: { not: null }
      },
      _count: {
        branch: true
      }
    })
  ])

  const stats = {
    totalStudents,
    verifiedStudents,
    branches: branches.filter((b: { branch: string | null }) => b.branch !== null)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
        <h1 className="text-3xl font-bold">Bulk Notifications</h1>
      </div>
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <p className="text-muted-foreground">
            Send notifications and announcements to students
          </p>
        </div>

        <BulkNotifications
          stats={stats}
          adminId={session.user.id}
        />
      </div>
    </div>
  )
}

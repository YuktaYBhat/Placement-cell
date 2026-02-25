import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CompanyManagementView } from "@/components/admin/company-management-view"

export default async function CompaniesPage() {
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

  // Fetch recruiter/company data
  const [companies, totalCount] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'RECRUITER' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    }),

    prisma.user.count({
      where: { role: 'RECRUITER' }
    })
  ])

  // Get job posting stats (using events as proxy)
  const jobPostingStats = await prisma.scheduleEvent.groupBy({
    by: ['company'],
    where: { 
      company: { not: null },
      status: 'SCHEDULED'
    },
    _count: { company: true }
  })

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
        <h1 className="text-3xl font-bold">Company Management</h1>
      </div>
      
      <CompanyManagementView 
        companies={companies} 
        totalCount={totalCount}
        jobPostingStats={jobPostingStats}
      />
    </div>
  )
}

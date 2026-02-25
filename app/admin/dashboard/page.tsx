import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AdminDashboardView } from "@/components/admin/admin-dashboard-view"

export default async function AdminDashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Get user with role information
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, name: true, email: true }
  })

  const isAdmin = user?.role === 'ADMIN'

  if (!isAdmin) {
    redirect("/dashboard")
  }

  // Fetch comprehensive dashboard data
  const [
    totalStudents,
    verifiedStudents,
    pendingVerifications,
    totalRecruiters,
    activeJobPostings,
    totalApplications,
    placedStudents,
    upcomingInterviews,
    recentActivities,
    placementStats,
    branchWiseStats,
    monthlyTrends
  ] = await Promise.all([
    // Total registered students
    prisma.user.count({
      where: { role: 'STUDENT' }
    }),

    // Verified students (KYC approved)
    prisma.profile.count({
      where: { kycStatus: 'VERIFIED' }
    }),

    // Pending verifications
    prisma.profile.count({
      where: { kycStatus: 'PENDING' }
    }),

    // Total recruiters
    prisma.user.count({
      where: { role: 'RECRUITER' }
    }),

    // Active job postings (using scheduled events as proxy)
    prisma.scheduleEvent.count({
      where: {
        status: 'SCHEDULED',
        date: { gte: new Date() }
      }
    }),

    // Total applications (using profile count as proxy)
    prisma.profile.count(),

    // Placed students (verified profiles as proxy)
    prisma.profile.count({
      where: {
        kycStatus: 'VERIFIED'
      }
    }),

    // Upcoming interviews/events
    prisma.scheduleEvent.count({
      where: {
        status: 'SCHEDULED',
        date: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
        }
      }
    }),

    // Recent activities (last 10 profile updates)
    prisma.profile.findMany({
      take: 10,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    }),

    // Placement statistics by branch
    prisma.profile.groupBy({
      by: ['branch'],
      where: {
        branch: { not: null },
        kycStatus: 'VERIFIED'
      },
      _count: { branch: true }
    }),

    // Branch-wise student distribution
    prisma.profile.groupBy({
      by: ['branch'],
      where: { branch: { not: null } },
      _count: { branch: true }
    }),

    // Monthly registration trends (last 6 months)
    prisma.$queryRaw<{ month: Date; count: bigint }[]>`
      SELECT 
        DATE_TRUNC('month', "created_at") as month,
        COUNT(*) as count
      FROM users
      WHERE role = 'STUDENT' 
        AND "created_at" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "created_at")
      ORDER BY month ASC
    `
  ])

  const dashboardData = {
    overview: {
      totalStudents,
      verifiedStudents,
      pendingVerifications,
      totalRecruiters,
      activeJobPostings,
      totalApplications,
      placedStudents,
      upcomingInterviews
    },
    activities: recentActivities,
    stats: {
      placementStats,
      branchWiseStats,
      monthlyTrends
    },
    user: {
      name: user.name || 'Admin',
      email: user.email || ''
    }
  }

  return <AdminDashboardView data={dashboardData} />
}

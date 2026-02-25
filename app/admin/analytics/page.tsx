import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AdminAnalytics } from "@/components/admin-analytics"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Briefcase, Building, GraduationCap } from "lucide-react"

// Type definitions for analytics data
type PlacementStat = {
  tier: string
  _count: { tier: number }
  _avg: { salary: number | null }
  _max: { salary: number | null }
  _min: { salary: number | null }
}

type JobStat = {
  status: string
  _count: { status: number }
}

type JobWithApplications = {
  id: string
  title: string
  companyName: string
  tier: string
  _count: { applications: number }
}

type CompanyStat = {
  companyName: string
  _count: { companyName: number }
}

export default async function AnalyticsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })

  const isAdmin = user?.role === "ADMIN"

  if (!isAdmin) {
    redirect("/dashboard")
  }

  // Fetch comprehensive analytics data
  const [
    userStats,
    profileStats,
    eventStats,
    branchDistribution,
    monthlyRegistrations,
    kycStatusDistribution,
    jobStats,
    totalApplications,
    topCompanies,
    applicationsByJob,
    placementStats,
  ] = await Promise.all([
    prisma.user.groupBy({
      by: ["role"],
      _count: { role: true }
    }),

    prisma.profile.groupBy({
      by: ["isComplete"],
      _count: { isComplete: true }
    }),

    prisma.scheduleEvent.groupBy({
      by: ["status"],
      _count: { status: true }
    }),

    prisma.profile.groupBy({
      by: ["branch"],
      where: { branch: { not: null } },
      _count: { branch: true }
    }),

    prisma.$queryRaw<{ month: Date; count: bigint }[]>`
      SELECT 
        DATE_TRUNC('month', "created_at") as month,
        COUNT(*) as count
      FROM users 
      WHERE "created_at" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "created_at")
      ORDER BY month ASC
    `,

    prisma.profile.groupBy({
      by: ["kycStatus"],
      _count: { kycStatus: true }
    }),

    prisma.job.groupBy({
      by: ["status"],
      _count: { status: true }
    }),

    prisma.application.count({
      where: { isRemoved: false }
    }),

    prisma.job.groupBy({
      by: ["companyName"],
      _count: { companyName: true },
      orderBy: { _count: { companyName: "desc" } },
      take: 10
    }),

    prisma.job.findMany({
      take: 10,
      orderBy: { applications: { _count: "desc" } },
      select: {
        id: true,
        title: true,
        companyName: true,
        tier: true,
        _count: { select: { applications: { where: { isRemoved: false } } } }
      }
    }),

    prisma.placement.groupBy({
      by: ["tier"],
      _count: { tier: true },
      _avg: { salary: true },
      _max: { salary: true },
      _min: { salary: true }
    }),
  ])

  const analyticsData = {
    userStats,
    profileStats,
    eventStats,
    branchDistribution,
    monthlyRegistrations,
    kycStatusDistribution
  }

  const totalPlacements = (placementStats as PlacementStat[]).reduce((acc, stat) => acc + stat._count.tier, 0)
  const avgSalary = placementStats.length > 0
    ? (placementStats as PlacementStat[]).reduce((acc, stat) => acc + (stat._avg.salary || 0), 0) / placementStats.length
    : 0

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
        <h1 className="text-3xl font-bold">Analytics & Reports</h1>
      </div>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for the placement portal
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Placements</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPlacements}</div>
              <p className="text-xs text-muted-foreground">
                Avg: ₹{avgSalary.toFixed(1)} LPA
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalApplications}</div>
              <p className="text-xs text-muted-foreground">Active applications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(jobStats as { status: string; _count: { status: number } }[]).find((j) => j.status === "ACTIVE")?._count.status || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {(jobStats as { status: string; _count: { status: number } }[]).reduce((acc, j) => acc + j._count.status, 0)} total jobs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Companies</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{topCompanies.length}</div>
              <p className="text-xs text-muted-foreground">Hiring partners</p>
            </CardContent>
          </Card>
        </div>

        {/* Placement Tier Distribution */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Placement Tier Distribution</CardTitle>
            <CardDescription>Students placed by salary tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {(placementStats as PlacementStat[]).map((stat) => (
                <div key={stat.tier} className="flex flex-col items-center p-4 border rounded-lg">
                  <Badge variant={
                    stat.tier === "TIER_1" ? "default" :
                      stat.tier === "TIER_2" ? "secondary" :
                        stat.tier === "DREAM" ? "destructive" : "outline"
                  }>
                    {stat.tier.replace("_", " ")}
                  </Badge>
                  <div className="text-3xl font-bold mt-2">{stat._count.tier}</div>
                  <p className="text-sm text-muted-foreground">
                    {stat.tier === "TIER_1" && "> ₹9 LPA"}
                    {stat.tier === "TIER_2" && "₹5-9 LPA"}
                    {stat.tier === "TIER_3" && "≤ ₹5 LPA"}
                    {stat.tier === "DREAM" && "> ₹10 LPA"}
                  </p>
                  {stat._avg.salary && (
                    <p className="text-xs text-muted-foreground">
                      Avg: ₹{stat._avg.salary.toFixed(1)} LPA
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Jobs by Applications */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Top Jobs by Applications</CardTitle>
            <CardDescription>Most applied job postings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(applicationsByJob as JobWithApplications[]).map((job, idx) => (
                <div key={job.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground w-6">{idx + 1}.</span>
                    <div>
                      <p className="font-medium">{job.title}</p>
                      <p className="text-sm text-muted-foreground">{job.companyName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{job.tier.replace("_", " ")}</Badge>
                    <span className="font-bold">{job._count.applications}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="students">Student Analytics</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <AdminAnalytics data={analyticsData} />
          </TabsContent>

          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <CardTitle>Top Hiring Companies</CardTitle>
                <CardDescription>Companies with most job postings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(topCompanies as CompanyStat[]).map((company, idx) => (
                    <div key={company.companyName} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground w-6">{idx + 1}.</span>
                        <p className="font-medium">{company.companyName}</p>
                      </div>
                      <Badge>{company._count.companyName} jobs</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

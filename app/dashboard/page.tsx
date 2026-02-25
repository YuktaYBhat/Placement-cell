import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  IconBriefcase,
  IconCalendar,
  IconFileText,
  IconBuilding,
  IconAlertCircle,
  IconUsers,
  IconCircleCheck,
  IconArrowRight,
  IconTarget,
  IconChartBar,
  IconDownload
} from "@tabler/icons-react"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Get user with profile
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true }
  })

  if (!user) {
    redirect("/login")
  }

  const isAdmin = user.role === 'ADMIN'

  // Fetch dashboard statistics
  const [
    totalJobs,
    activeJobs,
    myApplications,
    upcomingEvents,
    totalStudents,
    verifiedProfiles,
    recentJobs
  ] = await Promise.all([
    prisma.job.count().catch(() => 0),
    prisma.job.count({
      where: {
        status: 'ACTIVE',
        isVisible: true
      }
    }).catch(() => 0),
    isAdmin ? Promise.resolve(null) : prisma.application.count({
      where: { userId: session.user.id }
    }).catch(() => 0),
    prisma.scheduleEvent.count({
      where: {
        date: { gte: new Date() },
        status: { in: ['SCHEDULED', 'ONGOING'] },
        isVisible: true
      }
    }).catch(() => 0),
    isAdmin ? prisma.user.count({
      where: { role: 'STUDENT' }
    }).catch(() => 0) : Promise.resolve(null),
    isAdmin ? prisma.profile.count({
      where: { kycStatus: 'VERIFIED' }
    }).catch(() => 0) : Promise.resolve(null),
    !isAdmin ? prisma.job.findMany({
      where: {
        status: 'ACTIVE',
        isVisible: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3,
      select: {
        id: true,
        title: true,
        companyName: true,
        location: true,
        jobType: true,
        workMode: true,
        salary: true,
        deadline: true,
        createdAt: true
      }
    }).catch(() => []) : Promise.resolve([])
  ])

  // Calculate profile completion
  const profileCompletionScore = user.profile ? calculateProfileCompletion(user.profile) : 0
  const hasProfile = !!user.profile
  const isKycVerified = user.profile?.kycStatus === 'VERIFIED'

  return (
    <main className="flex-1 bg-white min-h-screen">
      <div className="container mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* Welcome Header */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                Welcome back, {session.user.name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-muted-foreground">
                {isAdmin
                  ? "Manage placements and track student progress"
                  : "Track your placement journey and explore new opportunities"}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {!isAdmin && (
                <>
                  <Link href="/profile">
                    <Button size="sm" variant="outline" className="gap-2">
                      <IconFileText size={16} />
                      Update Profile
                    </Button>
                  </Link>
                  {isKycVerified && (
                    <Link href="/documents">
                      <Button size="sm" variant="outline" className="gap-2">
                        <IconDownload size={16} />
                        Download ID Card
                      </Button>
                    </Link>
                  )}
                  <Link href="/jobs">
                    <Button size="sm" className="gap-2">
                      <IconBuilding size={16} />
                      Browse Jobs
                    </Button>
                  </Link>
                </>
              )}
              {isAdmin && (
                <Link href="/admin">
                  <Button size="sm" className="gap-2">
                    <IconChartBar size={16} />
                    Admin Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* KYC Status Alert for students */}
        {!isAdmin && !hasProfile && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <IconAlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 dark:text-red-200">
                    Profile Setup Required
                  </h3>
                  <p className="text-sm text-red-800 dark:text-red-300 mt-1">
                    Please complete your profile to access placement opportunities.
                  </p>
                </div>
                <Link href="/profile">
                  <Button size="sm">
                    Create Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {!isAdmin && hasProfile && user.profile?.kycStatus === 'PENDING' && (
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <IconAlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">
                    KYC Verification Pending
                  </h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                    Please complete all steps and upload your College ID card to enable job applications.
                  </p>
                </div>
                <Link href="/profile">
                  <Button size="sm" variant="outline">
                    Upload Documents
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {!isAdmin && hasProfile && user.profile?.kycStatus === 'UNDER_REVIEW' && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <IconAlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-200">
                    KYC Verification In Progress
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                    Your documents are being verified by the admin. You'll be notified once approved.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isAdmin && profileCompletionScore < 100 && isKycVerified && (
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <IconAlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">
                    Complete Your Profile
                  </h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                    Your profile is {profileCompletionScore}% complete. Complete it to apply for jobs.
                  </p>
                  <Progress value={profileCompletionScore} className="mt-3 h-2" />
                </div>
                <Link href="/profile">
                  <Button size="sm" variant="outline">
                    Complete Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        {isAdmin ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStudents}</div>
                <p className="text-xs text-muted-foreground">
                  {verifiedProfiles} verified
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeJobs}</div>
                <p className="text-xs text-muted-foreground">
                  {totalJobs} total posted
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingEvents}</div>
                <p className="text-xs text-muted-foreground">
                  Scheduled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(totalStudents || 0) - (verifiedProfiles || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Need verification
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeJobs}</div>
                <p className="text-xs text-muted-foreground">
                  Available to apply
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">My Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{myApplications || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total applications
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingEvents}</div>
                <p className="text-xs text-muted-foreground">
                  Scheduled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Profile Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profileCompletionScore}%</div>
                <p className="text-xs text-muted-foreground">
                  Completion
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Job Openings</CardTitle>
                  <CardDescription>Latest opportunities posted</CardDescription>
                </div>
                <Link href="/jobs">
                  <Button variant="ghost" size="sm">
                    View All
                    <IconArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {!isAdmin && recentJobs && recentJobs.length > 0 ? (
                <div className="space-y-3">
                  {recentJobs.map((job) => (
                    <Link key={job.id} href={`/jobs/${job.id}`}>
                      <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <IconBuilding className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{job.title}</h4>
                          <p className="text-xs text-muted-foreground truncate">{job.companyName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{job.location}</span>
                            {job.salary && (
                              <>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="text-xs text-muted-foreground">{job.salary} LPA</span>
                              </>
                            )}
                          </div>
                        </div>
                        <IconArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <IconBriefcase className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No active jobs at the moment</p>
                  <p className="text-xs mt-1">Check back later for new opportunities</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Upcoming Events</CardTitle>
                  <CardDescription>Scheduled interviews and sessions</CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  View All
                  <IconArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <IconCalendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No upcoming events</p>
                <p className="text-xs mt-1">Events will appear here when scheduled</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

// Helper function to calculate profile completion
function calculateProfileCompletion(profile: any): number {
  let score = 0
  const totalFields = 20

  // Personal Information (5 points)
  if (profile.firstName) score++
  if (profile.lastName) score++
  if (profile.dateOfBirth) score++
  if (profile.gender) score++
  if (profile.phone || profile.callingMobile) score++

  // Contact Details (3 points)
  if (profile.email || profile.studentEmail) score++
  if (profile.currentAddress) score++
  if (profile.permanentAddress) score++

  // Academic Information (5 points)
  if (profile.usn) score++
  if (profile.branch) score++
  if (profile.cgpa || profile.finalCgpa) score++
  if (profile.tenthPercentage) score++
  if (profile.twelfthPercentage) score++

  // Professional Information (4 points)
  if (profile.skills && profile.skills.length > 0) score++
  if (profile.resume || profile.resumeUpload) score++
  if (profile.linkedin || profile.linkedinLink) score++
  if (profile.github || profile.githubLink) score++

  // KYC Status (3 points)
  if (profile.kycStatus === 'VERIFIED') score += 3
  else if (profile.kycStatus === 'UNDER_REVIEW') score += 1

  return Math.round((score / totalFields) * 100)
}

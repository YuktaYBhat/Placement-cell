import { Metadata } from "next"
import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { ApplicantsTable } from "@/components/admin/applicants-table"

type ApplicationWithUser = {
    id: string
    userId: string
    appliedAt: Date
    resumeUsed: string | null
    user: {
        id: string
        name: string | null
        email: string
        profile: {
            firstName: string | null
            lastName: string | null
            usn: string | null
            branch: string | null
            batch: string | null
            cgpa: number | null
            callingMobile: string | null
            email: string | null
            resume: string | null
        } | null
    }
}

export const metadata: Metadata = {
    title: "Job Applicants | Admin",
    description: "View and manage job applicants",
}

export default async function JobApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
        redirect("/login")
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (user?.role !== 'ADMIN') {
        redirect("/dashboard")
    }

    // Fetch job with applications
    const job = await prisma.job.findUnique({
        where: { id },
        include: {
            applications: {
                where: { isRemoved: false },
                orderBy: { appliedAt: "desc" },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            profile: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                    usn: true,
                                    branch: true,
                                    batch: true,
                                    cgpa: true,
                                    callingMobile: true,
                                    email: true,
                                    resume: true,
                                }
                            },
                            responses: {
                                include: {
                                    field: {
                                        select: { label: true }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    if (!job) {
        notFound()
    }

    // Count removed applications
    const removedCount = await prisma.application.count({
        where: { jobId: id, isRemoved: true }
    })

    // Check if there are any placements for this job
    const placementsCount = await prisma.placement.count({
        where: { jobId: id }
    })

    // Format applicants for the table
    const applicants = job.applications.map((app: ApplicationWithUser) => {
        const profile = app.user.profile
        return {
            id: app.id,
            userId: app.userId,
            name: app.user.name || `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || 'Unknown',
            email: app.user.email || profile?.email || '',
            phone: profile?.callingMobile || '',
            usn: profile?.usn || '',
            branch: profile?.branch || '',
            batch: profile?.batch || '',
            cgpa: profile?.cgpa ?? null,
            appliedAt: app.appliedAt,
            resumeUrl: app.resumeUsed || profile?.resume || '',
            responses: (app as any).responses || [],
        }
    })

    const tierLabel = job.tier.replace("_", " ")
    const categoryLabel = job.category.replace(/_/g, " ")

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/jobs">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Jobs
                    </Button>
                </Link>
            </div>

            {/* Job Summary */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl">{job.title}</CardTitle>
                            <CardDescription className="mt-2">
                                {job.companyName} • {job.location}
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Badge variant={job.isDreamOffer ? "destructive" : "default"}>
                                {job.isDreamOffer ? "Dream Offer" : tierLabel}
                            </Badge>
                            <Badge variant="outline">{categoryLabel}</Badge>
                            <Badge variant={job.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                {job.status}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center p-3 bg-muted rounded-lg">
                            <p className="text-2xl font-bold">{job.applications.length}</p>
                            <p className="text-muted-foreground">Active Applicants</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                            <p className="text-2xl font-bold text-red-600">{removedCount}</p>
                            <p className="text-muted-foreground">Removed</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                            <p className="text-2xl font-bold text-green-600">{placementsCount}</p>
                            <p className="text-muted-foreground">Placed</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                            <p className="text-2xl font-bold">₹{job.salary} LPA</p>
                            <p className="text-muted-foreground">Package</p>
                        </div>
                    </div>
                    <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                        <span>Min CGPA: {job.minCGPA || 'None'}</span>
                        <span>•</span>
                        <span>Branches: {job.allowedBranches?.length ? job.allowedBranches.join(', ') : 'All'}</span>
                        <span>•</span>
                        <span>Deadline: {job.deadline ? format(new Date(job.deadline), 'MMM dd, yyyy hh:mm a') : 'No deadline'}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Applicants Table with Export */}
            <ApplicantsTable
                jobId={job.id}
                jobTitle={job.title}
                applicants={applicants}
            />
        </div>
    )
}

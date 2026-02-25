import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Job } from "@prisma/client"

type JobWithCount = Job & {
    _count: { applications: number }
}

export const metadata: Metadata = {
    title: "Job Management | Admin",
    description: "Manage job postings and applications",
}

export default async function JobManagementPage() {
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

    // Fetch job statistics
    const [totalJobs, activeJobs, draftJobs, totalApplications] = await Promise.all([
        prisma.job.count(),
        prisma.job.count({ where: { status: 'ACTIVE' } }),
        prisma.job.count({ where: { status: 'DRAFT' } }),
        prisma.application.count()
    ])

    // Fetch recent jobs
    const recentJobs = await prisma.job.findMany({
        orderBy: {
            createdAt: "desc"
        },
        take: 10,
        include: {
            _count: {
                select: {
                    applications: true
                }
            }
        }
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-green-100 text-green-800'
            case 'DRAFT':
                return 'bg-yellow-100 text-yellow-800'
            case 'CLOSED':
                return 'bg-gray-100 text-gray-800'
            case 'CANCELLED':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Job Management</h1>
                    <p className="text-muted-foreground mt-2">
                        Create and manage job postings for students
                    </p>
                </div>
                <Link href="/admin/jobs/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Post New Job
                    </Button>
                </Link>
            </div>

            {/* Statistics */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalJobs}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{activeJobs}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Draft Jobs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{draftJobs}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalApplications}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Jobs */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Job Postings</CardTitle>
                    <CardDescription>
                        View and manage your job postings
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {recentJobs.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">No jobs posted yet.</p>
                            <Link href="/admin/jobs/new">
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Post Your First Job
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recentJobs.map((job: JobWithCount) => (
                                <div key={job.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-medium text-lg">{job.title}</h3>
                                                <Badge className={getStatusColor(job.status)}>
                                                    {job.status}
                                                </Badge>
                                                {!job.isVisible && (
                                                    <Badge variant="outline">Hidden</Badge>
                                                )}
                                            </div>
                                            <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                                                <span>{job.companyName}</span>
                                                <span>•</span>
                                                <span>{job.location}</span>
                                                <span>•</span>
                                                <span>{job.jobType.replace('_', ' ')}</span>
                                                <span>•</span>
                                                <span>{job._count.applications} applications</span>
                                            </div>
                                            {job.salary && (
                                                <p className="text-sm font-medium">{job.salary}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Link href={`/admin/jobs/${job.id}/applicants`}>
                                                <Button variant="outline" size="sm">
                                                    View Applicants
                                                </Button>
                                            </Link>
                                            <Link href={`/admin/jobs/${job.id}/edit`}>
                                                <Button variant="outline" size="sm">
                                                    Edit
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

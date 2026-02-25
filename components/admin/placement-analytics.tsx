"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Legend,
    ComposedChart,
    Area
} from "recharts"
import {
    Briefcase,
    Building2,
    CheckCircle2,
    Clock,
    FileText,
    TrendingUp,
    Users,
    IndianRupee,
    Target,
    Award
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface PlacementData {
    jobStats: Array<{ status: string; _count: { status: number } }>
    applicationStats: Array<{ status: string; _count: { status: number } }>
    topCompanies: Array<{ company: string; _count: { company: number } }>
    applicationsByJob: Array<{ id: string; title: string; company: string; _count: { applications: number } }>
    monthlyApplications: Array<{ month: Date; count: bigint }>
    salaryDistribution: Array<{ offeredSalary: number | null; _count: { offeredSalary: number } }>
    placementsByBranch: Array<{ branch: string; placed: bigint; total: bigint }>
}

interface PlacementAnalyticsProps {
    data: PlacementData
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']
const STATUS_COLORS: Record<string, string> = {
    APPLIED: '#3b82f6',
    UNDER_REVIEW: '#f59e0b',
    SHORTLISTED: '#8b5cf6',
    INTERVIEW_SCHEDULED: '#06b6d4',
    SELECTED: '#22c55e',
    REJECTED: '#ef4444',
    WITHDRAWN: '#6b7280'
}

export function PlacementAnalytics({ data }: PlacementAnalyticsProps) {
    // Calculate totals
    const totalJobs = data.jobStats.reduce((acc, stat) => acc + stat._count.status, 0)
    const activeJobs = data.jobStats.find(s => s.status === 'ACTIVE')?._count.status || 0
    const closedJobs = data.jobStats.find(s => s.status === 'CLOSED')?._count.status || 0

    const totalApplications = data.applicationStats.reduce((acc, stat) => acc + stat._count.status, 0)
    const selectedCount = data.applicationStats.find(s => s.status === 'SELECTED')?._count.status || 0
    const shortlistedCount = data.applicationStats.find(s => s.status === 'SHORTLISTED')?._count.status || 0
    const interviewCount = data.applicationStats.find(s => s.status === 'INTERVIEW_SCHEDULED')?._count.status || 0

    const placementRate = totalApplications > 0
        ? Math.round((selectedCount / totalApplications) * 100)
        : 0

    // Format monthly applications data
    const monthlyAppData = data.monthlyApplications.map(item => ({
        month: new Date(item.month).toLocaleDateString('en-US', { month: 'short' }),
        applications: Number(item.count)
    }))

    // Format application status data for pie chart
    const applicationStatusData = data.applicationStats.map(item => ({
        name: item.status.replace(/_/g, ' '),
        value: item._count.status,
        color: STATUS_COLORS[item.status] || '#6b7280'
    }))

    // Format top companies data
    const topCompaniesData = data.topCompanies.slice(0, 8).map(item => ({
        company: item.company.length > 15 ? item.company.substring(0, 15) + '...' : item.company,
        jobs: item._count.company
    }))

    // Format applications by job
    const topJobsData = data.applicationsByJob.slice(0, 5).map(item => ({
        title: item.title.length > 20 ? item.title.substring(0, 20) + '...' : item.title,
        company: item.company,
        applications: item._count.applications
    }))

    // Format placements by branch
    const branchPlacementData = data.placementsByBranch
        .filter(item => item.branch)
        .map(item => ({
            branch: item.branch,
            placed: Number(item.placed),
            total: Number(item.total),
            rate: Number(item.total) > 0
                ? Math.round((Number(item.placed) / Number(item.total)) * 100)
                : 0
        }))
        .sort((a, b) => b.rate - a.rate)

    // Calculate average salary for placed students
    const salaryData = data.salaryDistribution
        .filter(item => item.offeredSalary && item.offeredSalary > 0)
        .map(item => ({
            salary: item.offeredSalary!,
            count: item._count.offeredSalary
        }))

    const avgSalary = salaryData.length > 0
        ? salaryData.reduce((acc, item) => acc + (item.salary * item.count), 0) /
        salaryData.reduce((acc, item) => acc + item.count, 0)
        : 0

    const maxSalary = salaryData.length > 0
        ? Math.max(...salaryData.map(s => s.salary))
        : 0

    // Create salary range distribution
    const salaryRanges = [
        { range: '0-5 LPA', min: 0, max: 500000 },
        { range: '5-10 LPA', min: 500000, max: 1000000 },
        { range: '10-15 LPA', min: 1000000, max: 1500000 },
        { range: '15-20 LPA', min: 1500000, max: 2000000 },
        { range: '20+ LPA', min: 2000000, max: Infinity }
    ]

    const salaryDistributionData = salaryRanges.map(range => ({
        range: range.range,
        count: salaryData
            .filter(s => s.salary >= range.min && s.salary < range.max)
            .reduce((acc, s) => acc + s.count, 0)
    })).filter(item => item.count > 0)

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalJobs}</div>
                        <p className="text-xs text-muted-foreground">
                            <span className="text-green-600">{activeJobs} active</span>
                            {" · "}
                            <span className="text-gray-500">{closedJobs} closed</span>
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Applications</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalApplications}</div>
                        <p className="text-xs text-muted-foreground">
                            {shortlistedCount + interviewCount} in pipeline
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Students Placed</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{selectedCount}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <Progress value={placementRate} className="h-2" />
                            <span className="text-xs text-muted-foreground">{placementRate}%</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Package</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {avgSalary > 0 ? `₹${(avgSalary / 100000).toFixed(1)}L` : '-'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {maxSalary > 0 && `Highest: ₹${(maxSalary / 100000).toFixed(1)}L`}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Application Status Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Application Status</CardTitle>
                        <CardDescription>Distribution of applications by status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={applicationStatusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ percent }) => `${((percent as number) * 100).toFixed(0)}%`}
                                >
                                    {applicationStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number | undefined) => [value, 'Applications']}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    formatter={(value) => <span className="text-xs">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Monthly Applications Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle>Application Trends</CardTitle>
                        <CardDescription>Applications received over the last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={monthlyAppData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Area
                                    type="monotone"
                                    dataKey="applications"
                                    fill="#3b82f6"
                                    fillOpacity={0.2}
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="applications"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Top Companies */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Recruiting Companies</CardTitle>
                        <CardDescription>Companies with most job postings</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={topCompaniesData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="company" type="category" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="jobs" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Salary Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Package Distribution</CardTitle>
                        <CardDescription>Salary distribution for placed students</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {salaryDistributionData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={salaryDistributionData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]}>
                                        {salaryDistributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                No salary data available yet
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Branch-wise Placements */}
            <Card>
                <CardHeader>
                    <CardTitle>Branch-wise Placements</CardTitle>
                    <CardDescription>Placement statistics across different branches</CardDescription>
                </CardHeader>
                <CardContent>
                    {branchPlacementData.length > 0 ? (
                        <div className="space-y-4">
                            {branchPlacementData.map((branch, index) => (
                                <div key={branch.branch} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                            >
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium">{branch.branch}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {branch.placed} placed out of {branch.total} students
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-32">
                                                <Progress value={branch.rate} className="h-2" />
                                            </div>
                                            <Badge variant={branch.rate >= 50 ? "default" : "secondary"}>
                                                {branch.rate}%
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                            No placement data available yet
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Popular Jobs Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Most Applied Jobs</CardTitle>
                    <CardDescription>Jobs with the highest number of applications</CardDescription>
                </CardHeader>
                <CardContent>
                    {topJobsData.length > 0 ? (
                        <div className="space-y-4">
                            {topJobsData.map((job, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <Building2 className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{job.title}</p>
                                            <p className="text-sm text-muted-foreground">{job.company}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-muted-foreground" />
                                        <Badge variant="secondary">{job.applications} applications</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                            No jobs with applications yet
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">In Interview</p>
                                <p className="text-3xl font-bold">{interviewCount}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-cyan-100 flex items-center justify-center">
                                <Clock className="h-6 w-6 text-cyan-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Shortlisted</p>
                                <p className="text-3xl font-bold">{shortlistedCount}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                                <Target className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Companies Hiring</p>
                                <p className="text-3xl font-bold">{data.topCompanies.length}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

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
  Area,
  AreaChart
} from "recharts"
import {
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
  GraduationCap,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle
} from "lucide-react"

interface AnalyticsData {
  userStats: Array<{ role: string; _count: { role: number } }>
  profileStats: Array<{ isComplete: boolean; _count: { isComplete: number } }>
  eventStats: Array<{ status: string; _count: { status: number } }>
  branchDistribution: Array<{ branch: string | null; _count: { branch: number } }>
  monthlyRegistrations: Array<{ month: Date; count: bigint }>
  kycStatusDistribution: Array<{ kycStatus: string; _count: { kycStatus: number } }>
}

interface AdminAnalyticsProps {
  data: AnalyticsData
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function AdminAnalytics({ data }: AdminAnalyticsProps) {
  const totalUsers = data.userStats.reduce((acc, stat) => acc + stat._count.role, 0)
  const studentCount = data.userStats.find(stat => stat.role === 'STUDENT')?._count.role || 0
  const adminCount = data.userStats.find(stat => stat.role === 'ADMIN')?._count.role || 0

  const completeProfiles = data.profileStats.find(stat => stat.isComplete === true)?._count.isComplete || 0
  const incompleteProfiles = data.profileStats.find(stat => stat.isComplete === false)?._count.isComplete || 0
  const profileCompletionRate = studentCount > 0 ? Math.round((completeProfiles / studentCount) * 100) : 0

  const verifiedProfiles = data.kycStatusDistribution.find(stat => stat.kycStatus === 'VERIFIED')?._count.kycStatus || 0
  const pendingProfiles = data.kycStatusDistribution.find(stat => stat.kycStatus === 'PENDING')?._count.kycStatus || 0
  const rejectedProfiles = data.kycStatusDistribution.find(stat => stat.kycStatus === 'REJECTED')?._count.kycStatus || 0

  // Format monthly registration data
  const monthlyRegData = data.monthlyRegistrations.map(item => ({
    month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    registrations: Number(item.count)
  }))

  // Format branch data for charts
  const branchData = data.branchDistribution
    .filter(item => item.branch !== null)
    .map(item => ({
      branch: item.branch,
      count: item._count.branch
    }))
    .sort((a, b) => b.count - a.count)

  // KYC status data for pie chart
  const kycData = data.kycStatusDistribution.map(item => ({
    status: item.kycStatus,
    count: item._count.kycStatus
  }))

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {studentCount} students, {adminCount} admins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Completion</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profileCompletionRate}%</div>
            <Progress value={profileCompletionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {completeProfiles} complete, {incompleteProfiles} incomplete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Students</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedProfiles}</div>
            <p className="text-xs text-muted-foreground">
              {pendingProfiles} pending verification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.eventStats.find(stat => stat.status === 'SCHEDULED')?._count.status || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Scheduled placement events
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Registrations */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Registrations</CardTitle>
            <CardDescription>User registration trends over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyRegData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="registrations"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* KYC Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>KYC Status Distribution</CardTitle>
            <CardDescription>Student verification status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={kycData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(Number(percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="status"
                >
                  {kycData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Branch Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Branch Distribution</CardTitle>
          <CardDescription>Student distribution across different engineering branches</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={branchData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="branch" type="category" width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Statistics */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* KYC Status Details */}
        <Card>
          <CardHeader>
            <CardTitle>KYC Status Details</CardTitle>
            <CardDescription>Detailed breakdown of student verification status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">
                  {verifiedProfiles}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {studentCount > 0 ? Math.round((verifiedProfiles / studentCount) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-100 text-yellow-800">
                  {pendingProfiles}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {studentCount > 0 ? Math.round((pendingProfiles / studentCount) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm">Rejected</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-100 text-red-800">
                  {rejectedProfiles}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {studentCount > 0 ? Math.round((rejectedProfiles / studentCount) * 100) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Branches */}
        <Card>
          <CardHeader>
            <CardTitle>Top Engineering Branches</CardTitle>
            <CardDescription>Most popular branches by student count</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {branchData.slice(0, 5).map((branch, index) => (
              <div key={branch.branch} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium">{branch.branch}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress
                    value={(branch.count / branchData[0].count) * 100}
                    className="w-20 h-2"
                  />
                  <Badge variant="secondary">{branch.count}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

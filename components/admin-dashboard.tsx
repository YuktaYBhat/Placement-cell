"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { SidebarInset } from "@/components/ui/sidebar"
import {
  Users,
  UserCheck,
  Clock,
  Calendar,
  TrendingUp,
  FileText,
  CheckCircle,
  AlertCircle,
  Activity,
  Bell
} from "lucide-react"
import Link from "next/link"

interface AnalyticsData {
  totalUsers: number
  verifiedStudents: number
  pendingVerifications: number
  totalEvents: number
  activeEvents: number
  totalProfiles: number
  completionRate: number
}

interface AdminUser {
  role: string
  name: string | null
  email: string | null
}

interface AdminDashboardProps {
  user: AdminUser
  analytics: AnalyticsData
}

export function AdminDashboard({ user, analytics }: AdminDashboardProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>

      {/* Welcome Section */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl lg:text-2xl font-bold mb-2">
              Welcome back, {user.name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-muted-foreground text-sm lg:text-base">
              Manage your placement portal, track student progress, and monitor system activities.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="sm" className="gap-2" asChild>
              <Link href="/admin/analytics">
                <FileText size={16} />
                View Reports
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <Link href="/admin/students">
                <Users size={16} />
                Manage Students
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered users in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Students</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.verifiedStudents}</div>
            <p className="text-xs text-muted-foreground">
              KYC verified profiles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.pendingVerifications}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting KYC review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeEvents}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled placement events
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Profile Completion Stats */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={16} />
              Profile Completion Overview
            </CardTitle>
            <CardDescription>
              Student profile completion statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Completion Rate</span>
                <span className="font-medium">{analytics.completionRate}%</span>
              </div>
              <Progress value={analytics.completionRate} className="h-2" />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span className="text-sm">Complete Profiles</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {analytics.totalProfiles}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-orange-500" />
                  <span className="text-sm">Incomplete Profiles</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {analytics.totalUsers - analytics.totalProfiles}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild>
              <Link href="/admin/kyc-queue">
                <UserCheck size={16} />
                Review KYC Queue
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild>
              <Link href="/admin/schedule">
                <Calendar size={16} />
                Schedule Event
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild>
              <Link href="/admin/notifications">
                <Bell size={16} />
                Bulk Notifications
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild>
              <Link href="/admin/analytics">
                <Activity size={16} />
                View Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & System Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system activities and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="text-sm">
                  <p className="font-medium">New student registered</p>
                  <p className="text-muted-foreground">John Doe completed profile - 2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="text-sm">
                  <p className="font-medium">KYC verification completed</p>
                  <p className="text-muted-foreground">5 profiles verified - 4 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="text-sm">
                  <p className="font-medium">Interview scheduled</p>
                  <p className="text-muted-foreground">TechCorp placement drive - 1 day ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="text-sm">
                  <p className="font-medium">Bulk notification sent</p>
                  <p className="text-muted-foreground">Placement updates to 200+ students - 2 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system health and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Database Status</span>
                <Badge className="bg-green-100 text-green-800">
                  Healthy
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Email Service</span>
                <Badge className="bg-green-100 text-green-800">
                  Active
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">File Storage</span>
                <Badge className="bg-green-100 text-green-800">
                  Operational
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Background Jobs</span>
                <Badge variant="secondary">
                  3 Running
                </Badge>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Storage Used</span>
                  <span className="font-medium">2.4 GB / 10 GB</span>
                </div>
                <Progress value={24} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

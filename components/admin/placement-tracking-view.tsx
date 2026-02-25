"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Calendar,
  Users,
  Building2,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  BarChart3
} from "lucide-react"
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
  Cell
} from "recharts"

interface PlacementEvent {
  id: string
  title: string
  description: string | null
  date: Date
  duration: number
  location: string | null
  type: string
  company: string | null
  status: string
  attendees: {
    id: string
    status: string
    user: {
      id: string
      name: string | null
      email: string | null
      profile: {
        firstName: string | null
        lastName: string | null
        branch: string | null
      } | null
    }
  }[]
}

interface PlacementOverview {
  totalEvents: number
  upcomingEventsCount: number
  completedEvents: number
  totalAttendees: number
}

interface AttendeeStats {
  status: string
  _count: {
    status: number
  }
}

interface BranchPlacement {
  branch: string | null
  _count: {
    branch: number
  }
}

interface RecentPlacement {
  id: string
  firstName: string | null
  lastName: string | null
  branch: string | null
  updatedAt: Date
  user: {
    name: string | null
    email: string | null
  }
}

interface PlacementTrackingData {
  overview: PlacementOverview
  upcomingEvents: PlacementEvent[]
  attendeeStats: AttendeeStats[]
  branchWisePlacement: BranchPlacement[]
  recentPlacements: RecentPlacement[]
}

interface PlacementTrackingViewProps {
  data: PlacementTrackingData
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export function PlacementTrackingView({ data }: PlacementTrackingViewProps) {
  const { overview, upcomingEvents, attendeeStats, branchWisePlacement, recentPlacements } = data

  // Format attendee stats for pie chart
  const attendeeChartData = attendeeStats.map(stat => ({
    name: stat.status,
    value: stat._count.status
  }))

  // Format branch data for bar chart
  const branchChartData = branchWisePlacement
    .filter(item => item.branch !== null)
    .map(item => ({
      branch: item.branch,
      students: item._count.branch
    }))
    .sort((a, b) => b.students - a.students)

  const getEventTypeBadge = (type: string) => {
    const colors = {
      'INTERVIEW': 'bg-blue-100 text-blue-800',
      'TEST': 'bg-yellow-100 text-yellow-800',
      'GROUP_DISCUSSION': 'bg-green-100 text-green-800',
      'PRESENTATION': 'bg-purple-100 text-purple-800',
      'MEETING': 'bg-gray-100 text-gray-800',
      'WEBINAR': 'bg-indigo-100 text-indigo-800'
    }
    return (
      <Badge className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {type.replace('_', ' ')}
      </Badge>
    )
  }

  const getAttendeeStatusBadge = (status: string) => {
    switch (status) {
      case 'ATTENDED':
        return <Badge className="bg-green-100 text-green-800">Attended</Badge>
      case 'REGISTERED':
        return <Badge className="bg-blue-100 text-blue-800">Registered</Badge>
      case 'ABSENT':
        return <Badge className="bg-red-100 text-red-800">Absent</Badge>
      case 'CANCELLED':
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              All placement events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.upcomingEventsCount}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Events</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.completedEvents}</div>
            <p className="text-xs text-muted-foreground">
              Finished events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalAttendees}</div>
            <p className="text-xs text-muted-foreground">
              Event registrations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Branch-wise Placement Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Branch-wise Student Distribution</CardTitle>
            <CardDescription>Students distribution across engineering branches</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={branchChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="branch" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="students" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attendee Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Event Attendance Status</CardTitle>
            <CardDescription>Distribution of attendee statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={attendeeChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(Number(percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {attendeeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Upcoming Placement Events</CardTitle>
              <CardDescription>
                Scheduled interviews, tests, and other placement activities
              </CardDescription>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4" />
              Export Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Attendees</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{event.title}</div>
                        {event.description && (
                          <div className="text-sm text-muted-foreground">
                            {event.description.substring(0, 60)}...
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {event.company ? (
                        <Badge variant="outline">{event.company}</Badge>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getEventTypeBadge(event.type)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {new Date(event.date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(event.date).toLocaleTimeString()} ({event.duration}min)
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {event.location || 'TBD'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {event.attendees.length}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {upcomingEvents.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No upcoming events</h3>
              <p className="text-muted-foreground">
                No placement events scheduled at the moment.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Placements Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest student profile updates and verifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPlacements.slice(0, 10).map((placement) => (
              <div key={placement.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {placement.firstName && placement.lastName
                        ? `${placement.firstName} ${placement.lastName}`
                        : placement.user.name || 'Anonymous Student'
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {placement.branch} • Profile updated
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {new Date(placement.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal,
  Eye,
  Mail,
  UserCheck,
  Clock,
  XCircle,
  CheckCircle
} from "lucide-react"
import { format } from "date-fns"

interface Profile {
  id: string
  firstName: string | null
  lastName: string | null
  isComplete: boolean
  completionStep: number
  kycStatus: string
  usn: string | null
  branch: string | null
  batch: string | null
  phone: string | null
  verifiedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

interface Student {
  id: string
  name: string | null
  email: string | null
  createdAt: Date
  profile: Profile | null
}

interface StudentManagementProps {
  students: Student[]
  adminId: string
}

export function StudentManagement({ students, adminId }: StudentManagementProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBranch, setFilterBranch] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Get unique branches for filter
  const branches = Array.from(new Set(
    students
      .map(s => s.profile?.branch)
      .filter(Boolean)
  )) as string[]

  // Filter students based on search and filters
  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchTerm || 
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.profile?.usn?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesBranch = filterBranch === "all" || student.profile?.branch === filterBranch
    
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "complete" && student.profile?.isComplete) ||
      (filterStatus === "incomplete" && !student.profile?.isComplete) ||
      (filterStatus === "verified" && student.profile?.kycStatus === "VERIFIED") ||
      (filterStatus === "pending" && student.profile?.kycStatus === "PENDING")

    return matchesSearch && matchesBranch && matchesStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'UNDER_REVIEW':
        return <UserCheck className="w-4 h-4 text-blue-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Complete Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter(s => s.profile?.isComplete).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Verified Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter(s => s.profile?.kycStatus === 'VERIFIED').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter(s => s.profile?.kycStatus === 'PENDING').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Student Directory</CardTitle>
          <CardDescription>
            Manage and monitor all student accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name, email, or USN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterBranch} onValueChange={setFilterBranch}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map(branch => (
                  <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="complete">Complete Profiles</SelectItem>
                <SelectItem value="incomplete">Incomplete Profiles</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending Verification</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>

          {/* Students Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>USN</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Profile Status</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="" />
                          <AvatarFallback>
                            {student.name?.charAt(0) || student.profile?.firstName?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {student.name || `${student.profile?.firstName || ''} ${student.profile?.lastName || ''}`.trim() || 'Unknown User'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {student.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {student.profile?.usn || 'Not provided'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {student.profile?.branch ? (
                        <Badge variant="outline">{student.profile.branch}</Badge>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.profile?.isComplete ? (
                        <Badge className="bg-green-100 text-green-800">
                          Complete
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Step {student.profile?.completionStep || 1}/7
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(student.profile?.kycStatus || 'PENDING')}
                        <Badge className={getStatusColor(student.profile?.kycStatus || 'PENDING')}>
                          {student.profile?.kycStatus?.replace('_', ' ') || 'PENDING'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {format(new Date(student.createdAt), 'MMM dd, yyyy')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem className="gap-2">
                            <Eye className="w-4 h-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Mail className="w-4 h-4" />
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2">
                            <UserCheck className="w-4 h-4" />
                            Verify KYC
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Users, 
  Search, 
  Filter,
  Eye,
  UserCheck,
  UserX,
  Download,
  Mail,
  Phone
} from "lucide-react"

interface Student {
  id: string
  firstName: string | null
  lastName: string | null
  branch: string | null
  kycStatus: string
  phone: string | null
  usn: string | null
  cgpa: number | null
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    name: string | null
    email: string | null
    createdAt: Date
    role: string
  }
}

interface StudentManagementViewProps {
  students: Student[]
  totalCount: number
}

export function StudentManagementView({ students, totalCount }: StudentManagementViewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [branchFilter, setBranchFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  // Filter students based on search and filters
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.usn?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesBranch = branchFilter === "all" || student.branch === branchFilter
    const matchesStatus = statusFilter === "all" || student.kycStatus === statusFilter

    return matchesSearch && matchesBranch && matchesStatus
  })

  // Get unique branches for filter
  const branches = Array.from(new Set(students.map(s => s.branch).filter(Boolean)))

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      case 'UNDER_REVIEW':
        return <Badge className="bg-blue-100 text-blue-800">Under Review</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter(s => s.kycStatus === 'VERIFIED').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter(s => s.kycStatus === 'PENDING').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Branches</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branches.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Student Directory</CardTitle>
          <CardDescription>
            Manage and view all student profiles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or USN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map(branch => (
                  <SelectItem key={branch} value={branch!}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Download className="h-4 w-4" />
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
                  <TableHead>CGPA</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {student.firstName && student.lastName 
                            ? `${student.firstName} ${student.lastName}`
                            : student.user.name || 'No Name'
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {student.user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {student.usn || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {student.branch || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {student.cgpa ? student.cgpa.toFixed(2) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(student.kycStatus)}
                    </TableCell>
                    <TableCell>
                      {new Date(student.user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedStudent(student)}
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Student Profile</DialogTitle>
                            <DialogDescription>
                              Detailed information for {student.user.name}
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedStudent && (
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Full Name</label>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedStudent.firstName && selectedStudent.lastName 
                                      ? `${selectedStudent.firstName} ${selectedStudent.lastName}`
                                      : selectedStudent.user.name || 'No Name'
                                    }
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Email</label>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedStudent.user.email}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">USN</label>
                                  <p className="text-sm text-muted-foreground font-mono">
                                    {selectedStudent.usn || 'Not provided'}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Branch</label>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedStudent.branch || 'Not specified'}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">CGPA</label>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedStudent.cgpa ? selectedStudent.cgpa.toFixed(2) : 'Not available'}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">KYC Status</label>
                                  <div className="mt-1">
                                    {getStatusBadge(selectedStudent.kycStatus)}
                                  </div>
                                </div>
                              </div>
                              
                              {selectedStudent.phone && (
                                <div>
                                  <label className="text-sm font-medium">Phone</label>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedStudent.phone}
                                  </p>
                                </div>
                              )}
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Registered</label>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(selectedStudent.user.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Last Updated</label>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(selectedStudent.updatedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <DialogFooter>
                            <Button variant="outline">
                              <Mail className="h-4 w-4" />
                              Send Email
                            </Button>
                            <Button>
                              <UserCheck className="h-4 w-4" />
                              Verify Profile
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No students found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

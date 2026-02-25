"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Building2, 
  Search, 
  Eye,
  Mail,
  Calendar,
  Plus,
  Briefcase,
  Users
} from "lucide-react"

interface Company {
  id: string
  name: string | null
  email: string | null
  createdAt: Date
  updatedAt: Date
}

interface JobPostingStat {
  company: string | null
  _count: {
    company: number
  }
}

interface CompanyManagementViewProps {
  companies: Company[]
  totalCount: number
  jobPostingStats: JobPostingStat[]
}

export function CompanyManagementView({ companies, totalCount, jobPostingStats }: CompanyManagementViewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  // Filter companies based on search
  const filteredCompanies = companies.filter(company => 
    company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get job posting count for a company
  const getJobPostingCount = (companyName: string | null) => {
    if (!companyName) return 0
    const stat = jobPostingStats.find(stat => stat.company === companyName)
    return stat?._count.company || 0
  }

  const totalJobPostings = jobPostingStats.reduce((acc, stat) => acc + stat._count.company, 0)

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Postings</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJobPostings}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companies.filter(c => 
                new Date(c.createdAt).getMonth() === new Date().getMonth()
              ).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hiring Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobPostingStats.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Company Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Company Directory</CardTitle>
              <CardDescription>
                Manage registered companies and recruiters
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4" />
              Add Company
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Button variant="outline">
              <Mail className="h-4 w-4" />
              Bulk Email
            </Button>
          </div>

          {/* Companies Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact Email</TableHead>
                  <TableHead>Active Postings</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {company.name || 'Unnamed Company'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ID: {company.id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {company.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        {getJobPostingCount(company.name)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(company.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedCompany(company)}
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Company Details</DialogTitle>
                              <DialogDescription>
                                Information for {company.name}
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedCompany && (
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Company Name</label>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedCompany.name || 'Not provided'}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Contact Email</label>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedCompany.email}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Company ID</label>
                                    <p className="text-sm text-muted-foreground font-mono">
                                      {selectedCompany.id}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Active Job Postings</label>
                                    <p className="text-sm text-muted-foreground">
                                      {getJobPostingCount(selectedCompany.name)} active postings
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Registered Date</label>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(selectedCompany.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Last Activity</label>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(selectedCompany.updatedAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })}
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
                              <Button variant="outline">
                                <Calendar className="h-4 w-4" />
                                Schedule Meeting
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredCompanies.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No companies found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Hiring Companies */}
      {jobPostingStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Hiring Companies</CardTitle>
            <CardDescription>
              Companies with the most active job postings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobPostingStats
                .sort((a, b) => b._count.company - a._count.company)
                .slice(0, 5)
                .map((stat, index) => (
                  <div key={stat.company} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{stat.company}</p>
                        <p className="text-sm text-muted-foreground">
                          {stat._count.company} active posting{stat._count.company !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {stat._count.company}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

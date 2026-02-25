"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  MapPin,
  Building2,
  Clock,
  Briefcase,
  Users,
  AlertCircle,
  ChevronRight
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface Job {
  id: string
  title: string
  companyName: string
  companyLogo?: string
  location: string
  jobType: string
  workMode: string
  salary?: string
  tier: string
  category: string
  isDreamOffer: boolean
  minCGPA?: number
  allowedBranches: string[]
  eligibleBatch?: string
  maxBacklogs?: number
  requiredSkills: string[]
  deadline?: string
  noOfPositions?: number
  createdAt: string
  _count: {
    applications: number
  }
  isEligible: boolean
  eligibilityIssues: string[]
  hasApplied: boolean
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [jobType, setJobType] = useState("ALL")
  const [workMode, setWorkMode] = useState("ALL")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchJobs = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      })

      if (search) params.append("search", search)
      if (jobType !== "ALL") params.append("jobType", jobType)
      if (workMode !== "ALL") params.append("workMode", workMode)

      const response = await fetch(`/api/jobs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs)
        setTotalPages(data.pagination.pages)
      } else {
        console.error("Failed to fetch jobs:", response.status, response.statusText)
        // Check if 401
        if (response.status === 401) {
          console.error("User unauthorized, session might be invalid")
        }
      }
    } catch (error) {
      console.error("Error fetching jobs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [page, jobType, workMode])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchJobs()
  }

  const getJobTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      FULL_TIME: "Full Time",
      PART_TIME: "Part Time",
      INTERNSHIP: "Internship",
      CONTRACT: "Contract",
      FREELANCE: "Freelance"
    }
    return labels[type] || type
  }

  const getWorkModeLabel = (mode: string) => {
    const labels: Record<string, string> = {
      OFFICE: "On-site",
      REMOTE: "Remote",
      HYBRID: "Hybrid",
      FLEXIBLE: "Flexible"
    }
    return labels[mode] || mode
  }

  const getTierVariant = (tier: string, isDreamOffer: boolean): "default" | "secondary" | "outline" | "destructive" => {
    if (isDreamOffer) return "destructive"
    if (tier === "TIER_1") return "default"
    if (tier === "TIER_2") return "secondary"
    return "outline"
  }

  const getTierLabel = (tier: string, isDreamOffer: boolean) => {
    if (isDreamOffer) return "Dream Offer"
    return tier.replace("_", " ")
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      TRAINING_INTERNSHIP: "Training + Internship",
      INTERNSHIP: "Internship",
      FTE: "Full Time Employment"
    }
    return labels[category] || category
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Job Opportunities</h1>
        <p className="text-muted-foreground mt-2">
          Explore and apply to placement opportunities
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search jobs, companies, or locations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="FULL_TIME">Full Time</SelectItem>
                <SelectItem value="INTERNSHIP">Internship</SelectItem>
                <SelectItem value="PART_TIME">Part Time</SelectItem>
                <SelectItem value="CONTRACT">Contract</SelectItem>
              </SelectContent>
            </Select>
            <Select value={workMode} onValueChange={setWorkMode}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Work Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Modes</SelectItem>
                <SelectItem value="OFFICE">On-site</SelectItem>
                <SelectItem value="REMOTE">Remote</SelectItem>
                <SelectItem value="HYBRID">Hybrid</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Jobs List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-1/3 mb-4" />
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-4 bg-muted rounded w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No jobs found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search filters or check back later for new opportunities.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card
              key={job.id}
              className={`hover:shadow-md transition-shadow ${!job.isEligible ? 'opacity-75' : ''}`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      {job.companyLogo ? (
                        <img
                          src={job.companyLogo}
                          alt={job.companyName}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-lg font-semibold">{job.title}</h3>
                          <Badge variant={getTierVariant(job.tier, job.isDreamOffer)}>
                            {getTierLabel(job.tier, job.isDreamOffer)}
                          </Badge>
                          <Badge variant="outline">{getCategoryLabel(job.category)}</Badge>
                          {job.hasApplied && (
                            <Badge className="bg-green-100 text-green-800">Applied</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground">{job.companyName}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {getJobTypeLabel(job.jobType)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {getWorkModeLabel(job.workMode)}
                      </span>
                      {job.salary && <span className="flex items-center gap-1 font-medium text-green-600">
                        ₹{job.salary} LPA
                      </span>}
                      {job.noOfPositions && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {job.noOfPositions} positions
                        </span>
                      )}
                      {job.deadline && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Deadline: {format(new Date(job.deadline), 'MMM dd, yyyy')}
                        </span>
                      )}
                    </div>

                    {job.requiredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {job.requiredSkills.slice(0, 5).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {job.requiredSkills.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{job.requiredSkills.length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {!job.isEligible && job.eligibilityIssues.length > 0 && (
                      <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>Not Eligible: {job.eligibilityIssues[0]}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Link href={`/jobs/${job.id}`}>
                      <Button variant={job.hasApplied ? "outline" : "default"} disabled={!job.isEligible && !job.hasApplied}>
                        {job.hasApplied ? "View Application" : "View Details"}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {job._count.applications} applied
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
} 
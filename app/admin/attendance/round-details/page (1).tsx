"use client"

import { useState, useEffect, Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    CheckCircle,
    XCircle,
    Users,
    ArrowLeft,
    Download,
    FileText,
    GraduationCap,
    Clock,
    ThumbsUp,
    ThumbsDown,
    BarChart3,
    Loader2,
    User,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

interface AttendanceRecord {
    id: string
    userId: string
    status: string
    markedAt: string
    user: {
        id: string
        name: string
        email: string
    }
    round: {
        id: string
        name: string
        order: number
    }
    profile?: {
        userId: string
        usn?: string
        branch?: string
        profilePhoto?: string
        finalCgpa?: number
        cgpa?: number
        resumeUpload?: string
        resume?: string
        firstName?: string
        lastName?: string
    } | null
}

function RoundDetailsContent() {
    const searchParams = useSearchParams()
    const jobId = searchParams.get("jobId")
    const roundId = searchParams.get("roundId")

    const [attendances, setAttendances] = useState<AttendanceRecord[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)

    const fetchAttendances = async () => {
        if (!jobId || !roundId) return

        setIsLoading(true)
        try {
            const params = new URLSearchParams({
                roundId,
                page: page.toString(),
                limit: "50",
            })
            if (statusFilter !== "ALL") params.set("status", statusFilter)

            const response = await fetch(`/api/admin/jobs/${jobId}/round-attendance?${params}`)
            if (response.ok) {
                const data = await response.json()
                setAttendances(data.attendances || [])
                setTotalPages(data.pagination?.pages || 1)
                setTotal(data.pagination?.total || 0)
            }
        } catch (error) {
            console.error("Error fetching attendances:", error)
            toast.error("Failed to load attendance records")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchAttendances()
    }, [jobId, roundId, statusFilter, page])

    const updateStatus = async (attendanceId: string, status: string) => {
        try {
            const response = await fetch(`/api/admin/jobs/${jobId}/round-attendance`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ attendanceId, status }),
            })

            if (response.ok) {
                toast.success(`Status updated to ${status}`)
                fetchAttendances()
            } else {
                const data = await response.json()
                toast.error(data.error || "Failed to update status")
            }
        } catch (error) {
            toast.error("Failed to update status")
        }
    }

    const exportCSV = () => {
        if (attendances.length === 0) {
            toast.error("No data to export")
            return
        }

        const headers = [
            "sl_no",
            "student_name",
            "email",
            "usn",
            "branch",
            "cgpa",
            "round",
            "status",
            "marked_at",
        ]

        const rows = attendances.map((a, i) => [
            i + 1,
            a.user.name || `${a.profile?.firstName || ""} ${a.profile?.lastName || ""}`.trim(),
            a.user.email,
            a.profile?.usn || "N/A",
            a.profile?.branch || "N/A",
            (a.profile?.finalCgpa || a.profile?.cgpa || "N/A"),
            a.round.name,
            a.status,
            format(new Date(a.markedAt), "yyyy-MM-dd HH:mm:ss"),
        ])

        const csv = [headers.join(","), ...rows.map((r) => r.map((val) => `"${val}"`).join(","))].join("\n")

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `attendance_round_${roundId}_${format(new Date(), "yyyy-MM-dd")}.csv`
        link.click()
        URL.revokeObjectURL(url)

        toast.success("CSV exported successfully")
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "ATTENDED":
                return <Badge className="bg-blue-500 border-0 text-white">Attended</Badge>
            case "PASSED":
                return <Badge className="bg-emerald-500 border-0 text-white">Passed</Badge>
            case "FAILED":
                return <Badge className="bg-red-500 border-0 text-white">Failed</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    // Stats
    const attendedCount = attendances.filter((a) => a.status === "ATTENDED").length
    const passedCount = attendances.filter((a) => a.status === "PASSED").length
    const failedCount = attendances.filter((a) => a.status === "FAILED").length
    const roundName = attendances[0]?.round?.name || "Round"

    if (!jobId || !roundId) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Missing jobId or roundId parameters.</p>
                <Link href="/admin/attendance">
                    <Button className="mt-4">Go Back</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
                <Link href="/admin/attendance">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                </Link>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-600 to-violet-600 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{roundName} — Attendance Details</h1>
                        <p className="text-sm text-muted-foreground">{total} total records</p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-7xl px-4 py-4 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border-indigo-200/50">
                        <CardContent className="p-4 text-center">
                            <div className="text-3xl font-bold text-indigo-600">{total}</div>
                            <p className="text-sm text-muted-foreground mt-1">Total</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30 border-blue-200/50">
                        <CardContent className="p-4 text-center">
                            <div className="text-3xl font-bold text-blue-600">{attendedCount}</div>
                            <p className="text-sm text-muted-foreground mt-1">Attended</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200/50">
                        <CardContent className="p-4 text-center">
                            <div className="text-3xl font-bold text-emerald-600">{passedCount}</div>
                            <p className="text-sm text-muted-foreground mt-1">Passed</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200/50">
                        <CardContent className="p-4 text-center">
                            <div className="text-3xl font-bold text-red-600">{failedCount}</div>
                            <p className="text-sm text-muted-foreground mt-1">Failed</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters & Export */}
                <div className="flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex gap-3 items-center">
                        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value="ATTENDED">Attended Only</SelectItem>
                                <SelectItem value="PASSED">Passed Only</SelectItem>
                                <SelectItem value="FAILED">Failed Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button variant="outline" onClick={exportCSV} disabled={attendances.length === 0}>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                </div>

                {/* Attendance Table */}
                <Card className="border-2">
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-16 text-muted-foreground">
                                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                                Loading attendance records...
                            </div>
                        ) : attendances.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground space-y-3">
                                <Users className="w-12 h-12 mx-auto text-muted-foreground/50" />
                                <div>
                                    <p className="font-medium">No attendance records</p>
                                    <p className="text-sm mt-1">No students have been marked for this filter</p>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b bg-muted/30">
                                            <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">#</th>
                                            <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Student</th>
                                            <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">USN</th>
                                            <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Branch</th>
                                            <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">CGPA</th>
                                            <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                                            <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Time</th>
                                            <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendances.map((a, index) => (
                                            <tr key={a.id} className="border-b hover:bg-muted/20 transition-colors">
                                                <td className="p-4 text-sm text-muted-foreground">{(page - 1) * 50 + index + 1}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        {a.profile?.profilePhoto ? (
                                                            <img
                                                                src={a.profile.profilePhoto}
                                                                alt=""
                                                                className="w-9 h-9 rounded-full object-cover border"
                                                            />
                                                        ) : (
                                                            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                                                                <User className="w-4 h-4 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-medium text-sm leading-tight">{a.user.name || `${a.profile?.firstName || ""} ${a.profile?.lastName || ""}`}</p>
                                                            <p className="text-xs text-muted-foreground">{a.user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 font-mono text-sm">{a.profile?.usn || "—"}</td>
                                                <td className="p-4 text-sm">{a.profile?.branch || "—"}</td>
                                                <td className="p-4 text-sm">{(a.profile?.finalCgpa || a.profile?.cgpa)?.toFixed(2) || "—"}</td>
                                                <td className="p-4">{getStatusBadge(a.status)}</td>
                                                <td className="p-4 text-sm text-muted-foreground">{format(new Date(a.markedAt), "HH:mm")}</td>
                                                <td className="p-4 text-right">
                                                    <div className="flex gap-1 justify-end">
                                                        {a.status !== "PASSED" && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                                onClick={() => updateStatus(a.id, "PASSED")}
                                                                title="Mark as Passed"
                                                            >
                                                                <ThumbsUp className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        {a.status !== "FAILED" && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                        title="Mark as Failed"
                                                                    >
                                                                        <ThumbsDown className="w-4 h-4" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Mark as Failed?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            This student will be marked as &quot;Failed&quot; for {a.round.name} and will not be eligible for subsequent rounds.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => updateStatus(a.id, "FAILED")}
                                                                        >
                                                                            Mark as Failed
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        )}
                                                        {(a.profile?.resumeUpload || a.profile?.resume) && (
                                                            <a
                                                                href={a.profile.resumeUpload || a.profile.resume}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                    title="View Resume"
                                                                >
                                                                    <FileText className="w-4 h-4" />
                                                                </Button>
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 py-4">
                        <Button
                            variant="outline"
                            disabled={page === 1}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            Previous
                        </Button>
                        <span className="flex items-center px-4 text-sm text-muted-foreground">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            disabled={page === totalPages}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function RoundDetailsPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Loading round details...
                </div>
            }
        >
            <RoundDetailsContent />
        </Suspense>
    )
}

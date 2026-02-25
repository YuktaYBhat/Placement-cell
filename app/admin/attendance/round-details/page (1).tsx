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

    // ===== Null-guard added to fix build error =====
    if (!searchParams) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Missing search parameters</p>
                <Link href="/admin/attendance">
                    <Button className="mt-4">Go Back</Button>
                </Link>
            </div>
        )
    }

    const jobId = searchParams.get("jobId") || ""
    const roundId = searchParams.get("roundId") || ""

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
            {/* You can keep your stats cards, filters, table, pagination exactly as before */}
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
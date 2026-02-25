"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
    MapPin,
    Building2,
    Clock,
    Briefcase,
    CheckCircle,
    XCircle,
    AlertCircle,
    FileText,
    QrCode,
    ExternalLink,
    IndianRupee,
    Loader2,
    RefreshCw,
    ShieldCheck,
    Timer,
    ChevronDown,
    ChevronUp,
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { toast } from "sonner"
import QRCode from "qrcode"

// Types
interface Application {
    id: string
    status: string
    appliedAt: string
    job: {
        id: string
        title: string
        companyName: string
        companyLogo?: string
        location: string
        jobType: string
        workMode: string
        salary: number | null
        deadline?: string
        googleFormUrl?: string
    }
    qrCode?: string
}

interface RoundStatus {
    roundId: string
    roundName: string
    roundOrder: number
    status: string
    qrToken: string | null
    attendance: {
        markedAt: string
        result: string
    } | null
}

export default function ApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [withdrawingId, setWithdrawingId] = useState<string | null>(null)
    const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({})

    // Round-based state
    const [expandedAppId, setExpandedAppId] = useState<string | null>(null)
    const [roundStatuses, setRoundStatuses] = useState<Record<string, RoundStatus[]>>({})
    const [roundQRUrls, setRoundQRUrls] = useState<Record<string, string>>({})
    const [loadingRounds, setLoadingRounds] = useState<Record<string, boolean>>({})
    const [refreshCountdown, setRefreshCountdown] = useState<number>(0)

    const fetchApplications = useCallback(async () => {
        try {
            const res = await fetch(`/api/applications?page=${page}&limit=10`)
            if (res.ok) {
                const data = await res.json()
                setApplications(data.applications)
                setTotalPages(data.pagination.totalPages)
            }
        } catch (error) {
            console.error("Error fetching applications:", error)
        } finally {
            setLoading(false)
        }
    }, [page])

    useEffect(() => {
        fetchApplications()
    }, [fetchApplications])

    // Generate legacy QR codes for backward compatibility
    useEffect(() => {
        const generateQRCodes = async () => {
            const urls: Record<string, string> = {}
            for (const app of applications) {
                if (app.qrCode) {
                    try {
                        const url = await QRCode.toDataURL(app.qrCode, {
                            width: 200,
                            margin: 2,
                        })
                        urls[app.id] = url
                    } catch (err) {
                        console.error("Error generating QR code:", err)
                    }
                }
            }
            setQrCodeUrls(urls)
        }
        if (applications.length > 0) {
            generateQRCodes()
        }
    }, [applications])

    // Fetch round statuses for a job
    const fetchRoundStatuses = async (appId: string, jobId: string) => {
        setLoadingRounds((prev) => ({ ...prev, [appId]: true }))
        try {
            const res = await fetch(`/api/attendance/qr?jobId=${jobId}`)
            if (res.ok) {
                const data = await res.json()
                setRoundStatuses((prev) => ({ ...prev, [appId]: data.rounds }))

                // Generate QR codes for active rounds
                for (const round of data.rounds) {
                    if (round.qrToken && round.status === "ACTIVE") {
                        try {
                            const qrUrl = await QRCode.toDataURL(round.qrToken, {
                                width: 250,
                                margin: 2,
                            })
                            setRoundQRUrls((prev) => ({
                                ...prev,
                                [`${appId}-${round.roundId}`]: qrUrl,
                            }))
                        } catch (err) {
                            console.error("Error generating round QR code:", err)
                        }
                    }
                }

                // Start countdown for auto-refresh (tokens expire)
                setRefreshCountdown(55)
            } else {
                const data = await res.json()
                if (data.kycRequired) {
                    toast.error("Your KYC must be verified to access round attendance")
                }
            }
        } catch (error) {
            console.error("Error fetching round statuses:", error)
            toast.error("Could not load round information")
        } finally {
            setLoadingRounds((prev) => ({ ...prev, [appId]: false }))
        }
    }

    // Auto-refresh countdown
    useEffect(() => {
        if (refreshCountdown <= 0 || !expandedAppId) return

        const timer = setInterval(() => {
            setRefreshCountdown((prev) => {
                if (prev <= 1) {
                    // Auto-refresh the rounds
                    const app = applications.find((a) => a.id === expandedAppId)
                    if (app) {
                        fetchRoundStatuses(expandedAppId, app.job.id)
                    }
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshCountdown, expandedAppId])

    // Toggle expanded view for rounds
    const toggleRoundsPanel = (appId: string, jobId: string) => {
        if (expandedAppId === appId) {
            setExpandedAppId(null)
            setRefreshCountdown(0)
        } else {
            setExpandedAppId(appId)
            fetchRoundStatuses(appId, jobId)
        }
    }

    const handleWithdraw = async (applicationId: string) => {
        setWithdrawingId(applicationId)
        try {
            const res = await fetch(`/api/applications/${applicationId}`, {
                method: "DELETE",
            })

            if (res.ok) {
                toast.success("Application withdrawn successfully")
                fetchApplications()
            } else {
                const data = await res.json()
                toast.error(data.error || "Failed to withdraw application")
            }
        } catch (error) {
            toast.error("Something went wrong")
        } finally {
            setWithdrawingId(null)
        }
    }

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
            PENDING: { variant: "secondary", label: "Pending" },
            REVIEWING: { variant: "outline", label: "Under Review" },
            SHORTLISTED: { variant: "default", label: "Shortlisted" },
            ACCEPTED: { variant: "default", label: "Accepted" },
            REJECTED: { variant: "destructive", label: "Rejected" },
            WITHDRAWN: { variant: "secondary", label: "Withdrawn" },
        }

        const config = statusMap[status] || { variant: "secondary" as const, label: status }
        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    const getRoundStatusIcon = (status: string) => {
        if (status.startsWith("ATTENDED")) {
            return <CheckCircle className="h-4 w-4 text-green-500" />
        }
        switch (status) {
            case "ACTIVE":
                return <QrCode className="h-4 w-4 text-blue-500 animate-pulse" />
            case "NOT_STARTED":
                return <Clock className="h-4 w-4 text-gray-400" />
            case "TEMP_CLOSED":
                return <AlertCircle className="h-4 w-4 text-yellow-500" />
            case "PERM_CLOSED":
                return <XCircle className="h-4 w-4 text-red-500" />
            case "NOT_ELIGIBLE":
                return <AlertCircle className="h-4 w-4 text-orange-500" />
            default:
                return <Clock className="h-4 w-4 text-gray-400" />
        }
    }

    const getRoundStatusLabel = (status: string) => {
        if (status === "ATTENDED_ATTENDED") return "Attended"
        if (status === "ATTENDED_PASSED") return "Passed ✓"
        if (status === "ATTENDED_FAILED") return "Not Cleared"
        switch (status) {
            case "ACTIVE":
                return "Active — Show QR"
            case "NOT_STARTED":
                return "Not Started"
            case "TEMP_CLOSED":
                return "Temporarily Closed"
            case "PERM_CLOSED":
                return "Closed"
            case "NOT_ELIGIBLE":
                return "Not Eligible"
            default:
                return status
        }
    }

    const formatSalary = (salary: number | null) => {
        if (!salary) return "Not disclosed"
        return `${salary} LPA`
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Applications</h1>
                    <p className="text-muted-foreground">Track your job application status and attendance</p>
                </div>
                <Badge variant="outline" className="text-sm">
                    {applications.length} Application{applications.length !== 1 ? "s" : ""}
                </Badge>
            </div>

            {applications.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Start exploring job opportunities and apply to get started
                        </p>
                        <Link href="/jobs">
                            <Button>Browse Jobs</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {applications.map((app) => (
                        <Card key={app.id} className="overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    {/* Job Info */}
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <Link
                                                    href={`/jobs/${app.job.id}`}
                                                    className="text-lg font-semibold hover:underline"
                                                >
                                                    {app.job.title}
                                                </Link>
                                                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                                    <Building2 className="h-4 w-4" />
                                                    <span>{app.job.companyName}</span>
                                                </div>
                                            </div>
                                            {getStatusBadge(app.status)}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="h-3.5 w-3.5" />
                                                {app.job.location}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Briefcase className="h-3.5 w-3.5" />
                                                {app.job.jobType}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <IndianRupee className="h-3.5 w-3.5" />
                                                {formatSalary(app.job.salary)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" />
                                                Applied {format(new Date(app.appliedAt), "MMM d, yyyy")}
                                            </span>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex flex-wrap items-center gap-2 pt-2">
                                            {app.job.googleFormUrl && (
                                                <a
                                                    href={app.job.googleFormUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Button variant="outline" size="sm">
                                                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                                        Google Form
                                                    </Button>
                                                </a>
                                            )}

                                            {/* Round attendance toggle */}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => toggleRoundsPanel(app.id, app.job.id)}
                                                className={expandedAppId === app.id ? "bg-accent" : ""}
                                            >
                                                <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                                                Rounds
                                                {expandedAppId === app.id ? (
                                                    <ChevronUp className="h-3.5 w-3.5 ml-1" />
                                                ) : (
                                                    <ChevronDown className="h-3.5 w-3.5 ml-1" />
                                                )}
                                            </Button>

                                            {app.status === "PENDING" && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            disabled={withdrawingId === app.id}
                                                        >
                                                            {withdrawingId === app.id
                                                                ? "Withdrawing..."
                                                                : "Withdraw"}
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>
                                                                Withdraw Application?
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to withdraw your
                                                                application for{" "}
                                                                <strong>{app.job.title}</strong> at{" "}
                                                                <strong>{app.job.companyName}</strong>?
                                                                This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleWithdraw(app.id)}
                                                            >
                                                                Yes, Withdraw
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </div>
                                    </div>

                                    {/* Legacy QR Code (if present) */}
                                    {qrCodeUrls[app.id] && (
                                        <div className="flex flex-col items-center gap-2 p-3 bg-muted/50 rounded-lg">
                                            <QrCode className="h-4 w-4 text-muted-foreground" />
                                            <img
                                                src={qrCodeUrls[app.id]}
                                                alt="QR Code"
                                                className="w-24 h-24"
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                Legacy QR
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Expandable Rounds Panel */}
                                {expandedAppId === app.id && (
                                    <div className="mt-4 pt-4 border-t">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                                <ShieldCheck className="h-4 w-4" />
                                                Drive Rounds
                                            </h4>
                                            {refreshCountdown > 0 && (
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Timer className="h-3 w-3" />
                                                    Refreshes in {refreshCountdown}s
                                                </span>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => fetchRoundStatuses(app.id, app.job.id)}
                                                disabled={loadingRounds[app.id]}
                                            >
                                                <RefreshCw className={`h-3.5 w-3.5 ${loadingRounds[app.id] ? "animate-spin" : ""}`} />
                                            </Button>
                                        </div>

                                        {loadingRounds[app.id] ? (
                                            <div className="flex items-center justify-center py-6">
                                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                                <span className="ml-2 text-sm text-muted-foreground">
                                                    Loading rounds...
                                                </span>
                                            </div>
                                        ) : roundStatuses[app.id]?.length > 0 ? (
                                            <div className="space-y-3">
                                                {roundStatuses[app.id].map((round) => (
                                                    <div
                                                        key={round.roundId}
                                                        className={`p-3 rounded-lg border ${round.status === "ACTIVE"
                                                                ? "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30"
                                                                : round.status.startsWith("ATTENDED")
                                                                    ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30"
                                                                    : ""
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                {getRoundStatusIcon(round.status)}
                                                                <span className="font-medium text-sm">
                                                                    Round {round.roundOrder}: {round.roundName}
                                                                </span>
                                                            </div>
                                                            <Badge
                                                                variant={
                                                                    round.status === "ACTIVE"
                                                                        ? "default"
                                                                        : round.status.startsWith("ATTENDED_PASSED")
                                                                            ? "default"
                                                                            : round.status.startsWith("ATTENDED_FAILED")
                                                                                ? "destructive"
                                                                                : "secondary"
                                                                }
                                                                className="text-xs"
                                                            >
                                                                {getRoundStatusLabel(round.status)}
                                                            </Badge>
                                                        </div>

                                                        {/* Show QR for active rounds */}
                                                        {round.status === "ACTIVE" &&
                                                            roundQRUrls[`${app.id}-${round.roundId}`] && (
                                                                <div className="mt-3 flex flex-col items-center gap-2">
                                                                    <img
                                                                        src={roundQRUrls[`${app.id}-${round.roundId}`]}
                                                                        alt={`QR for ${round.roundName}`}
                                                                        className="w-48 h-48 rounded-lg shadow-md"
                                                                    />
                                                                    <p className="text-xs text-muted-foreground text-center">
                                                                        Show this QR to the admin to mark attendance
                                                                    </p>
                                                                </div>
                                                            )}

                                                        {/* Show attendance info */}
                                                        {round.attendance && (
                                                            <p className="text-xs text-muted-foreground mt-2">
                                                                Marked: {format(new Date(round.attendance.markedAt), "MMM d, yyyy 'at' h:mm a")}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                No rounds configured for this drive yet
                                            </p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {page} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

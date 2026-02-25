"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
    Play,
    Pause,
    StopCircle,
    RotateCcw,
    Plus,
    Trash2,
    Edit3,
    Briefcase,
    Clock,
    Users,
    CheckCircle,
    XCircle,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    ScanLine,
    Download,
    BarChart3,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Eye,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import Link from "next/link"

interface Job {
    id: string
    title: string
    companyName: string
    status: string
    _count?: {
        applications: number
    }
}

interface Round {
    id: string
    name: string
    order: number
    isRemoved: boolean
    sessions: Array<{
        id: string
        status: string
        startTime: string
        endTime?: string
    }>
    _count: {
        attendances: number
    }
}

interface DriveSession {
    id: string
    status: string
    startTime: string
    endTime?: string
    round: {
        id: string
        name: string
        order: number
    }
    _count: {
        attendances: number
    }
}

export default function DriveManagementPage() {
    const [jobs, setJobs] = useState<Job[]>([])
    const [selectedJobId, setSelectedJobId] = useState<string>("")
    const [rounds, setRounds] = useState<Round[]>([])
    const [sessions, setSessions] = useState<DriveSession[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [newRoundName, setNewRoundName] = useState("")
    const [editingRound, setEditingRound] = useState<string | null>(null)
    const [editName, setEditName] = useState("")

    useEffect(() => {
        fetchJobs()
    }, [])

    const fetchJobs = async () => {
        try {
            const response = await fetch("/api/admin/jobs?limit=100")
            if (response.ok) {
                const data = await response.json()
                setJobs(data.jobs || [])
            }
        } catch (error) {
            console.error("Error fetching jobs:", error)
        }
    }

    const fetchRounds = useCallback(async (jobId: string) => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/admin/jobs/${jobId}/rounds`)
            if (response.ok) {
                const data = await response.json()
                setRounds(data.rounds || [])
            }
        } catch (error) {
            console.error("Error fetching rounds:", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    const fetchSessions = useCallback(async (jobId: string) => {
        try {
            const response = await fetch(`/api/admin/jobs/${jobId}/sessions`)
            if (response.ok) {
                const data = await response.json()
                setSessions(data.sessions || [])
            }
        } catch (error) {
            console.error("Error fetching sessions:", error)
        }
    }, [])

    useEffect(() => {
        if (selectedJobId) {
            fetchRounds(selectedJobId)
            fetchSessions(selectedJobId)
        }
    }, [selectedJobId, fetchRounds, fetchSessions])

    const handleJobSelect = (jobId: string) => {
        setSelectedJobId(jobId)
        setRounds([])
        setSessions([])
    }

    const addRound = async () => {
        if (!newRoundName.trim() || !selectedJobId) return

        try {
            const maxOrder = rounds.filter((r) => !r.isRemoved).length + 1
            const response = await fetch(`/api/admin/jobs/${selectedJobId}/rounds`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newRoundName.trim(), order: maxOrder }),
            })

            if (response.ok) {
                toast.success(`Round "${newRoundName}" added`)
                setNewRoundName("")
                fetchRounds(selectedJobId)
            } else {
                const data = await response.json()
                toast.error(data.error || "Failed to add round")
            }
        } catch (error) {
            toast.error("Failed to add round")
        }
    }

    const updateRound = async (roundId: string, action: string, extras: any = {}) => {
        try {
            const response = await fetch(`/api/admin/jobs/${selectedJobId}/rounds`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roundId, action, ...extras }),
            })

            if (response.ok) {
                toast.success(`Round ${action}d successfully`)
                fetchRounds(selectedJobId)
                setEditingRound(null)
            } else {
                const data = await response.json()
                toast.error(data.error || `Failed to ${action} round`)
            }
        } catch (error) {
            toast.error(`Failed to ${action} round`)
        }
    }

    const moveRound = async (roundId: string, direction: "up" | "down") => {
        const activeRounds = rounds.filter(r => !r.isRemoved).sort((a, b) => a.order - b.order)
        const roundIndex = activeRounds.findIndex(r => r.id === roundId)
        if (roundIndex === -1) return

        const swapIndex = direction === "up" ? roundIndex - 1 : roundIndex + 1
        if (swapIndex < 0 || swapIndex >= activeRounds.length) return

        const currentRound = activeRounds[roundIndex]
        const swapRound = activeRounds[swapIndex]

        // Swap orders
        try {
            await Promise.all([
                fetch(`/api/admin/jobs/${selectedJobId}/rounds`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ roundId: currentRound.id, action: "reorder", order: swapRound.order }),
                }),
                fetch(`/api/admin/jobs/${selectedJobId}/rounds`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ roundId: swapRound.id, action: "reorder", order: currentRound.order }),
                }),
            ])
            toast.success("Round order updated")
            fetchRounds(selectedJobId)
        } catch (error) {
            toast.error("Failed to reorder rounds")
        }
    }

    const startSession = async (roundId: string) => {
        try {
            const response = await fetch(`/api/admin/jobs/${selectedJobId}/sessions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roundId }),
            })

            if (response.ok) {
                toast.success("Session started!")
                fetchRounds(selectedJobId)
                fetchSessions(selectedJobId)
            } else {
                const data = await response.json()
                toast.error(data.error || "Failed to start session")
            }
        } catch (error) {
            toast.error("Failed to start session")
        }
    }

    const updateSession = async (sessionId: string, action: string) => {
        try {
            const response = await fetch(`/api/admin/jobs/${selectedJobId}/sessions`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId, action }),
            })

            if (response.ok) {
                const actionLabel =
                    action === "TEMP_CLOSE"
                        ? "temporarily closed"
                        : action === "PERM_CLOSE"
                            ? "permanently closed"
                            : "reopened"
                toast.success(`Session ${actionLabel}`)
                fetchRounds(selectedJobId)
                fetchSessions(selectedJobId)
            } else {
                const data = await response.json()
                toast.error(data.error || "Failed to update session")
            }
        } catch (error) {
            toast.error("Failed to update session")
        }
    }

    const getSessionStatusBadge = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return (
                    <Badge className="bg-emerald-500 text-white border-0 shadow-sm shadow-emerald-500/25 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 inline-block" />
                        ACTIVE
                    </Badge>
                )
            case "TEMP_CLOSED":
                return (
                    <Badge className="bg-amber-500 text-white border-0 shadow-sm">
                        TEMP CLOSED
                    </Badge>
                )
            case "PERM_CLOSED":
                return (
                    <Badge className="bg-red-500 text-white border-0 shadow-sm">
                        PERM CLOSED
                    </Badge>
                )
            default:
                return <Badge variant="outline">UNKNOWN</Badge>
        }
    }

    const selectedJob = jobs.find((j) => j.id === selectedJobId)

    // Compute stats
    const activeRounds = rounds.filter(r => !r.isRemoved)
    const totalAttended = activeRounds.reduce((sum, r) => sum + r._count.attendances, 0)
    const activeSessions = sessions.filter(s => s.status === "ACTIVE")

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Drive Session Management</h1>
                        <p className="text-sm text-muted-foreground">Manage rounds, sessions, and attendance for placement drives</p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-7xl px-4 py-4 space-y-6">
                {/* Job Selector */}
                <Card className="border-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="w-5 h-5" />
                            Select Job
                        </CardTitle>
                        <CardDescription>
                            Choose a job to manage its drive rounds and sessions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <Select value={selectedJobId} onValueChange={handleJobSelect}>
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Select a job..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {jobs.map((job) => (
                                            <SelectItem key={job.id} value={job.id}>
                                                {job.title} — {job.companyName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {selectedJobId && (
                                <Link href="/admin/attendance/scan">
                                    <Button className="h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-sm shadow-emerald-500/25">
                                        <ScanLine className="w-4 h-4 mr-2" />
                                        Open Scanner
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {selectedJobId && (
                    <>
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50">
                                <CardContent className="p-4 text-center">
                                    <div className="text-3xl font-bold text-blue-600">{activeRounds.length}</div>
                                    <p className="text-sm text-muted-foreground mt-1">Rounds</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200/50">
                                <CardContent className="p-4 text-center">
                                    <div className="text-3xl font-bold text-emerald-600">{activeSessions.length}</div>
                                    <p className="text-sm text-muted-foreground mt-1">Active Sessions</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/30 border-purple-200/50">
                                <CardContent className="p-4 text-center">
                                    <div className="text-3xl font-bold text-purple-600">{totalAttended}</div>
                                    <p className="text-sm text-muted-foreground mt-1">Total Attended</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200/50">
                                <CardContent className="p-4 text-center">
                                    <div className="text-3xl font-bold text-orange-600">{sessions.length}</div>
                                    <p className="text-sm text-muted-foreground mt-1">Total Sessions</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Round Management */}
                        <Card className="border-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ArrowUpDown className="w-5 h-5" />
                                    Rounds
                                </CardTitle>
                                <CardDescription>
                                    Configure drive rounds for {selectedJob?.companyName} — {selectedJob?.title}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="New round name (e.g., Aptitude, Technical, GD, HR)"
                                        value={newRoundName}
                                        onChange={(e) => setNewRoundName(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && addRound()}
                                        className="h-11"
                                    />
                                    <Button onClick={addRound} disabled={!newRoundName.trim()} className="h-11 px-6">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Round
                                    </Button>
                                </div>

                                {isLoading ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
                                        ))}
                                    </div>
                                ) : rounds.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground space-y-3">
                                        <ArrowUpDown className="w-12 h-12 mx-auto text-muted-foreground/50" />
                                        <div>
                                            <p className="font-medium">No rounds configured yet</p>
                                            <p className="text-sm mt-1">Add your first round above (e.g., Aptitude, Technical, GD, HR)</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {rounds
                                            .sort((a, b) => a.order - b.order)
                                            .map((round, idx) => {
                                                const latestSession = round.sessions[0]
                                                const hasActiveSession = latestSession?.status === "ACTIVE"
                                                const hasTempClosedSession = latestSession?.status === "TEMP_CLOSED"
                                                const hasPermClosedSession = latestSession?.status === "PERM_CLOSED"
                                                const noSession = !latestSession

                                                const sortedActiveRounds = rounds.filter(r => !r.isRemoved).sort((a, b) => a.order - b.order)
                                                const activeIdx = sortedActiveRounds.findIndex(r => r.id === round.id)
                                                const isFirst = activeIdx === 0
                                                const isLast = activeIdx === sortedActiveRounds.length - 1

                                                return (
                                                    <div
                                                        key={round.id}
                                                        className={`p-4 rounded-xl border-2 transition-all ${round.isRemoved
                                                            ? "opacity-50 bg-muted border-dashed"
                                                            : hasActiveSession
                                                                ? "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-900/10 shadow-sm shadow-emerald-500/10"
                                                                : hasTempClosedSession
                                                                    ? "border-amber-300 bg-amber-50/50 dark:bg-amber-900/10"
                                                                    : hasPermClosedSession
                                                                        ? "border-red-200 bg-red-50/30 dark:bg-red-900/10"
                                                                        : "border-border/80"
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                {/* Reorder buttons (only when no active/temp session) */}
                                                                {!round.isRemoved && !hasActiveSession && !hasTempClosedSession && (
                                                                    <div className="flex flex-col gap-0.5">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="h-5 w-5 p-0"
                                                                            disabled={isFirst}
                                                                            onClick={() => moveRound(round.id, "up")}
                                                                        >
                                                                            <ArrowUp className="w-3 h-3" />
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="h-5 w-5 p-0"
                                                                            disabled={isLast}
                                                                            onClick={() => moveRound(round.id, "down")}
                                                                        >
                                                                            <ArrowDown className="w-3 h-3" />
                                                                        </Button>
                                                                    </div>
                                                                )}

                                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-bold shrink-0 border border-primary/10">
                                                                    {round.order}
                                                                </div>
                                                                {editingRound === round.id ? (
                                                                    <div className="flex gap-2 flex-1">
                                                                        <Input
                                                                            value={editName}
                                                                            onChange={(e) => setEditName(e.target.value)}
                                                                            className="w-48 h-9"
                                                                            autoFocus
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === "Enter") updateRound(round.id, "rename", { name: editName })
                                                                                if (e.key === "Escape") setEditingRound(null)
                                                                            }}
                                                                        />
                                                                        <Button
                                                                            size="sm"
                                                                            className="h-9"
                                                                            onClick={() => updateRound(round.id, "rename", { name: editName })}
                                                                        >
                                                                            Save
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="h-9"
                                                                            onClick={() => setEditingRound(null)}
                                                                        >
                                                                            Cancel
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="min-w-0">
                                                                        <h4 className="font-semibold flex items-center gap-2 text-base">
                                                                            {round.name}
                                                                            {round.isRemoved && (
                                                                                <Badge variant="outline" className="text-xs">Removed</Badge>
                                                                            )}
                                                                        </h4>
                                                                        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                                                                            <span className="flex items-center gap-1">
                                                                                <Users className="w-3 h-3" />
                                                                                {round._count.attendances} attended
                                                                            </span>
                                                                            {latestSession && (
                                                                                <span>
                                                                                    {getSessionStatusBadge(latestSession.status)}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                                                                {/* Session Controls */}
                                                                {!round.isRemoved && (
                                                                    <>
                                                                        {noSession && (
                                                                            <Button
                                                                                size="sm"
                                                                                className="bg-emerald-600 hover:bg-emerald-700"
                                                                                onClick={() => startSession(round.id)}
                                                                            >
                                                                                <Play className="w-4 h-4 mr-1" />
                                                                                Start Session
                                                                            </Button>
                                                                        )}

                                                                        {hasActiveSession && (
                                                                            <>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    className="border-amber-400 text-amber-600 hover:bg-amber-50"
                                                                                    onClick={() => updateSession(latestSession.id, "TEMP_CLOSE")}
                                                                                >
                                                                                    <Pause className="w-4 h-4 mr-1" />
                                                                                    Temp Close
                                                                                </Button>

                                                                                <AlertDialog>
                                                                                    <AlertDialogTrigger asChild>
                                                                                        <Button
                                                                                            size="sm"
                                                                                            variant="destructive"
                                                                                        >
                                                                                            <StopCircle className="w-4 h-4 mr-1" />
                                                                                            Perm Close
                                                                                        </Button>
                                                                                    </AlertDialogTrigger>
                                                                                    <AlertDialogContent>
                                                                                        <AlertDialogHeader>
                                                                                            <AlertDialogTitle>Permanently Close Session?</AlertDialogTitle>
                                                                                            <AlertDialogDescription>
                                                                                                This action cannot be undone. The session for &quot;{round.name}&quot; will be permanently closed and no more attendance can be marked.
                                                                                            </AlertDialogDescription>
                                                                                        </AlertDialogHeader>
                                                                                        <AlertDialogFooter>
                                                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                                            <AlertDialogAction
                                                                                                onClick={() => updateSession(latestSession.id, "PERM_CLOSE")}
                                                                                            >
                                                                                                Close Permanently
                                                                                            </AlertDialogAction>
                                                                                        </AlertDialogFooter>
                                                                                    </AlertDialogContent>
                                                                                </AlertDialog>
                                                                            </>
                                                                        )}

                                                                        {hasTempClosedSession && (
                                                                            <>
                                                                                <Button
                                                                                    size="sm"
                                                                                    className="bg-emerald-600 hover:bg-emerald-700"
                                                                                    onClick={() => updateSession(latestSession.id, "REOPEN")}
                                                                                >
                                                                                    <RotateCcw className="w-4 h-4 mr-1" />
                                                                                    Reopen
                                                                                </Button>

                                                                                <AlertDialog>
                                                                                    <AlertDialogTrigger asChild>
                                                                                        <Button
                                                                                            size="sm"
                                                                                            variant="destructive"
                                                                                        >
                                                                                            <StopCircle className="w-4 h-4 mr-1" />
                                                                                            Perm Close
                                                                                        </Button>
                                                                                    </AlertDialogTrigger>
                                                                                    <AlertDialogContent>
                                                                                        <AlertDialogHeader>
                                                                                            <AlertDialogTitle>Permanently Close Session?</AlertDialogTitle>
                                                                                            <AlertDialogDescription>
                                                                                                This cannot be reversed. No further attendance can be marked for &quot;{round.name}&quot;.
                                                                                            </AlertDialogDescription>
                                                                                        </AlertDialogHeader>
                                                                                        <AlertDialogFooter>
                                                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                                            <AlertDialogAction
                                                                                                onClick={() => updateSession(latestSession.id, "PERM_CLOSE")}
                                                                                            >
                                                                                                Close Permanently
                                                                                            </AlertDialogAction>
                                                                                        </AlertDialogFooter>
                                                                                    </AlertDialogContent>
                                                                                </AlertDialog>
                                                                            </>
                                                                        )}

                                                                        {/* Round management buttons */}
                                                                        {!hasActiveSession && !hasTempClosedSession && (
                                                                            <>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="ghost"
                                                                                    onClick={() => {
                                                                                        setEditingRound(round.id)
                                                                                        setEditName(round.name)
                                                                                    }}
                                                                                >
                                                                                    <Edit3 className="w-4 h-4" />
                                                                                </Button>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="ghost"
                                                                                    className="text-red-500 hover:text-red-700"
                                                                                    onClick={() => updateRound(round.id, "remove")}
                                                                                >
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                </Button>
                                                                            </>
                                                                        )}
                                                                    </>
                                                                )}

                                                                {round.isRemoved && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => updateRound(round.id, "restore")}
                                                                    >
                                                                        <RotateCcw className="w-4 h-4 mr-1" />
                                                                        Restore
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Session History */}
                        <Card className="border-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    Session History
                                </CardTitle>
                                <CardDescription>
                                    All drive sessions for this job
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {sessions.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground space-y-3">
                                        <Clock className="w-12 h-12 mx-auto text-muted-foreground/50" />
                                        <div>
                                            <p className="font-medium">No sessions started yet</p>
                                            <p className="text-sm mt-1">Start a round session above to begin</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {sessions.map((s) => (
                                            <div
                                                key={s.id}
                                                className="flex items-center justify-between p-4 rounded-xl border hover:shadow-sm transition-shadow"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold">
                                                            Round {s.round.order}: {s.round.name}
                                                        </span>
                                                        {getSessionStatusBadge(s.status)}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1 space-x-3">
                                                        <span>Started: {format(new Date(s.startTime), "MMM dd, yyyy HH:mm")}</span>
                                                        {s.endTime && (
                                                            <span>Ended: {format(new Date(s.endTime), "MMM dd, yyyy HH:mm")}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <span className="text-lg font-bold">{s._count.attendances}</span>
                                                        <p className="text-xs text-muted-foreground">attended</p>
                                                    </div>
                                                    <Link href={`/admin/attendance/round-details?jobId=${selectedJobId}&roundId=${s.round.id}`}>
                                                        <Button size="sm" variant="outline">
                                                            <Eye className="w-3 h-3 mr-1" />
                                                            Details
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </div>
    )
}

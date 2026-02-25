"use client"

import { useState, useEffect } from "react"
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
import { QRScanner } from "@/components/admin/qr-scanner"
import {
    CheckCircle,
    XCircle,
    User,
    Building2,
    Clock,
    AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

interface ScanResult {
    success: boolean
    message: string
    student?: {
        name: string
        email: string
        usn?: string
        branch?: string
    }
    job?: {
        title: string
        company: string
    }
    scannedAt?: string
}

interface Job {
    id: string
    title: string
    company: string
}

export default function AttendanceScanPage() {
    const [selectedJob, setSelectedJob] = useState<string>("ALL")
    const [jobs, setJobs] = useState<Job[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [lastScan, setLastScan] = useState<ScanResult | null>(null)
    const [scanHistory, setScanHistory] = useState<ScanResult[]>([])
    const [location, setLocation] = useState("")

    useEffect(() => {
        // Fetch active jobs
        const fetchJobs = async () => {
            try {
                const response = await fetch('/api/admin/jobs?status=ACTIVE&limit=100')
                if (response.ok) {
                    const data = await response.json()
                    setJobs(data.jobs)
                }
            } catch (error) {
                console.error("Error fetching jobs:", error)
            }
        }
        fetchJobs()
    }, [])

    const handleScan = async (qrData: string) => {
        setIsProcessing(true)
        try {
            const response = await fetch('/api/attendance/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    qrData,
                    location,
                    jobId: selectedJob !== "ALL" ? selectedJob : undefined
                }),
            })

            const data = await response.json()

            if (response.ok) {
                setLastScan(data)
                setScanHistory(prev => [data, ...prev.slice(0, 9)]) // Keep last 10
                toast.success(data.message)
            } else if (response.status === 409) {
                // Already scanned
                setLastScan(data)
                toast.warning(data.message)
            } else {
                toast.error(data.error || "Failed to record attendance")
                setLastScan({ success: false, message: data.error || "Error" })
            }
        } catch (error) {
            console.error("Error scanning:", error)
            toast.error("An unexpected error occurred")
            setLastScan({ success: false, message: "Error occurred" })
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Attendance Scanner</h1>
                <p className="text-muted-foreground mt-2">
                    Scan student QR codes to mark attendance at placement events
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Scanner Section */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>QR Code Scanner</CardTitle>
                            <CardDescription>
                                Point the camera at a student&apos;s QR code to mark attendance
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Filter by Job (Optional)</label>
                                <Select value={selectedJob} onValueChange={setSelectedJob}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Jobs" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Jobs</SelectItem>
                                        {jobs.map(job => (
                                            <SelectItem key={job.id} value={job.id}>
                                                {job.title} - {job.company}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Location (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="e.g., Main Hall, Room 101"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                />
                            </div>

                            <QRScanner onScan={handleScan} isProcessing={isProcessing} />
                        </CardContent>
                    </Card>

                    {/* Last Scan Result */}
                    {lastScan && (
                        <Card className={lastScan.success ? "border-green-500" : lastScan.message === "Attendance already recorded" ? "border-yellow-500" : "border-red-500"}>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2">
                                    {lastScan.success ? (
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    ) : lastScan.message === "Attendance already recorded" ? (
                                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-500" />
                                    )}
                                    {lastScan.message}
                                </CardTitle>
                            </CardHeader>
                            {lastScan.student && (
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-medium">{lastScan.student.name}</span>
                                        </div>
                                        {lastScan.student.usn && (
                                            <p className="text-sm text-muted-foreground pl-6">
                                                USN: {lastScan.student.usn}
                                            </p>
                                        )}
                                        {lastScan.student.branch && (
                                            <p className="text-sm text-muted-foreground pl-6">
                                                Branch: {lastScan.student.branch}
                                            </p>
                                        )}
                                        {lastScan.job && (
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-muted-foreground" />
                                                <span>{lastScan.job.title} at {lastScan.job.company}</span>
                                            </div>
                                        )}
                                        {lastScan.scannedAt && (
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    {format(new Date(lastScan.scannedAt), 'MMM dd, yyyy HH:mm:ss')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    )}
                </div>

                {/* Scan History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Scans</CardTitle>
                        <CardDescription>
                            Last 10 attendance records
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {scanHistory.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No scans yet. Start scanning to see history.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {scanHistory.map((scan, index) => (
                                    <div
                                        key={index}
                                        className={`p-3 rounded-lg border ${scan.success
                                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200'
                                                : scan.message === "Attendance already recorded"
                                                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200'
                                                    : 'bg-red-50 dark:bg-red-900/20 border-red-200'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {scan.success ? (
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                ) : scan.message === "Attendance already recorded" ? (
                                                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-red-600" />
                                                )}
                                                <span className="font-medium">{scan.student?.name || "Unknown"}</span>
                                            </div>
                                            {scan.scannedAt && (
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(scan.scannedAt), 'HH:mm:ss')}
                                                </span>
                                            )}
                                        </div>
                                        {scan.student?.usn && (
                                            <p className="text-xs text-muted-foreground mt-1 pl-6">
                                                {scan.student.usn}
                                            </p>
                                        )}
                                        {scan.job && (
                                            <p className="text-xs text-muted-foreground mt-1 pl-6">
                                                {scan.job.company}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { format } from "date-fns"
import {
    Download,
    FileText,
    Mail,
    MoreHorizontal,
    Phone,
    Settings2,
    Trash2,
    UserX,
    Users,
} from "lucide-react"

interface Applicant {
    id: string
    userId: string
    name: string
    email: string
    phone: string
    usn: string
    branch: string
    batch: string
    cgpa: number | null
    appliedAt: Date
    resumeUrl: string
    responses: {
        field: { label: string }
        value: string | null
    }[]
}

interface ApplicantsTableProps {
    jobId: string
    jobTitle: string
    applicants: Applicant[]
}

const EXPORTABLE_FIELDS = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "usn", label: "USN" },
    { key: "branch", label: "Branch" },
    { key: "batch", label: "Batch" },
    { key: "cgpa", label: "CGPA" },
    { key: "appliedAt", label: "Applied Date" },
]

export function ApplicantsTable({ jobId, jobTitle, applicants }: ApplicantsTableProps) {
    const router = useRouter()
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [selectedFields, setSelectedFields] = useState<Set<string>>(
        new Set(["name", "email", "usn", "branch", "cgpa"])
    )
    const [isRemoving, setIsRemoving] = useState(false)
    const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
    const [removalReason, setRemovalReason] = useState("")
    const [applicantToRemove, setApplicantToRemove] = useState<string | null>(null)

    const allSelected = applicants.length > 0 && selectedIds.size === applicants.length
    const someSelected = selectedIds.size > 0

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(applicants.map(a => a.id)))
        }
    }

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
    }

    const toggleField = (field: string) => {
        const newFields = new Set(selectedFields)
        if (newFields.has(field)) {
            newFields.delete(field)
        } else {
            newFields.add(field)
        }
        setSelectedFields(newFields)
    }

    const handleExport = async () => {
        if (selectedIds.size === 0) {
            toast.error("Please select at least one applicant to export")
            return
        }

        if (selectedFields.size === 0) {
            toast.error("Please select at least one field to export")
            return
        }

        try {
            const params = new URLSearchParams()
            params.set("fields", Array.from(selectedFields).join(","))
            params.set("applicationIds", Array.from(selectedIds).join(","))

            const response = await fetch(`/api/admin/jobs/${jobId}/applicants/export?${params.toString()}`)

            if (!response.ok) {
                throw new Error("Export failed")
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `${jobTitle.replace(/\s+/g, "_")}_applicants.xlsx`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)

            toast.success(`Exported ${selectedIds.size} applicants`)
        } catch (error) {
            console.error("Export error:", error)
            toast.error("Failed to export applicants")
        }
    }

    const handleRemove = async () => {
        if (!applicantToRemove) return

        setIsRemoving(true)
        try {
            const response = await fetch(`/api/admin/jobs/${jobId}/applicants`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    applicationIds: [applicantToRemove],
                    reason: removalReason,
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to remove applicant")
            }

            toast.success("Applicant removed successfully")
            router.refresh()
        } catch (error) {
            console.error("Remove error:", error)
            toast.error("Failed to remove applicant")
        } finally {
            setIsRemoving(false)
            setRemoveDialogOpen(false)
            setApplicantToRemove(null)
            setRemovalReason("")
        }
    }

    const handleBulkRemove = async () => {
        if (selectedIds.size === 0) return

        setIsRemoving(true)
        try {
            const response = await fetch(`/api/admin/jobs/${jobId}/applicants`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    applicationIds: Array.from(selectedIds),
                    reason: removalReason,
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to remove applicants")
            }

            toast.success(`Removed ${selectedIds.size} applicants`)
            setSelectedIds(new Set())
            router.refresh()
        } catch (error) {
            console.error("Bulk remove error:", error)
            toast.error("Failed to remove applicants")
        } finally {
            setIsRemoving(false)
            setRemoveDialogOpen(false)
            setRemovalReason("")
        }
    }

    const openRemoveDialog = (applicantId?: string) => {
        if (applicantId) {
            setApplicantToRemove(applicantId)
        } else {
            setApplicantToRemove(null)
        }
        setRemoveDialogOpen(true)
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Applicants ({applicants.length})
                            </CardTitle>
                            <CardDescription>
                                Select applicants and fields to export
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            {/* Field Selection Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Settings2 className="h-4 w-4 mr-2" />
                                        Fields ({selectedFields.size})
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel>Export Fields</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {EXPORTABLE_FIELDS.map(field => (
                                        <DropdownMenuCheckboxItem
                                            key={field.key}
                                            checked={selectedFields.has(field.key)}
                                            onCheckedChange={() => toggleField(field.key)}
                                        >
                                            {field.label}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Export Button */}
                            <Button
                                onClick={handleExport}
                                disabled={selectedIds.size === 0}
                                size="sm"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export ({selectedIds.size})
                            </Button>

                            {/* Bulk Remove Button */}
                            {someSelected && (
                                <Button
                                    variant="destructive"
                                    onClick={() => openRemoveDialog()}
                                    disabled={isRemoving}
                                    size="sm"
                                >
                                    <UserX className="h-4 w-4 mr-2" />
                                    Remove ({selectedIds.size})
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {applicants.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">No applicants yet for this job.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={allSelected}
                                                onCheckedChange={toggleSelectAll}
                                                aria-label="Select all"
                                            />
                                        </TableHead>
                                        <TableHead>Applicant</TableHead>
                                        <TableHead>USN</TableHead>
                                        <TableHead>Branch</TableHead>
                                        <TableHead>CGPA</TableHead>
                                        <TableHead>Custom Responses</TableHead>
                                        <TableHead>Applied</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {applicants.map(applicant => (
                                        <TableRow key={applicant.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedIds.has(applicant.id)}
                                                    onCheckedChange={() => toggleSelect(applicant.id)}
                                                    aria-label={`Select ${applicant.name}`}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback>
                                                            {applicant.name.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{applicant.name}</p>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            {applicant.email && (
                                                                <span className="flex items-center gap-1">
                                                                    <Mail className="h-3 w-3" />
                                                                    {applicant.email}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono text-sm">{applicant.usn || "-"}</span>
                                            </TableCell>
                                            <TableCell>
                                                {applicant.branch ? (
                                                    <Badge variant="outline">{applicant.branch}</Badge>
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {applicant.cgpa ? (
                                                    <span className="font-medium">{applicant.cgpa.toFixed(2)}</span>
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs space-y-1 max-w-[200px]">
                                                    {applicant.responses.length > 0 ? applicant.responses.map((resp, i) => (
                                                        <div key={i} className="flex flex-col border-b last:border-0 pb-1">
                                                            <span className="text-muted-foreground font-semibold uppercase text-[10px]">{resp.field.label}</span>
                                                            <span className="truncate" title={resp.value || "No response"}>{resp.value || "No response"}</span>
                                                        </div>
                                                    )) : <span className="text-muted-foreground italic">No custom fields</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">
                                                    {format(new Date(applicant.appliedAt), "MMM dd, yyyy")}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {applicant.resumeUrl && (
                                                            <DropdownMenuItem asChild>
                                                                <a
                                                                    href={applicant.resumeUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    <FileText className="h-4 w-4 mr-2" />
                                                                    View Resume
                                                                </a>
                                                            </DropdownMenuItem>
                                                        )}
                                                        {applicant.phone && (
                                                            <DropdownMenuItem asChild>
                                                                <a href={`tel:${applicant.phone}`}>
                                                                    <Phone className="h-4 w-4 mr-2" />
                                                                    Call
                                                                </a>
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem asChild>
                                                            <a href={`mailto:${applicant.email}`}>
                                                                <Mail className="h-4 w-4 mr-2" />
                                                                Email
                                                            </a>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => openRemoveDialog(applicant.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Remove
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Remove Confirmation Dialog */}
            <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Applicant(s)?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {applicantToRemove
                                ? "This applicant will be removed from this job. They will not be notified."
                                : `${selectedIds.size} applicant(s) will be removed from this job. They will not be notified.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="my-4">
                        <Label htmlFor="reason">Reason (optional)</Label>
                        <Textarea
                            id="reason"
                            placeholder="Enter reason for removal..."
                            value={removalReason}
                            onChange={e => setRemovalReason(e.target.value)}
                            className="mt-2"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={applicantToRemove ? handleRemove : handleBulkRemove}
                            disabled={isRemoving}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isRemoving ? "Removing..." : "Remove"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

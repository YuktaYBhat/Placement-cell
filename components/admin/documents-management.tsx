"use client"

import { useState, useMemo } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
    ExternalLink, 
    Download, 
    Settings2, 
    CheckSquare,
    Square
} from "lucide-react"
import { getDocumentUrl } from "@/lib/document-utils"
import * as XLSX from "xlsx"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

interface User {
    id: string
    profile: {
        firstName: string | null
        lastName: string | null
        usn: string | null
        branch: string | null
        batch: string | null
        resumeUpload: string | null
        resume: string | null
        collegeIdCard: string | null
    } | null
    document: {
        usn: string | null
        cgpa: number | null
        kycStatus: string
        tenthMarksCardLink: string | null
        twelfthMarksCardLink: string | null
        sem1Link: string | null
        sem2Link: string | null
        sem3Link: string | null
        sem4Link: string | null
        sem5Link: string | null
        sem6Link: string | null
        sem7Link: string | null
        sem8Link: string | null
    } | null
    applications: {
        job: {
            companyName: string
            title: string
        }
        responses: {
            value: string | null
            field: {
                label: string
            }
        }[]
    }[]
}

interface DocumentsManagementProps {
    users: User[]
    publicDomain?: string
}

export function DocumentsManagement({ users, publicDomain }: DocumentsManagementProps) {
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
    
    // Standard Document Columns
    const standardColumns = [
        { id: "resume", label: "Resume", key: "resume", source: "profile" },
        { id: "collegeId", label: "College ID", key: "collegeIdCard", source: "profile" },
        { id: "tenth", label: "10th Marks Card", key: "tenthMarksCardLink", source: "document" },
        { id: "twelfth", label: "12th Marks Card", key: "twelfthMarksCardLink", source: "document" },
        { id: "sem1", label: "Sem 1", key: "sem1Link", source: "document" },
        { id: "sem2", label: "Sem 2", key: "sem2Link", source: "document" },
        { id: "sem3", label: "Sem 3", key: "sem3Link", source: "document" },
        { id: "sem4", label: "Sem 4", key: "sem4Link", source: "document" },
        { id: "sem5", label: "Sem 5", key: "sem5Link", source: "document" },
        { id: "sem6", label: "Sem 6", key: "sem6Link", source: "document" },
        { id: "sem7", label: "Sem 7", key: "sem7Link", source: "document" },
        { id: "sem8", label: "Sem 8", key: "sem8Link", source: "document" },
    ]

    // Extract dynamic custom field columns
    const customFieldColumns = useMemo(() => {
        const columns: { id: string, label: string, company: string, fieldLabel: string }[] = []
        const seen = new Set<string>()

        users.forEach(user => {
            user.applications.forEach(app => {
                app.responses.forEach(resp => {
                    const id = `custom-${app.job.companyName}-${resp.field.label}`
                    if (!seen.has(id)) {
                        seen.add(id)
                        columns.push({
                            id,
                            label: `${app.job.companyName} - ${resp.field.label}`,
                            company: app.job.companyName,
                            fieldLabel: resp.field.label
                        })
                    }
                })
            })
        })

        return columns
    }, [users])

    // State for visible columns (for export and view)
    const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
        new Set([
            "usn", "name", "cgpa", "status",
            ...standardColumns.map(c => c.id),
            ...customFieldColumns.map(c => c.id)
        ])
    )

    const toggleColumn = (id: string) => {
        const newVisible = new Set(visibleColumns)
        if (newVisible.has(id)) {
            newVisible.delete(id)
        } else {
            newVisible.add(id)
        }
        setVisibleColumns(newVisible)
    }

    const toggleSelectAllUsers = () => {
        if (selectedUserIds.size === users.length) {
            setSelectedUserIds(new Set())
        } else {
            setSelectedUserIds(new Set(users.map(u => u.id)))
        }
    }

    const toggleUserSelection = (userId: string) => {
        const newSelected = new Set(selectedUserIds)
        if (newSelected.has(userId)) {
            newSelected.delete(userId)
        } else {
            newSelected.add(userId)
        }
        setSelectedUserIds(newSelected)
    }

    const getColumnValue = (user: User, col: typeof standardColumns[0]) => {
        if (col.source === "profile") {
            if (col.key === "resume") {
                return user.profile?.resumeUpload || user.profile?.resume
            }
            return (user.profile as any)?.[col.key]
        }
        return (user.document as any)?.[col.key]
    }

    // ✅ FIXED: Clean client-side export with Clickable Hyperlinks
    const handleExport = () => {
        const selectedUsers = selectedUserIds.size > 0 
            ? users.filter(u => selectedUserIds.has(u.id))
            : users

        if (selectedUsers.length === 0) {
            toast.error("No students found to export")
            return
        }

        try {
            const rows = selectedUsers.map(user => {
                const row: Record<string, any> = {}

                if (visibleColumns.has("usn"))
                    row["USN"] = user.document?.usn || user.profile?.usn || "-"

                if (visibleColumns.has("name"))
                    row["Student Name"] = `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim()

                if (visibleColumns.has("cgpa"))
                    row["CGPA"] = user.document?.cgpa?.toFixed(2) || "-"

                if (visibleColumns.has("status"))
                    row["KYC Status"] = user.document?.kycStatus || "PENDING"

                standardColumns.forEach(col => {
                    if (!visibleColumns.has(col.id)) return
                    const rawUrl = getColumnValue(user, col)
                    row[col.label] = rawUrl ? getDocumentUrl(rawUrl, publicDomain) : "-"
                })

                customFieldColumns.forEach(col => {
                    if (!visibleColumns.has(col.id)) return
                    let value: string | null = null
                    user.applications.forEach(app => {
                        if (app.job.companyName === col.company) {
                            const resp = app.responses.find(r => r.field.label === col.fieldLabel)
                            if (resp?.value) value = resp.value
                        }
                    })
                    row[col.label] = value ? getDocumentUrl(value, publicDomain) : "-"
                })

                return row
            })

            const worksheet = XLSX.utils.json_to_sheet(rows)

            // ✅ ADD HYPERLINKS: Scan cells and convert URLs to clickable links
            const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1")
            for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cell_address = { c: C, r: R }
                    const cell_ref = XLSX.utils.encode_cell(cell_address)
                    const cell = worksheet[cell_ref]
                    
                    if (cell && cell.t === "s" && typeof cell.v === "string" && cell.v.startsWith("http")) {
                        cell.l = { Target: cell.v, Tooltip: "Click to view document" }
                        cell.v = "View Document" // Make it cleaner in Excel
                    }
                }
            }

            // Auto-size columns for better readability
            const colWidths = Object.keys(rows[0] || {}).map(key => ({
                wch: Math.max(key.length, 25)
            }))
            worksheet["!cols"] = colWidths

            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, "Student Documents")

            XLSX.writeFile(workbook, `Student_Documents_${new Date().toISOString().split("T")[0]}.xlsx`)

            toast.success(`Exported documents for ${selectedUsers.length} student(s)`)
        } catch (error) {
            console.error("Export error:", error)
            toast.error("Failed to export documents")
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "VERIFIED":
                return <Badge className="bg-green-500 hover:bg-green-600">Verified</Badge>
            case "REJECTED":
                return <Badge variant="destructive">Rejected</Badge>
            default:
                return <Badge variant="secondary">Pending</Badge>
        }
    }

    const renderLink = (url: string | null | undefined, label: string) => {
        if (!url) return <span className="text-gray-400 text-xs">-</span>

        const fileUrl = getDocumentUrl(url, publicDomain)

        return (
            <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold whitespace-nowrap transition-colors"
                title={label}
            >
                View <ExternalLink className="w-3.5 h-3.5" />
            </a>
        )
    }

    // Group custom fields by company for the header
    const groupedCustomFields = useMemo(() => {
        const groups: Record<string, typeof customFieldColumns> = {}
        customFieldColumns.forEach(field => {
            if (!groups[field.company]) groups[field.company] = []
            groups[field.company].push(field)
        })
        return groups
    }, [customFieldColumns])

    return (
        <Card className="shadow-md">
            <CardHeader className="pb-3 border-b">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl">Uploaded Documents ({users.length})</CardTitle>
                        <CardDescription>Consolidated view of student documents and job application attachments.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9">
                                    <Settings2 className="w-4 h-4 mr-2" />
                                    Select Documents
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-72 max-h-[500px] overflow-y-auto">
                                <DropdownMenuLabel className="flex items-center justify-between">
                                    Information Columns
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem checked={visibleColumns.has("usn")} onCheckedChange={() => toggleColumn("usn")}>USN</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={visibleColumns.has("name")} onCheckedChange={() => toggleColumn("name")}>Name</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={visibleColumns.has("cgpa")} onCheckedChange={() => toggleColumn("cgpa")}>CGPA</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={visibleColumns.has("status")} onCheckedChange={() => toggleColumn("status")}>KYC Status</DropdownMenuCheckboxItem>
                                
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="flex items-center justify-between">
                                    Academic Documents
                                    <div className="flex gap-2">
                                        <button 
                                            className="text-[10px] text-blue-600 hover:underline font-normal"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                const next = new Set(visibleColumns)
                                                standardColumns.forEach(c => next.add(c.id))
                                                setVisibleColumns(next)
                                            }}
                                        >
                                            Select All
                                        </button>
                                        <button 
                                            className="text-[10px] text-red-600 hover:underline font-normal"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                const next = new Set(visibleColumns)
                                                standardColumns.forEach(c => next.delete(c.id))
                                                setVisibleColumns(next)
                                            }}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </DropdownMenuLabel>
                                {standardColumns.map(col => (
                                    <DropdownMenuCheckboxItem 
                                        key={col.id} 
                                        checked={visibleColumns.has(col.id)} 
                                        onCheckedChange={() => toggleColumn(col.id)}
                                    >
                                        {col.label}
                                    </DropdownMenuCheckboxItem>
                                ))}
                                
                                {customFieldColumns.length > 0 && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel className="flex items-center justify-between">
                                            Requirement Documents
                                            <div className="flex gap-2">
                                                <button 
                                                    className="text-[10px] text-blue-600 hover:underline font-normal"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        const next = new Set(visibleColumns)
                                                        customFieldColumns.forEach(c => next.add(c.id))
                                                        setVisibleColumns(next)
                                                    }}
                                                >
                                                    Select All
                                                </button>
                                                <button 
                                                    className="text-[10px] text-red-600 hover:underline font-normal"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        const next = new Set(visibleColumns)
                                                        customFieldColumns.forEach(c => next.delete(c.id))
                                                        setVisibleColumns(next)
                                                    }}
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        </DropdownMenuLabel>
                                        {customFieldColumns.map(col => (
                                            <DropdownMenuCheckboxItem 
                                                key={col.id} 
                                                checked={visibleColumns.has(col.id)} 
                                                onCheckedChange={() => toggleColumn(col.id)}
                                            >
                                                {col.label}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button 
                            variant="default" 
                            size="sm" 
                            className="h-9 bg-green-600 hover:bg-green-700"
                            onClick={handleExport}
                            disabled={users.length === 0}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export Data {selectedUserIds.size > 0 ? `(${selectedUserIds.size})` : `(All)`}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="relative w-full overflow-x-auto">
                    <Table>
                        <TableHeader>
                            {/* Group Header Row */}
                            <TableRow className="bg-muted/10 hover:bg-muted/10 border-b-2">
                                <TableHead className="w-12 border-r"></TableHead>
                                {(visibleColumns.has("usn") || visibleColumns.has("name") || visibleColumns.has("cgpa") || visibleColumns.has("status")) && (
                                    <TableHead colSpan={
                                        (visibleColumns.has("usn") ? 1 : 0) + 
                                        (visibleColumns.has("name") ? 1 : 0) + 
                                        (visibleColumns.has("cgpa") ? 1 : 0) + 
                                        (visibleColumns.has("status") ? 1 : 0)
                                    } className="text-center font-bold border-r bg-muted/5 uppercase text-[10px] tracking-wider">
                                        Basic Information
                                    </TableHead>
                                )}
                                
                                {standardColumns.some(c => visibleColumns.has(c.id)) && (
                                    <TableHead colSpan={standardColumns.filter(c => visibleColumns.has(c.id)).length} className="text-center font-bold border-r bg-muted/5 uppercase text-[10px] tracking-wider">
                                        Standard Academic Documents
                                    </TableHead>
                                )}

                                {Object.entries(groupedCustomFields).map(([company, fields]) => {
                                    const visibleCount = fields.filter(f => visibleColumns.has(f.id)).length
                                    if (visibleCount === 0) return null
                                    return (
                                        <TableHead key={company} colSpan={visibleCount} className="text-center font-bold border-r bg-blue-50/50 text-blue-800 uppercase text-[10px] tracking-wider">
                                            {company} Custom Fields
                                        </TableHead>
                                    )
                                })}
                            </TableRow>

                            {/* Main Header Row */}
                            <TableRow className="bg-muted/5">
                                <TableHead className="w-12 border-r text-center px-0">
                                    <div className="flex justify-center">
                                        <Checkbox 
                                            checked={selectedUserIds.size === users.length && users.length > 0}
                                            onCheckedChange={toggleSelectAllUsers}
                                        />
                                    </div>
                                </TableHead>
                                {visibleColumns.has("usn") && <TableHead className="border-r whitespace-nowrap">USN</TableHead>}
                                {visibleColumns.has("name") && <TableHead className="border-r whitespace-nowrap">Student Name</TableHead>}
                                {visibleColumns.has("cgpa") && <TableHead className="border-r whitespace-nowrap">CGPA</TableHead>}
                                {visibleColumns.has("status") && <TableHead className="border-r whitespace-nowrap">KYC</TableHead>}
                                
                                {standardColumns.map(col => (
                                    visibleColumns.has(col.id) && (
                                        <TableHead key={col.id} className="whitespace-nowrap border-r text-xs">
                                            {col.label}
                                        </TableHead>
                                    )
                                ))}
                                
                                {customFieldColumns.map(col => (
                                    visibleColumns.has(col.id) && (
                                        <TableHead key={col.id} className="whitespace-nowrap border-r text-xs text-blue-700">
                                            {col.fieldLabel}
                                        </TableHead>
                                    )
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => {
                                const doc = user.document
                                
                                return (
                                    <TableRow key={user.id} className={`${selectedUserIds.has(user.id) ? "bg-blue-50/30" : ""} hover:bg-muted/20 transition-colors`}>
                                        <TableCell className="border-r text-center px-0">
                                            <div className="flex justify-center">
                                                <Checkbox 
                                                    checked={selectedUserIds.has(user.id)}
                                                    onCheckedChange={() => toggleUserSelection(user.id)}
                                                />
                                            </div>
                                        </TableCell>
                                        {visibleColumns.has("usn") && (
                                            <TableCell className="font-medium text-blue-600 border-r whitespace-nowrap">
                                                {doc?.usn || user.profile?.usn || "-"}
                                            </TableCell>
                                        )}
                                        {visibleColumns.has("name") && (
                                            <TableCell className="whitespace-nowrap border-r font-medium">
                                                {user.profile?.firstName} {user.profile?.lastName}
                                            </TableCell>
                                        )}
                                        {visibleColumns.has("cgpa") && (
                                            <TableCell className="font-semibold border-r">
                                                {doc?.cgpa?.toFixed(2) || "-"}
                                            </TableCell>
                                        )}
                                        {visibleColumns.has("status") && (
                                            <TableCell className="border-r">
                                                {getStatusBadge(doc?.kycStatus || "PENDING")}
                                            </TableCell>
                                        )}
                                        
                                        {standardColumns.map(col => (
                                            visibleColumns.has(col.id) && (
                                                <TableCell key={col.id} className="border-r">
                                                    {renderLink(getColumnValue(user, col), col.label)}
                                                </TableCell>
                                            )
                                        ))}

                                        {customFieldColumns.map(col => {
                                            if (!visibleColumns.has(col.id)) return null
                                            
                                            let value = null
                                            user.applications.forEach(app => {
                                                if (app.job.companyName === col.company) {
                                                    const resp = app.responses.find(r => r.field.label === col.fieldLabel)
                                                    if (resp?.value) value = resp.value
                                                }
                                            })

                                            return (
                                                <TableCell key={col.id} className="border-r bg-blue-50/10">
                                                    {renderLink(value, col.label)}
                                                </TableCell>
                                            )
                                        })}
                                    </TableRow>
                                )
                            })}
                            {users.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={visibleColumns.size + 1} className="h-32 text-center text-muted-foreground italic">
                                        No student document records matching the current selection.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
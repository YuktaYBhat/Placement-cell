import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, logSecurityEvent } from "@/lib/auth-helpers"
import * as XLSX from "xlsx"
import { getDocumentUrl } from "@/lib/document-utils"

export async function POST(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()
        if (error || !session) {
            return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { userIds, visibleColumns } = await request.json()

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({ error: "No students selected" }, { status: 400 })
        }

        // Fetch students with all relevant data
        const users = await prisma.user.findMany({
            where: {
                id: { in: userIds }
            },
            include: {
                profile: {
                    select: {
                        firstName: true,
                        lastName: true,
                        usn: true,
                        branch: true,
                        batch: true,
                        resumeUpload: true,
                        resume: true,
                        collegeIdCard: true,
                    }
                },
                document: true,
                applications: {
                    where: {
                        isRemoved: false,
                        responses: {
                            some: {
                                field: {
                                    type: "FILE_UPLOAD"
                                }
                            }
                        }
                    },
                    include: {
                        job: {
                            select: {
                                companyName: true,
                                title: true,
                            }
                        },
                        responses: {
                            where: {
                                field: {
                                    type: "FILE_UPLOAD"
                                }
                            },
                            include: {
                                field: {
                                    select: {
                                        label: true,
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN

        // Format data for export
        const exportData = users.map((user, index) => {
            const row: any = { "S.No": index + 1 }
            
            if (visibleColumns.includes("usn")) row["USN"] = user.document?.usn || user.profile?.usn || "N/A"
            if (visibleColumns.includes("name")) row["Name"] = `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim() || user.name || "N/A"
            if (visibleColumns.includes("cgpa")) row["CGPA"] = user.document?.cgpa?.toFixed(2) || "N/A"
            if (visibleColumns.includes("status")) row["KYC Status"] = user.document?.kycStatus || "PENDING"
            
            // Standard columns Mapping
            const standardCols = [
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

            standardCols.forEach(col => {
                if (visibleColumns.includes(col.id)) {
                    let val = null
                    if (col.source === "profile") {
                        val = col.key === "resume" 
                            ? (user.profile?.resumeUpload || user.profile?.resume)
                            : (user.profile as any)?.[col.key]
                    } else {
                        val = (user.document as any)?.[col.key]
                    }
                    row[col.label] = val ? getDocumentUrl(val, publicDomain) : "Not uploaded"
                }
            })

            // Custom field columns
            // We need to identify which custom fields are requested
            visibleColumns.forEach((colId: string) => {
                if (colId.startsWith("custom-")) {
                    const columnLabel = colId.substring(7) // Remove "custom-"
                    // Find the response that matches this Company - Field Label
                    let docUrl = "Not uploaded"
                    user.applications.forEach(app => {
                        app.responses.forEach(resp => {
                            const currentLabel = `${app.job.companyName}-${resp.field.label}`
                            if (currentLabel === columnLabel) {
                                docUrl = getDocumentUrl(resp.value, publicDomain)
                            }
                        })
                    })
                    row[columnLabel] = docUrl
                }
            })

            return row
        })

        // Create workbook
        const workbook = XLSX.utils.book_new()
        const worksheet = XLSX.utils.json_to_sheet(exportData)

        // Auto-size columns
        const colWidths = Object.keys(exportData[0] || {}).map(key => ({
            wch: Math.max(key.length, ...exportData.map(row => String(row[key] || "").length)) + 2
        }))
        worksheet["!cols"] = colWidths

        XLSX.utils.book_append_sheet(workbook, worksheet, "Student Documents")

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

        logSecurityEvent("admin_documents_exported", {
            adminId: session.user.id,
            count: userIds.length,
            timestamp: new Date().toISOString()
        })

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="Student_Documents_${new Date().toISOString().split('T')[0]}.xlsx"`
            }
        })

    } catch (error) {
        console.error("Error exporting documents:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

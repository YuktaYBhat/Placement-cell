import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, logSecurityEvent } from "@/lib/auth-helpers"
import * as XLSX from "xlsx"

type ApplicationWithUser = {
    id: string
    appliedAt: Date
    resumeUsed: string | null
    user: {
        name: string | null
        email: string
        profile: {
            firstName: string | null
            lastName: string | null
            branch: string | null
            batch: string | null
            usn: string | null
            finalCgpa: number | null
            cgpa: number | null
            callingMobile: string | null
            whatsappMobile: string | null
            resumeUpload: string | null
            resume: string | null
            linkedinLink: string | null
            githubLink: string | null
            kycStatus: string | null
        } | null
    }
}

// Available fields for export
const EXPORTABLE_FIELDS = {
    name: "Name",
    email: "Email",
    usn: "USN",
    branch: "Branch",
    batch: "Batch",
    cgpa: "CGPA",
    phone: "Phone",
    whatsapp: "WhatsApp",
    resume: "Resume Link",
    linkedin: "LinkedIn",
    github: "GitHub",
    appliedAt: "Applied Date",
    kycStatus: "KYC Status"
}

// POST - Export applicants to Excel
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, session } = await requireAdmin()
        if (error || !session) {
            return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: jobId } = await params
        const { fields, applicationIds } = await request.json()

        // Validate fields
        const selectedFields = fields || Object.keys(EXPORTABLE_FIELDS)
        const validFields = selectedFields.filter((f: string) => f in EXPORTABLE_FIELDS)

        if (validFields.length === 0) {
            return NextResponse.json({ error: "No valid fields selected" }, { status: 400 })
        }

        // Get job details
        const job = await prisma.job.findUnique({
            where: { id: jobId },
            select: { title: true, companyName: true }
        })

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 })
        }

        // Build query
        const where: any = {
            jobId,
            isRemoved: false
        }

        // If specific application IDs provided, filter by them
        if (applicationIds && applicationIds.length > 0) {
            where.id = { in: applicationIds }
        }

        const applications = await prisma.application.findMany({
            where,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        profile: {
                            select: {
                                firstName: true,
                                lastName: true,
                                branch: true,
                                batch: true,
                                usn: true,
                                finalCgpa: true,
                                cgpa: true,
                                callingMobile: true,
                                whatsappMobile: true,
                                resumeUpload: true,
                                resume: true,
                                linkedinLink: true,
                                githubLink: true,
                                kycStatus: true
                            }
                        }
                    }
                }
            },
            orderBy: { appliedAt: "desc" }
        })

        // Format data for export
        const exportData = applications.map((app: ApplicationWithUser, index: number) => {
            const row: any = { "S.No": index + 1 }

            validFields.forEach((field: string) => {
                const header = EXPORTABLE_FIELDS[field as keyof typeof EXPORTABLE_FIELDS]
                switch (field) {
                    case "name":
                        row[header] = app.user.name ||
                            `${app.user.profile?.firstName || ''} ${app.user.profile?.lastName || ''}`.trim() ||
                            "N/A"
                        break
                    case "email":
                        row[header] = app.user.email
                        break
                    case "usn":
                        row[header] = app.user.profile?.usn || "N/A"
                        break
                    case "branch":
                        row[header] = app.user.profile?.branch || "N/A"
                        break
                    case "batch":
                        row[header] = app.user.profile?.batch || "N/A"
                        break
                    case "cgpa":
                        row[header] = app.user.profile?.finalCgpa || app.user.profile?.cgpa || "N/A"
                        break
                    case "phone":
                        row[header] = app.user.profile?.callingMobile || "N/A"
                        break
                    case "whatsapp":
                        row[header] = app.user.profile?.whatsappMobile || "N/A"
                        break
                    case "resume":
                        row[header] = app.resumeUsed || app.user.profile?.resumeUpload || app.user.profile?.resume || "N/A"
                        break
                    case "linkedin":
                        row[header] = app.user.profile?.linkedinLink || "N/A"
                        break
                    case "github":
                        row[header] = app.user.profile?.githubLink || "N/A"
                        break
                    case "appliedAt":
                        row[header] = new Date(app.appliedAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                        })
                        break
                    case "kycStatus":
                        row[header] = app.user.profile?.kycStatus || "N/A"
                        break
                }
            })

            return row
        })

        // Create workbook
        const workbook = XLSX.utils.book_new()
        const worksheet = XLSX.utils.json_to_sheet(exportData)

        // Auto-size columns
        const colWidths = Object.keys(exportData[0] || {}).map(key => ({
            wch: Math.max(key.length, ...exportData.map((row: Record<string, unknown>) => String(row[key] || "").length)) + 2
        }))
        worksheet["!cols"] = colWidths

        XLSX.utils.book_append_sheet(workbook, worksheet, "Applicants")

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

        // Log export
        logSecurityEvent("applicants_exported", {
            adminId: session.user.id,
            jobId,
            exportedCount: applications.length,
            fields: validFields,
            timestamp: new Date().toISOString()
        })

        // Return as downloadable file
        const filename = `${job.companyName}_${job.title}_Applicants_${new Date().toISOString().split("T")[0]}.xlsx`
            .replace(/[^a-zA-Z0-9_.-]/g, "_")

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="${filename}"`
            }
        })

    } catch (error) {
        console.error("Error exporting applicants:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// GET - Get available export fields
export async function GET() {
    return NextResponse.json({ fields: EXPORTABLE_FIELDS })
}

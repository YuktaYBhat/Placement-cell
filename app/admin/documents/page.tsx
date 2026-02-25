
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { DocumentsManagement } from "@/components/admin/documents-management"

export default async function AdminDocumentsPage() {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
        redirect("/login")
    }

    // Fetch users with documents and their job applications (for custom field documents)
    const users = await prisma.user.findMany({
        where: {
            role: "STUDENT",
            OR: [
                { document: { isNot: null } },
                { applications: { some: { responses: { some: { field: { type: "FILE_UPLOAD" } } } } } }
            ]
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
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    const publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Student Documents</h2>
            </div>

            <DocumentsManagement 
                users={users as any} 
                publicDomain={publicDomain} 
            />
        </div>
    )
}

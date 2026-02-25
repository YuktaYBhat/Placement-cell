import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, sanitizeInput } from "@/lib/auth-helpers"

// GET - Get single company
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, session } = await requireAdmin()
        if (error || !session) {
            return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params

        const company = await prisma.company.findUnique({
            where: { id },
            include: {
                jobs: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
                _count: {
                    select: { jobs: true },
                },
            },
        })

        if (!company) {
            return NextResponse.json({ error: "Company not found" }, { status: 404 })
        }

        return NextResponse.json({ company })
    } catch (error) {
        console.error("Error fetching company:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

// PATCH - Update company
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, session } = await requireAdmin()
        if (error || !session) {
            return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()
        const { name, logo, website, industry, description, isActive } = body

        const company = await prisma.company.update({
            where: { id },
            data: {
                ...(name && { name: sanitizeInput(name.trim()) }),
                ...(logo !== undefined && { logo }),
                ...(website !== undefined && { website }),
                ...(industry !== undefined && { industry: industry ? sanitizeInput(industry) : null }),
                ...(description !== undefined && { description: description ? sanitizeInput(description) : null }),
                ...(isActive !== undefined && { isActive }),
            },
        })

        return NextResponse.json({ company })
    } catch (error) {
        console.error("Error updating company:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

// DELETE - Delete company (only if no jobs linked)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, session } = await requireAdmin()
        if (error || !session) {
            return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params

        // Check if company has jobs
        const jobCount = await prisma.job.count({
            where: { companyId: id },
        })

        if (jobCount > 0) {
            return NextResponse.json(
                { error: `Cannot delete company with ${jobCount} linked jobs. Remove jobs first or deactivate the company.` },
                { status: 400 }
            )
        }

        await prisma.company.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting company:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

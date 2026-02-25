import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, sanitizeInput } from "@/lib/auth-helpers"

// GET - List all companies
export async function GET(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()
        if (error || !session) {
            return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const searchParams = request.nextUrl.searchParams
        const search = searchParams.get("search") || ""
        const activeOnly = searchParams.get("activeOnly") === "true"

        const companies = await prisma.company.findMany({
            where: {
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        { industry: { contains: search, mode: "insensitive" } },
                    ],
                }),
                ...(activeOnly && { isActive: true }),
            },
            include: {
                _count: {
                    select: { jobs: true },
                },
            },
            orderBy: { name: "asc" },
        })

        return NextResponse.json({ companies })
    } catch (error) {
        console.error("Error fetching companies:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

// POST - Create a new company
export async function POST(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()
        if (error || !session) {
            return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { name, logo, website, industry, description } = body

        if (!name || name.trim().length === 0) {
            return NextResponse.json(
                { error: "Company name is required" },
                { status: 400 }
            )
        }

        // Check if company already exists
        const existing = await prisma.company.findUnique({
            where: { name: sanitizeInput(name.trim()) },
        })

        if (existing) {
            return NextResponse.json(
                { error: "Company with this name already exists" },
                { status: 400 }
            )
        }

        const company = await prisma.company.create({
            data: {
                name: sanitizeInput(name.trim()),
                logo: logo || null,
                website: website || null,
                industry: industry ? sanitizeInput(industry) : null,
                description: description ? sanitizeInput(description) : null,
            },
        })

        return NextResponse.json({ company }, { status: 201 })
    } catch (error) {
        console.error("Error creating company:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

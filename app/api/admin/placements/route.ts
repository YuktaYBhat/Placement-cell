import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, logSecurityEvent } from "@/lib/auth-helpers"

// Helper to determine tier from salary
function determineTierFromSalary(salary: number): string {
    if (salary > 9) return "TIER_1"
    if (salary > 5) return "TIER_2"
    return "TIER_3"
}

// GET - List all placements
export async function GET(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()
        if (error || !session) {
            return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = request.nextUrl
        const tier = searchParams.get("tier")
        const batch = searchParams.get("batch")
        const branch = searchParams.get("branch")
        const search = searchParams.get("search") || ""
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "20")
        const skip = (page - 1) * limit

        const where: any = {}

        if (tier && tier !== "ALL") {
            where.tier = tier
        }

        if (search) {
            where.OR = [
                { companyName: { contains: search, mode: "insensitive" } },
                { user: { name: { contains: search, mode: "insensitive" } } },
                { user: { email: { contains: search, mode: "insensitive" } } }
            ]
        }

        // Filter by batch/branch through user profile
        if (batch || branch) {
            where.user = {
                profile: {
                    ...(batch && { batch }),
                    ...(branch && { branch })
                }
            }
        }

        const [placements, total] = await Promise.all([
            prisma.placement.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            profile: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                    usn: true,
                                    branch: true,
                                    batch: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit
            }),
            prisma.placement.count({ where })
        ])

        // Get statistics
        const stats = await prisma.placement.groupBy({
            by: ["tier"],
            _count: { tier: true },
            _avg: { salary: true }
        })

        return NextResponse.json({
            placements,
            stats,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        })

    } catch (error) {
        console.error("Error fetching placements:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST - Record a new placement
export async function POST(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()
        if (error || !session) {
            return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { userId, jobId, salary, companyName, tier, isException, exceptionNote } = await request.json()

        if (!userId || !jobId || !salary || !companyName) {
            return NextResponse.json(
                { error: "userId, jobId, salary, and companyName are required" },
                { status: 400 }
            )
        }

        // Determine tier if not provided
        const placementTier = tier || determineTierFromSalary(parseFloat(salary))

        // Check for existing placement at same tier (unless exception)
        if (!isException) {
            const existingPlacement = await prisma.placement.findFirst({
                where: {
                    userId,
                    tier: placementTier,
                    isException: false
                }
            })

            if (existingPlacement) {
                return NextResponse.json(
                    { error: `Student already has a ${placementTier} placement` },
                    { status: 400 }
                )
            }
        }

        const placement = await prisma.placement.create({
            data: {
                userId,
                jobId,
                salary: parseFloat(salary),
                companyName,
                tier: placementTier,
                isException: isException || false,
                exceptionNote: exceptionNote || null
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        })

        // Notify the student
        await prisma.notification.create({
            data: {
                userId,
                title: "Placement Confirmed! 🎉",
                message: `Congratulations! Your placement at ${companyName} with ${salary} LPA has been confirmed.`,
                type: "PLACEMENT_UPDATE",
                data: { placementId: placement.id, jobId, salary, companyName }
            }
        })

        logSecurityEvent("placement_recorded", {
            adminId: session.user.id,
            userId,
            companyName,
            salary,
            tier: placementTier,
            isException,
            timestamp: new Date().toISOString()
        })

        return NextResponse.json({ success: true, placement }, { status: 201 })

    } catch (error) {
        console.error("Error recording placement:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// DELETE - Remove a placement record
export async function DELETE(request: NextRequest) {
    try {
        const { error, session } = await requireAdmin()
        if (error || !session) {
            return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = request.nextUrl
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json({ error: "Placement ID is required" }, { status: 400 })
        }

        await prisma.placement.delete({
            where: { id }
        })

        logSecurityEvent("placement_deleted", {
            adminId: session.user.id,
            placementId: id,
            timestamp: new Date().toISOString()
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("Error deleting placement:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

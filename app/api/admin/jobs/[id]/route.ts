import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-helpers"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { error, session } = await requireAdmin()

        if (error || !session) {
            return error
        }

        const job = await prisma.job.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        applications: true
                    }
                }
            }
        })

        if (!job) {
            return NextResponse.json(
                { error: "Job not found" },
                { status: 404 }
            )
        }

        return NextResponse.json({ job })

    } catch (error) {
        console.error("Error fetching job:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

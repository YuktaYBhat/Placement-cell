import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { usn, finalCgpa, academicDocument } = body

        if (!usn || !finalCgpa || !academicDocument) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const updatedProfile = await prisma.profile.update({
            where: { userId: session.user.id },
            data: {
                usn,
                finalCgpa,
                academicDocument
            }
        })

        revalidatePath("/admin/kyc-queue")
        revalidatePath("/documents")

        return NextResponse.json({ success: true, profile: updatedProfile })

    } catch (error) {
        console.error("Profile update error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

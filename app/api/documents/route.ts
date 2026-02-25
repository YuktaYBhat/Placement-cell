
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()

        // Log request body for debugging
        console.log("Documents API Request Body:", body)

        const {
            usn,
            cgpa,
            tenthMarksCardLink,
            twelfthMarksCardLink,
            sem1Link,
            sem2Link,
            sem3Link,
            sem4Link,
            sem5Link,
            sem6Link,
            sem7Link,
            sem8Link
        } = body

        // Basic validation
        if (!usn) {
            return NextResponse.json({ error: "USN is required" }, { status: 400 })
        }

        // Upsert Document record
        const document = await prisma.document.upsert({
            where: {
                userId: session.user.id
            },
            update: {
                usn,
                cgpa: cgpa ? parseFloat(cgpa) : undefined,
                tenthMarksCardLink,
                twelfthMarksCardLink,
                sem1Link,
                sem2Link,
                sem3Link,
                sem4Link,
                sem5Link,
                sem6Link,
                sem7Link,
                sem8Link,
                kycStatus: "PENDING"
            },
            create: {
                userId: session.user.id,
                usn,
                cgpa: cgpa ? parseFloat(cgpa) : undefined,
                tenthMarksCardLink,
                twelfthMarksCardLink,
                sem1Link,
                sem2Link,
                sem3Link,
                sem4Link,
                sem5Link,
                sem6Link,
                sem7Link,
                sem8Link,
                kycStatus: "PENDING"
            }
        })

        // Sync Profile kycStatus to PENDING
        await prisma.profile.update({
            where: { userId: session.user.id },
            data: { kycStatus: "PENDING" }
        })

        return NextResponse.json({ success: true, document })

    } catch (error) {
        console.error("Documents API Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const document = await prisma.document.findUnique({
            where: {
                userId: session.user.id
            }
        })

        return NextResponse.json({ success: true, document })

    } catch (error) {
        console.error("Documents API Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

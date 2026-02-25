import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ exists: false, error: "Missing userId" }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { id: userId } })
    return NextResponse.json({ exists: !!user })
  } catch (error) {
    return NextResponse.json({ exists: false, error: "Server error" }, { status: 500 })
  }
} 
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

/**
 * Smart callback redirect that checks profile completion
 * and redirects users to the appropriate page
 */
export async function GET(request: NextRequest) {
  try {
    // Get the session
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Check for role-based redirect
    if (session.user.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    }

    // For all other users (Students, etc.), redirect to the dashboard
    // We no longer force users to the /profile page based on completion status
    return NextResponse.redirect(new URL("/dashboard", request.url))
  } catch (error) {
    console.error("Auth callback error:", error)
    return NextResponse.redirect(new URL("/login", request.url))
  }
}
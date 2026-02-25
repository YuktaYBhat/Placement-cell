import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { deleteFromR2 } from "@/lib/r2-storage"

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    if (!key) {
      return NextResponse.json({ error: "File key is required" }, { status: 400 })
    }

    // Verify that the file belongs to the authenticated user
    if (!key.startsWith(`users/${session.user.id}/`)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Delete from Cloudflare R2
    await deleteFromR2(key)

    return NextResponse.json({
      success: true,
      message: "File deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

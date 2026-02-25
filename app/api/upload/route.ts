import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { uploadToR2, generateFilename, getFileTypeCategory } from "@/lib/r2-storage"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    let type = formData.get("type") as string | null
    const folder = formData.get("folder") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Support both "type" and "folder" parameters for backward compatibility
    if (!type && folder) {
      // Map folder names to types
      const folderToTypeMap: Record<string, string> = {
        "college-id-cards": "college-id-card",
        "resumes": "resume",
        "profile-photos": "profile-photo",
        "academic-documents": "academic-document",
      }
      type = folderToTypeMap[folder] || folder
    }

    if (!type) {
      return NextResponse.json({ error: "Upload type is required" }, { status: 400 })
    }

    // Validate file type based on upload type
    const allowedTypes: Record<string, string[]> = {
      "profile-photo": ["image/jpeg", "image/png", "image/webp"],
      "resume": [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ],
      "college-id-card": ["application/pdf", "image/jpeg", "image/png", "image/jpg"],
      "tenthMarksCard": ["application/pdf", "image/jpeg", "image/png"],
      "twelfthMarksCard": ["application/pdf", "image/jpeg", "image/png"],
      "diplomaMarksCard": ["application/pdf", "image/jpeg", "image/png"],
      "diplomaCertificates": ["application/pdf", "image/jpeg", "image/png"],
      "semesterMarksCard": ["application/pdf", "image/jpeg", "image/png"],
      "degreeMarksCard": ["application/pdf", "image/jpeg", "image/png"],
      "transcript": ["application/pdf"],
      "passport": ["application/pdf", "image/jpeg", "image/png"],
      "aadharCard": ["application/pdf", "image/jpeg", "image/png"],
      "panCard": ["application/pdf", "image/jpeg", "image/png"],
      "academic-document": [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv"
      ],
      "company-logo": ["image/jpeg", "image/png", "application/pdf"],
    }

    if (!allowedTypes[type]?.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type for ${type}. Allowed: image/pdf/excel/word/csv` },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit for documents, 5MB for images)
    const fileTypeCategory = getFileTypeCategory(type)
    // College ID cards can be up to 10MB (images or PDFs)
    const maxSize = (fileTypeCategory === "image" && type !== "college-id-card") ? 5 * 1024 * 1024 : 10 * 1024 * 1024

    if (file.size > maxSize) {
      const sizeLimit = fileTypeCategory === "image" ? "5MB" : "10MB"
      return NextResponse.json(
        { error: `File size must be less than ${sizeLimit}` },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate proper filename with user ID and type
    const filename = generateFilename(session.user.id, type, file.name)

    // Upload to Cloudflare R2
    const uploadResult = await uploadToR2(
      buffer,
      filename,
      file.type,
      session.user.id
    )

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      key: uploadResult.key,
      filename: filename.split("/").pop(), // Just the filename without path
      type,
      message: "File uploaded successfully to Cloudflare R2"
    })

  } catch (error) {
    console.error("Error uploading file:", error)

    // Provide more specific error messages
    if (error instanceof Error) {
      // Check if it's an R2 configuration error
      if (error.message.includes("R2") || error.message.includes("storage")) {
        return NextResponse.json(
          { error: "Storage service is not configured. Please contact support." },
          { status: 503 }
        )
      }

      // Check if it's a file processing error
      if (error.message.includes("buffer") || error.message.includes("arrayBuffer")) {
        return NextResponse.json(
          { error: "Failed to process file. Please try again with a different file." },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: error.message || "Failed to upload file" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    )
  }
}

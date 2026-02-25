import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, sanitizeInput, logSecurityEvent } from "@/lib/auth-helpers"

export async function GET() {
  try {
    // Check authentication
    const { error, session } = await requireAuth()

    if (error || !session) {
      return error
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const { error, session } = await requireAuth()

    if (error || !session) {
      return error
    }

    const data = await request.json()

    // Prevent userId tampering - always use session userId
    const sanitizedData = { ...data }
    delete sanitizedData.userId // Remove if present in payload
    delete sanitizedData.id // Prevent ID manipulation

    console.log("Received profile update payload:", JSON.stringify(sanitizedData, null, 2))

    // Sanitize string fields and filter out File objects (which serialize as empty objects)
    Object.keys(sanitizedData).forEach(key => {
      const value = sanitizedData[key]

      // Remove null/undefined
      if (value === null || value === undefined) {
        delete sanitizedData[key]
        return
      }

      // Sanitize strings
      if (typeof value === 'string') {
        sanitizedData[key] = sanitizeInput(value)
        return
      }

      // Filter out empty objects (File objects serialize as {} when sent as JSON)
      // Keep arrays and objects with actual data
      if (typeof value === 'object') {
        // Allow arrays (even empty ones for clearing)
        if (Array.isArray(value)) {
          return
        }
        // Remove empty objects (likely File objects that couldn't be serialized)
        if (Object.keys(value).length === 0) {
          delete sanitizedData[key]
          return
        }
      }
    })

    // Validate critical fields
    if (sanitizedData.usn && sanitizedData.usn.length > 20) {
      return NextResponse.json(
        { error: "USN too long" },
        { status: 400 }
      )
    }

    if (sanitizedData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedData.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Prevent users from manually setting KYC status to VERIFIED or REJECTED
    // Only admins can set these statuses via the admin API
    if (sanitizedData.kycStatus && ['VERIFIED', 'REJECTED'].includes(sanitizedData.kycStatus)) {
      delete sanitizedData.kycStatus
    }

    // Check if profile exists
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    })

    // Merge existing profile data with new data to check completeness
    const mergedData = existingProfile ? { ...existingProfile, ...sanitizedData } : sanitizedData

    // Function to check if profile is complete enough for KYC review
    const isProfileComplete = (profileData: any): boolean => {
      // Check essential fields
      const hasPersonalInfo = !!(
        profileData.firstName &&
        profileData.lastName &&
        profileData.dateOfBirth &&
        profileData.gender &&
        profileData.usn
      )

      const hasContactInfo = !!(
        profileData.callingMobile &&
        profileData.email
      )

      const hasAcademicInfo = !!(
        profileData.tenthPercentage !== null &&
        profileData.tenthPercentage !== undefined &&
        profileData.tenthPassingYear
      )

      const hasEngineeringInfo = !!(
        profileData.branch &&
        profileData.batch &&
        profileData.cgpa !== null &&
        profileData.cgpa !== undefined
      )

      // Check if resume is uploaded (important for KYC)
      const hasResume = !!(profileData.resume || profileData.resumeUpload)

      return hasPersonalInfo && hasContactInfo && hasAcademicInfo && hasEngineeringInfo && hasResume
    }

    // Determine KYC status update
    let kycStatusUpdate: { kycStatus?: 'PENDING' | 'UNDER_REVIEW' | 'INCOMPLETE' | 'VERIFIED' } = {}

    // Only auto-update KYC status if it hasn't been set by an admin (VERIFIED/REJECTED)
    const currentKycStatus = existingProfile?.kycStatus || 'PENDING'
    const isAdminSetStatus = currentKycStatus === 'VERIFIED' || currentKycStatus === 'REJECTED'

    // Check if College ID card is being uploaded or already exists
    const hasCollegeId = !!(sanitizedData.collegeIdCard || mergedData.collegeIdCard || existingProfile?.collegeIdCard)

    if (!isAdminSetStatus) {
      // If College ID is uploaded and profile is complete, mark as VERIFIED
      if (hasCollegeId && isProfileComplete(mergedData)) {
        // Only update to VERIFIED if not already VERIFIED
        kycStatusUpdate.kycStatus = 'VERIFIED'
      }
      // If profile is complete (without College ID), move to UNDER_REVIEW
      else if (isProfileComplete(mergedData)) {
        if (currentKycStatus === 'PENDING' || currentKycStatus === 'INCOMPLETE') {
          kycStatusUpdate.kycStatus = 'UNDER_REVIEW'
        }
      } else if (currentKycStatus === 'UNDER_REVIEW') {
        // If profile becomes incomplete while UNDER_REVIEW, revert to PENDING
        kycStatusUpdate.kycStatus = 'PENDING'
      }
    }

    // Merge KYC status update with sanitized data
    const updateData = {
      ...sanitizedData,
      ...kycStatusUpdate,
      updatedAt: new Date()
    }

    console.log("Updating profile with data:", JSON.stringify(updateData, null, 2))

    let profile
    if (existingProfile) {
      // Update existing profile - ensure user can only update their own profile
      // Allow updates regardless of current KYC status
      profile = await prisma.profile.update({
        where: {
          userId: session.user.id // Always use session userId
        },
        data: updateData
      })

      logSecurityEvent("profile_updated", {
        userId: session.user.id,
        timestamp: new Date().toISOString(),
        kycStatusChanged: !!kycStatusUpdate.kycStatus,
        newKycStatus: kycStatusUpdate.kycStatus
      })
    } else {
      // Create new profile
      profile = await prisma.profile.create({
        data: {
          userId: session.user.id, // Always use session userId
          ...updateData,
        }
      })

      logSecurityEvent("profile_created", {
        userId: session.user.id,
        timestamp: new Date().toISOString()
      })
    }

    // Sync documents to Document model for Admin view
    try {
      // Extract semester marks cards from the semantics array
      const semesterMarks: Record<string, string | null> = {}
      if (Array.isArray(sanitizedData.semesters)) {
        sanitizedData.semesters.forEach((sem: any) => {
          if (sem && sem.semester && sem.marksCard) {
            semesterMarks[`sem${sem.semester}Link`] = sem.marksCard
          }
        })
      }

      // Upsert Document record
      await prisma.document.upsert({
        where: { userId: session.user.id },
        update: {
          usn: sanitizedData.usn || undefined,
          cgpa: sanitizedData.finalCgpa ? parseFloat(sanitizedData.finalCgpa) : undefined,
          tenthMarksCardLink: sanitizedData.tenthMarksCard || undefined,
          twelfthMarksCardLink: sanitizedData.twelfthMarksCard || undefined,
          ...semesterMarks,
          kycStatus: "PENDING"
        },
        create: {
          userId: session.user.id,
          usn: sanitizedData.usn,
          cgpa: sanitizedData.finalCgpa ? parseFloat(sanitizedData.finalCgpa) : undefined,
          tenthMarksCardLink: sanitizedData.tenthMarksCard,
          twelfthMarksCardLink: sanitizedData.twelfthMarksCard,
          ...semesterMarks as any, // Type cast as we know the structure matches
          kycStatus: "PENDING"
        }
      })
      console.log("Synced documents to Admin Document model")
    } catch (docError) {
      console.error("Error syncing documents:", docError)
      // Don't fail the whole request if document sync fails, but log it
    }

    return NextResponse.json({
      success: true,
      profile,
      message: "Profile updated successfully"
    })
  } catch (error) {
    console.error("Error updating profile:", error)
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }

    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { error: "USN already exists. Please use a different USN." },
          { status: 400 }
        )
      }
    }

    logSecurityEvent("profile_update_error", {
      error: error instanceof Error ? error.message : "Unknown error"
    })

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, sanitizeInput, logSecurityEvent } from "@/lib/auth-helpers"

export async function POST(request: NextRequest) {
    try {
        // Check authentication and authorization
        const { error, session } = await requireAdmin()

        if (error || !session) {
            logSecurityEvent("unauthorized_admin_access", {
                endpoint: "/api/admin/kyc-verification",
                ip: request.headers.get("x-forwarded-for") || "unknown"
            })
            return error
        }

        const { profileId, status, notes, verifiedBy, backlogCount, backlogSubjects } = await request.json()

        // Input validation
        if (!profileId || !status || !verifiedBy) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

        // Validate status value
        const validStatuses = ['PENDING', 'VERIFIED', 'REJECTED']
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: "Invalid status value" },
                { status: 400 }
            )
        }

        // Sanitize inputs
        const sanitizedNotes = notes ? sanitizeInput(notes) : null
        const sanitizedVerifiedBy = sanitizeInput(verifiedBy)

        // Process backlog data if provided
        let backlogUpdate: any = {};
        if (backlogCount !== undefined) {
            const count = parseInt(backlogCount);
            const hasBacklogs = count > 0;

            // If backlogs exist, try to format them, otherwise empty array
            let backlogsData: any[] = [];
            if (count > 0 && backlogSubjects) {
                // Construct a simple backlog object from the text description
                // This preserves the administrator's entry while maintaining the array structure
                backlogsData = [{
                    code: "ADMIN_VERIFIED",
                    title: sanitizeInput(backlogSubjects)
                }];
            }

            backlogUpdate = {
                hasBacklogs: hasBacklogs ? "yes" : "no",
                activeBacklogs: hasBacklogs,
                backlogs: backlogsData,
                // Also update maxBacklogs logic if needed, but schema uses `activeBacklogs` boolean primarily 
                // in some places, but `backlogs` Json in others. 
                // We will set `activeBacklogs` boolean as well.
            };
        }

        // Verify profile exists
        const existingProfile = await prisma.profile.findUnique({
            where: { id: profileId },
            select: { id: true, userId: true }
        })

        if (!existingProfile) {
            return NextResponse.json(
                { error: "Profile not found" },
                { status: 404 }
            )
        }

        // Update the profile with verification status
        const updatedProfile = await prisma.profile.update({
            where: { id: profileId },
            data: {
                kycStatus: status,
                verifiedBy: sanitizedVerifiedBy,
                verifiedAt: status === 'VERIFIED' ? new Date() : null,
                remarks: sanitizedNotes,
                updatedAt: new Date(),
                ...backlogUpdate
            }
        })

        // Log security event
        logSecurityEvent("kyc_verification_updated", {
            adminId: session.user.id,
            profileId,
            status,
            timestamp: new Date().toISOString()
        })

        // Sync Document status
        if (existingProfile.userId) {
            await prisma.document.updateMany({
                where: { userId: existingProfile.userId },
                data: { kycStatus: status }
            })
        }

        // TODO: Send notification email to the student
        // You can implement email notification here using your email service

        return NextResponse.json({
            success: true,
            profile: updatedProfile
        })

    } catch (error) {
        console.error("Error updating KYC status:", error)
        logSecurityEvent("kyc_verification_error", {
            error: error instanceof Error ? error.message : "Unknown error"
        })
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
//     if (error || !session) {
//       logSecurityEvent("unauthorized_admin_access", {
//         endpoint: "/api/admin/kyc-verification",
//         ip: request.headers.get("x-forwarded-for") || "unknown"
//     }

//     const { profileId, status, notes, verifiedBy, backlogCount, backlogSubjects } = await request.json()

//     // Input validation
//     if (!profileId || !status || !verifiedBy) {
//       return NextResponse.json(
//         { error: "Missing required fields" },
//         { status: 400 }
//       )
//     }

//     // Validate status value
//     const validStatuses = ['PENDING', 'VERIFIED', 'REJECTED']
//     if (!validStatuses.includes(status)) {
//       return NextResponse.json(
//         { error: "Invalid status value" },
//         { status: 400 }
//       )
//     }

//     // Sanitize inputs
//     const sanitizedNotes = notes ? sanitizeInput(notes) : null
//     const sanitizedVerifiedBy = sanitizeInput(verifiedBy)

//     // Process backlog data if provided
//     let backlogUpdate = {};
//     if (backlogCount !== undefined && backlogSubjects !== undefined) {
//       const count = parseInt(backlogCount);
//       const hasBacklogs = count > 0 ? "yes" : "no";

//       // If backlogs exist, try to format them, otherwise empty array
//       let backlogsData = [];
//       if (count > 0 && backlogSubjects) {
//         // Construct a simple backlog object from the text description
//         // This preserves the administrator's entry while maintaining the array structure
//         backlogsData = [{
//           code: "ADMIN_VERIFIED",
//           title: sanitizeInput(backlogSubjects)
//         }];
//       }

//       backlogUpdate = {
//         hasBacklogs,
//         backlogs: backlogsData
//       };
//     }

//     // Verify profile exists
//     const existingProfile = await prisma.profile.findUnique({
//       where: { id: profileId },
//       select: { id: true, userId: true }
//     })

//     if (!existingProfile) {
//       return NextResponse.json(
//         { error: "Profile not found" },
//         { status: 404 }
//       )
//     }

//     // Update the profile with verification status
//     const updatedProfile = await prisma.profile.update({
//       where: { id: profileId },
//       data: {
//         kycStatus: status,
//         verifiedBy: sanitizedVerifiedBy,
//         verifiedAt: status === 'VERIFIED' ? new Date() : null,
//         remarks: sanitizedNotes,
//         updatedAt: new Date(),
//         ...backlogUpdate
//       }
//     })

//     // Log security event
//     logSecurityEvent("kyc_verification_updated", {
//       adminId: session.user.id,
//       profileId,
//       status,
//       timestamp: new Date().toISOString()
//     })

//     // TODO: Send notification email to the student
//     // You can implement email notification here using your email service

//     return NextResponse.json({
//       success: true,
//       profile: updatedProfile
//     })

//   } catch (error) {
//     console.error("Error updating KYC status:", error)
//     logSecurityEvent("kyc_verification_error", {
//       error: error instanceof Error ? error.message : "Unknown error"
//     })
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     )
//   }
// }

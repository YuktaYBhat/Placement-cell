import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { KYCVerificationQueue } from "@/components/kyc-verification-queue"

export const metadata: Metadata = {
    title: "KYC Verification Queue | Admin",
    description: "Review and approve student KYC verifications",
}

export const dynamic = "force-dynamic"

export default async function KYCQueuePage() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect("/login")
    }

    // Get user with role information
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    const isAdmin = user?.role === 'ADMIN'

    if (!isAdmin) {
        redirect("/dashboard")
    }

    // Fetch all profiles that need KYC verification
    const pendingVerifications = await prisma.profile.findMany({
        where: {
            OR: [
                { kycStatus: "PENDING" },
                { kycStatus: "UNDER_REVIEW" }
            ]
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                    document: true, // Include document relation
                }
            }
        },
        orderBy: {
            updatedAt: "asc" // Oldest first for fairness
        }
    })

    return (
        <div className="container mx-auto py-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">KYC Verification Queue</h1>
                <p className="text-muted-foreground mt-2">
                    Review and approve student profiles for placement eligibility
                </p>
            </div>

            <KYCVerificationQueue
                pendingVerifications={pendingVerifications}
                adminId={session.user.id}
                publicDomain={process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN}
            />
        </div>
    )
}
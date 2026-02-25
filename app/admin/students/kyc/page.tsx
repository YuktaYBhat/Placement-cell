import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { KYCVerificationQueue } from "@/components/kyc-verification-queue"

export default async function KYCVerificationPage() {
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

  // Fetch pending KYC verifications
  const pendingVerifications = await prisma.profile.findMany({
    where: {
      OR: [
        { kycStatus: 'PENDING' },
        { kycStatus: 'UNDER_REVIEW' }
      ]
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
        <h1 className="text-3xl font-bold">KYC Verification Queue</h1>
      </div>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <p className="text-muted-foreground">
            Review and verify student profiles and documents
          </p>
        </div>
        
        <KYCVerificationQueue 
          pendingVerifications={pendingVerifications}
          adminId={session.user.id}
        />
      </div>
    </div>
  )
}

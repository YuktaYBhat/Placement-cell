import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ProfileCompletion } from "@/components/profile-completion"

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Check if user has a profile
  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: {
        include: {
          document: true
        }
      }
    }
  })

  // Allow viewing/editing profile even if complete
  // The ProfileCompletion component will handle the display mode

  return (
    <main className="flex-1 bg-background min-h-screen">
      <div className="container mx-auto py-8 flex flex-col gap-6">
        <ProfileCompletion profile={profile} />
      </div>
    </main>
  )
}

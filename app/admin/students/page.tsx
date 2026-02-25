import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { StudentManagement } from "@/components/student-management"

export default async function StudentsPage() {
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

  // Fetch all students with their profiles
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    include: {
      profile: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          isComplete: true,
          completionStep: true,
          kycStatus: true,
          usn: true,
          branch: true,
          batch: true,
          phone: true,
          verifiedAt: true,
          createdAt: true,
          updatedAt: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
        <h1 className="text-3xl font-bold">Student Management</h1>
      </div>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <p className="text-muted-foreground">
            Manage all student accounts and profiles
          </p>
        </div>
        
        <StudentManagement 
          students={students}
          adminId={session.user.id}
        />
      </div>
    </div>
  )
}

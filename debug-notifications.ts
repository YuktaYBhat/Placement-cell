import 'dotenv/config'
import { prisma } from './lib/prisma'

async function main() {
    console.log("Checking notifications table...")
    const notifications = await prisma.notification.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
    })
    console.log("Latest 10 notifications:", JSON.stringify(notifications, null, 2))

    const count = await prisma.notification.count()
    console.log("Total notifications count:", count)

    const users = await prisma.user.findMany({
        take: 5,
        select: { id: true, email: true, role: true }
    })
    console.log("Sample users:", JSON.stringify(users, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())

import 'dotenv/config'
import { prisma } from './lib/prisma'

async function main() {
    console.log("Checking profiles...")
    const profiles = await prisma.profile.findMany({
        select: {
            userId: true,
            kycStatus: true,
            branch: true,
            user: {
                select: { email: true }
            }
        }
    })
    console.log("All profiles:", JSON.stringify(profiles, null, 2))

    const verifiedCount = profiles.filter(p => p.kycStatus === 'VERIFIED').length
    console.log("Verified profiles count:", verifiedCount)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())

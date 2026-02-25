
import { prisma } from "./lib/prisma"

async function main() {
    console.log("🔍 Inspecting latest job...")
    const job = await prisma.job.findFirst({
        orderBy: { createdAt: 'desc' }
    })

    if (!job) {
        console.log("❌ No jobs found")
        return
    }

    console.log("✅ Latest Job Details:")
    console.log(`- ID: ${job.id}`)
    console.log(`- Title: ${job.title}`)
    console.log(`- Company: ${job.companyName}`)
    console.log(`- Eligible Batch (DB Value): '${job.eligibleBatch}'`)
    console.log(`- Type of Eligible Batch: ${typeof job.eligibleBatch}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

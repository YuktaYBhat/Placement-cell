
import * as dotenv from "dotenv"
dotenv.config()
import { prisma } from "./lib/prisma"

async function test() {
    try {
        console.log("Testing prisma.user.findFirst()...")
        const user = await prisma.user.findFirst({
            include: { profile: true }
        })
        console.log("Result:", user ? `Found user: ${user.email}` : "No user found")

        if (user && user.profile) {
            console.log("Profile data found for user")
        }
    } catch (error: any) {
        console.error("Prisma Error:", error.message)
        if (error.code) console.error("Error Code:", error.code)
        if (error.meta) console.error("Error Meta:", JSON.stringify(error.meta, null, 2))
    } finally {
        await prisma.$disconnect()
    }
}

test()

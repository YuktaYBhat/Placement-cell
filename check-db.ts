/**
 * QUICK DATABASE DIAGNOSTIC SCRIPT
 * Run with: npx ts-node check-db.ts
 *
 * This script checks the database state for signup/login issues
 */

import { prisma } from "./lib/prisma"
import bcrypt from "bcryptjs"

async function main() {
  console.log("\n🔍 DATABASE DIAGNOSTIC SCRIPT\n")

  try {
    // Get total users
    const userCount = await prisma.user.count()
    console.log(`📊 Total users in DB: ${userCount}\n`)

    if (userCount === 0) {
      console.log("❌ No users found. Complete signup flow first.\n")
      return
    }

    // Get all users with credentials (exclude OAuth-only users)
    const users = await prisma.user.findMany({
      where: {
        password: {
          not: null,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    console.log(`📋 Users with passwords: ${users.length}\n`)

    if (users.length === 0) {
      console.log("⚠️ No users with passwords found. Only OAuth users exist.\n")
      return
    }

    // Analyze each user
    for (const user of users) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`👤 User: ${user.name || "Unknown"}`)
      console.log(`📧 Email: ${user.email}`)
      console.log(`🆔 ID: ${user.id}`)
      console.log(
        `✉️  Email Verified: ${user.emailVerified ? "✅ YES" : "❌ NO"}`
      )
      console.log(`\n🔐 PASSWORD ANALYSIS:`)

      const password = user.password

      if (!password) {
        console.log(`   ❌ Password is NULL/EMPTY!`)
      } else if (
        password.startsWith("$2a$") ||
        password.startsWith("$2b$")
      ) {
        console.log(`   ✅ Password is BCRYPT HASHED`)
        console.log(`   📏 Hash length: ${password.length}`)
        console.log(
          `   🆔 Hash (first 30 chars): ${password.substring(0, 30)}...`
        )

        // Test bcrypt comparison with a test password
        console.log(`\n🧪 BCRYPT COMPARISON TEST:`)
        console.log(
          `   Testing if bcrypt.compare works with this hash...`
        )

        try {
          const testValid = await bcrypt.compare(
            "testpassword",
            password
          )
          const testInvalid = await bcrypt.compare(
            "wrongpassword",
            password
          )

          console.log(`   ✅ bcrypt.compare is working`)
          console.log(`   - "testpassword" matches: ${testValid}`)
          console.log(`   - "wrongpassword" matches: ${testInvalid}`)
        } catch (err) {
          console.log(`   ❌ bcrypt.compare ERROR:`, err)
        }
      } else {
        console.log(`   ❌ Password is PLAIN TEXT (NOT HASHED)!`)
        console.log(
          `   🚨 THIS IS THE BUG - Password should be bcrypt hash`
        )
        console.log(
          `   📏 Password (first 50 chars): ${password.substring(
            0,
            50
          )}...`
        )
      }

      console.log(`\n📅 Created: ${user.createdAt.toISOString()}`)
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

    // Summary
    console.log(`📈 SUMMARY:`)

    const plainTextCount = users.filter(
      (u) => u.password && !u.password.startsWith("$2")
    ).length

    const hashedCount = users.filter(
      (u) => u.password && u.password.startsWith("$2")
    ).length

    const unverifiedCount = users.filter(
      (u) => !u.emailVerified
    ).length

    console.log(`   ✅ Properly hashed: ${hashedCount}`)
    console.log(`   ❌ Plain text: ${plainTextCount}`)
    console.log(`   ⚠️  Unverified emails: ${unverifiedCount}`)

    if (plainTextCount > 0) {
      console.log(`\n🚨 ACTION REQUIRED:`)
      console.log(
        `   Password hashing is broken in signup!`
      )
      console.log(
        `   Check: /app/api/auth/register/route.ts`
      )
      console.log(
        `   Issue: Missing await on bcrypt.hash() or password not being stored correctly`
      )
    }

    console.log(`\n`)
  } catch (error) {
    console.error("❌ Database error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()

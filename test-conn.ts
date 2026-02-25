import "dotenv/config"
import { Client } from "pg"

async function test(name: string, url: string | undefined) {
    if (!url) {
        console.log(`❌ ${name}: No URL found`)
        return
    }
    console.log(`Testing ${name}...`)
    const client = new Client({ connectionString: url })
    try {
        await client.connect()
        console.log(`✅ ${name}: Connected successfully`)
        await client.end()
    } catch (err) {
        console.log(`❌ ${name}: Failed to connect`)
        console.log(err)
    }
}

async function run() {
    await test("DATABASE_URL", process.env.DATABASE_URL)
    await test("DIRECT_URL", process.env.DIRECT_URL)
}

run()

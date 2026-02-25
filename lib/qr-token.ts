/**
 * QR Token utilities for secure attendance system
 * Uses HMAC-SHA256 to sign tokens with a server secret
 * Tokens contain: userId, jobId, roundId, sessionId, issuedAt, nonce
 * No raw data is exposed - only signed tokens
 */

import crypto from "crypto"

const QR_TOKEN_SECRET = process.env.QR_TOKEN_SECRET || process.env.AUTH_SECRET || "fallback-secret"
const TOKEN_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes

interface QRTokenPayload {
    userId: string
    jobId: string
    roundId: string
    sessionId: string
    issuedAt: number
    nonce: string
}

/**
 * Generate a signed QR token for attendance
 */
export function generateQRToken(payload: Omit<QRTokenPayload, "issuedAt" | "nonce">): string {
    const fullPayload: QRTokenPayload = {
        ...payload,
        issuedAt: Date.now(),
        nonce: crypto.randomBytes(16).toString("hex"),
    }

    const data = JSON.stringify(fullPayload)
    const signature = crypto
        .createHmac("sha256", QR_TOKEN_SECRET)
        .update(data)
        .digest("hex")

    // Encode as base64 for compact QR code
    const token = Buffer.from(JSON.stringify({ data: fullPayload, sig: signature })).toString("base64")
    return token
}

/**
 * Verify and decode a QR token
 * Returns the payload if valid, null if invalid or expired
 */
export function verifyQRToken(token: string): QRTokenPayload | null {
    try {
        const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"))
        const { data, sig } = decoded

        if (!data || !sig) {
            return null
        }

        // Verify signature
        const expectedSig = crypto
            .createHmac("sha256", QR_TOKEN_SECRET)
            .update(JSON.stringify(data))
            .digest("hex")

        if (sig !== expectedSig) {
            return null // Tampered token
        }

        // Check expiry
        const payload = data as QRTokenPayload
        if (Date.now() - payload.issuedAt > TOKEN_EXPIRY_MS) {
            return null // Expired token
        }

        return payload
    } catch {
        return null // Malformed token
    }
}

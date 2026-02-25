/**
 * Authorization helpers for secure session and role management
 */

import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export type UserRole = "STUDENT" | "ADMIN" | "SUPER_ADMIN"

/**
 * Get the current authenticated session
 * @throws Returns null if no session exists
 */
export async function getSession() {
    return await auth()
}

/**
 * Get the current user or return unauthorized response
 * @returns User session or NextResponse with 401 error
 */
export async function requireAuth() {
    const session = await auth()

    if (!session?.user?.id) {
        return {
            error: NextResponse.json(
                { error: "Unauthorized - Please sign in" },
                { status: 401 }
            ),
            session: null
        }
    }

    return {
        error: null,
        session
    }
}

/**
 * Check if the current user has the required role
 * @param requiredRole - The role required to access the resource
 * @returns User session or NextResponse with 403 error
 */
export async function requireRole(requiredRole: UserRole | UserRole[]) {
    const { error, session } = await requireAuth()

    if (error) {
        return { error, session: null }
    }

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]

    if (!session || !roles.includes(session.user.role as UserRole)) {
        return {
            error: NextResponse.json(
                { error: "Forbidden - Insufficient permissions" },
                { status: 403 }
            ),
            session: null
        }
    }

    return {
        error: null,
        session
    }
}

/**
 * Check if the current user is an admin
 * @returns User session or NextResponse with 403 error
 */
export async function requireAdmin() {
    return await requireRole(["ADMIN", "SUPER_ADMIN"])
}

/**
 * Validate that the user can only access their own resources
 * @param resourceUserId - The user ID of the resource owner
 * @returns boolean indicating if access is allowed
 */
export async function canAccessUserResource(resourceUserId: string) {
    const session = await auth()

    if (!session?.user?.id) {
        return false
    }

    // Admins can access any resource
    if (session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN") {
        return true
    }

    // Users can only access their own resources
    return session.user.id === resourceUserId
}

/**
 * Sanitize user input to prevent injection attacks
 * @param input - The input to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
        return ''
    }

    // Remove null bytes and trim
    return input.replace(/\0/g, '').trim()
}

/**
 * Validate email format
 * @param email - Email to validate
 * @returns boolean indicating if email is valid
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 255
}

/**
 * Rate limiting helper (basic implementation)
 * In production, use a proper rate limiting library like @upstash/ratelimit
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
    identifier: string,
    limit: number = 10,
    windowMs: number = 60000
): { allowed: boolean; remaining: number } {
    const now = Date.now()
    const record = requestCounts.get(identifier)

    if (!record || now > record.resetTime) {
        requestCounts.set(identifier, {
            count: 1,
            resetTime: now + windowMs
        })
        return { allowed: true, remaining: limit - 1 }
    }

    if (record.count >= limit) {
        return { allowed: false, remaining: 0 }
    }

    record.count++
    return { allowed: true, remaining: limit - record.count }
}

/**
 * Log security events for monitoring
 * @param event - The security event to log
 * @param details - Additional details about the event
 */
export function logSecurityEvent(
    event: string,
    details: Record<string, any>
) {
    const timestamp = new Date().toISOString()
    console.log(`[SECURITY] ${timestamp} - ${event}`, JSON.stringify(details))

    // In production, send to a proper logging service
    // Example: Send to DataDog, Sentry, CloudWatch, etc.
}

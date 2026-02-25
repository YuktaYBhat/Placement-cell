/**
 * Utility to get the full URL of a document stored in Cloudflare R2
 * Handles paths, full URLs with old R2 domains, and prepends the custom domain.
 */
export function getDocumentUrl(path: string | null | undefined, baseUrl?: string): string {
    if (!path) return ""

    // Use the provided baseUrl, or fallback to environment variables
    const domain = baseUrl ||
        process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_DOMAIN ||
        process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN ||
        "https://documents.yourdomain.com"

    const cleanDomain = domain.replace(/\/$/, "")

    let extractedPath = path
    if (path.includes("://")) {
        // Extract the path starting from /users/ if present, otherwise extract after the domain
        const usersIndex = path.indexOf("/users/")
        if (usersIndex !== -1) {
            extractedPath = path.substring(usersIndex + 1)
        } else {
            const parts = path.split("/")
            if (parts.length > 3) {
                extractedPath = parts.slice(3).join("/")
            }
        }
    }

    const cleanPath = extractedPath.startsWith("/") ? extractedPath.substring(1) : extractedPath

    // Simple concatenation
    return `${cleanDomain}/${cleanPath}`
}

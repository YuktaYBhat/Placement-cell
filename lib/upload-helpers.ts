import { toast } from "sonner"

export interface UploadResponse {
  success: boolean
  url?: string
  key?: string
  filename?: string
  type?: string
  message?: string
  error?: string
}

export interface UploadOptions {
  maxSize?: number // in bytes
  allowedTypes?: readonly string[]
  onProgress?: (progress: number) => void
}

/**
 * Upload a file to Cloudflare R2 storage
 */
export async function uploadFile(
  file: File,
  type: string,
  options: UploadOptions = {}
): Promise<UploadResponse> {
  try {
    // Default validation
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ["image/*", "application/pdf"],
    } = options

    // Validate file type
    const isAllowedType = allowedTypes.some(allowedType => {
      if (allowedType.endsWith("/*")) {
        const category = allowedType.replace("/*", "")
        return file.type.startsWith(category + "/")
      }
      return file.type === allowedType
    })

    if (!isAllowedType) {
      const errorMsg = `Invalid file type. Allowed: ${allowedTypes.join(", ")}`
      toast.error(errorMsg)
      return { success: false, error: errorMsg }
    }

    // Validate file size
    if (file.size > maxSize) {
      const sizeMB = Math.round(maxSize / (1024 * 1024))
      const errorMsg = `File size must be less than ${sizeMB}MB`
      toast.error(errorMsg)
      return { success: false, error: errorMsg }
    }

    // Create form data
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", type)

    // Upload with progress tracking
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    const result: UploadResponse = await response.json()

    if (response.ok && result.success) {
      toast.success(result.message || "File uploaded successfully!")
      return result
    } else {
      const errorMsg = result.error || "Failed to upload file"
      toast.error(errorMsg)
      return { success: false, error: errorMsg }
    }
  } catch (error) {
    console.error("Upload error:", error)
    const errorMsg = "Something went wrong uploading the file"
    toast.error(errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Delete a file from Cloudflare R2 storage
 */
export async function deleteFile(key: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/delete-file?key=${encodeURIComponent(key)}`, {
      method: "DELETE",
    })

    const result = await response.json()

    if (response.ok && result.success) {
      toast.success("File deleted successfully!")
      return true
    } else {
      toast.error(result.error || "Failed to delete file")
      return false
    }
  } catch (error) {
    console.error("Delete error:", error)
    toast.error("Something went wrong deleting the file")
    return false
  }
}

/**
 * File type configurations for different upload types
 */
export const FILE_UPLOAD_CONFIGS = {
  "profile-photo": {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  "resume": {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  },
  "tenthMarksCard": {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
  "twelfthMarksCard": {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
  "diplomaMarksCard": {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
  "degreeMarksCard": {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
  "transcript": {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["application/pdf"],
  },
  "passport": {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
  "aadharCard": {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
  "panCard": {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
  },
} as const

/**
 * Get upload configuration for a specific file type
 */
export function getUploadConfig(type: keyof typeof FILE_UPLOAD_CONFIGS) {
  return FILE_UPLOAD_CONFIGS[type] || {
    maxSize: 10 * 1024 * 1024,
    allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
  }
}

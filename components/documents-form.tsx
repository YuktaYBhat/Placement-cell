"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DocumentUpload } from "@/components/ui/document-upload"
import { toast } from "sonner"
import { Loader2, Save, ExternalLink } from "lucide-react"
import { getDocumentUrl } from "@/lib/document-utils"

interface DocumentsFormProps {
    profile: any
    document: any // Type from Prisma Client
    publicDomain?: string
}

export function DocumentsForm({ profile, document, publicDomain }: DocumentsFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // Initialize state from Document model if available, else Profile model
    const [formData, setFormData] = useState({
        usn: document?.usn || profile?.usn || "",
        cgpa: document?.cgpa || profile?.finalCgpa || "",

        // URLs
        tenthMarksCardLink: document?.tenthMarksCardLink || null,
        twelfthMarksCardLink: document?.twelfthMarksCardLink || null,
        sem1Link: document?.sem1Link || null,
        sem2Link: document?.sem2Link || null,
        sem3Link: document?.sem3Link || null,
        sem4Link: document?.sem4Link || null,
        sem5Link: document?.sem5Link || null,
        sem6Link: document?.sem6Link || null,
        sem7Link: document?.sem7Link || null,
        sem8Link: document?.sem8Link || null,
    })

    // Separate state for files to upload
    const [files, setFiles] = useState<{ [key: string]: File | null }>({
        tenthMarksCardLink: null,
        twelfthMarksCardLink: null,
        sem1Link: null,
        sem2Link: null,
        sem3Link: null,
        sem4Link: null,
        sem5Link: null,
        sem6Link: null,
        sem7Link: null,
        sem8Link: null,
    })

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleFileChange = (field: string, file: File | null) => {
        setFiles(prev => ({ ...prev, [field]: file }))
    }

    const uploadFile = async (file: File, type: string) => {
        const uploadFormData = new FormData()
        uploadFormData.append("file", file)
        uploadFormData.append("type", "academic-document") // Generic type for now

        const res = await fetch("/api/upload", {
            method: "POST",
            body: uploadFormData
        })

        if (!res.ok) throw new Error(`Failed to upload ${type}`)

        const data = await res.json()
        return data.url
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.usn) {
            toast.error("Required Field", { description: "USN is required" })
            return
        }

        setLoading(true)
        const updatedUrls: any = {}

        try {
            // Upload all modified files sequentially
            for (const [key, file] of Object.entries(files)) {
                if (file) {
                    try {
                        const url = await uploadFile(file, key)
                        updatedUrls[key] = url
                    } catch (err) {
                        console.error(`Upload failed for ${key}`, err)
                        toast.error("Upload Failed", { description: `Failed to upload document for ${key}` })
                        setLoading(false)
                        return
                    }
                }
            }

            // Prepare final payload
            const payload = {
                ...formData,
                ...updatedUrls,
            }

            // Save to database
            const res = await fetch("/api/documents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })

            if (!res.ok) throw new Error("Failed to save documents")

            toast.success("Success", {
                description: "Documents and details saved successfully."
            })

            // Update local state with new URLs and clear files
            setFormData(prev => ({ ...prev, ...updatedUrls }))
            setFiles({
                tenthMarksCardLink: null,
                twelfthMarksCardLink: null,
                sem1Link: null,
                sem2Link: null,
                sem3Link: null,
                sem4Link: null,
                sem5Link: null,
                sem6Link: null,
                sem7Link: null,
                sem8Link: null,
            })

            router.refresh()

        } catch (error) {
            console.error(error)
            toast.error("Error", {
                description: "Something went wrong. Please try again."
            })
        } finally {
            setLoading(false)
        }
    }

    const renderUploadField = (label: string, fieldKey: string) => (
        <div className="space-y-2 border p-4 rounded-lg bg-card">
            <div className="flex justify-between items-start">
                <Label className="text-base font-medium">{label}</Label>
                {(formData as any)[fieldKey] && (
                    <a
                        href={getDocumentUrl((formData as any)[fieldKey], publicDomain)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs flex items-center text-blue-600 hover:underline"
                    >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View Current
                    </a>
                )}
            </div>

            <DocumentUpload
                onFileChange={(file) => handleFileChange(fieldKey, file)}
                accept="application/pdf,image/jpeg,image/png"
                maxSizeMB={10}
                label={`Upload ${label}`}
                // Required only if no existing URL and it's a critical doc? User didn't specify strict requiredness for all, 
                // but for "Fix missing values", we should encourage it. Left optional for now to allow partial saves.
                required={false}
                initialFile={files[fieldKey]}
                description="PDF/JPG/PNG (Max 10MB)"
            />
            {(formData as any)[fieldKey] && !files[fieldKey] && (
                <div className="text-xs text-green-600 flex items-center mt-1">
                    ✓ Document uploaded
                </div>
            )}
        </div>
    )

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="usn">University Seat Number (USN) *</Label>
                    <Input
                        id="usn"
                        value={formData.usn}
                        onChange={(e) => handleInputChange("usn", e.target.value)}
                        placeholder="e.g. 2SD22CS001"
                        disabled={loading}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="cgpa">Current CGPA</Label>
                    <Input
                        id="cgpa"
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={formData.cgpa}
                        onChange={(e) => handleInputChange("cgpa", e.target.value)}
                        placeholder="0.00"
                        disabled={loading}
                    />
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Previous Education</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderUploadField("10th Marks Card", "tenthMarksCardLink")}
                    {renderUploadField("12th / Diploma Marks Card", "twelfthMarksCardLink")}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Semester Marks Cards</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {renderUploadField("Sem 1 Marks Card", "sem1Link")}
                    {renderUploadField("Sem 2 Marks Card", "sem2Link")}
                    {renderUploadField("Sem 3 Marks Card", "sem3Link")}
                    {renderUploadField("Sem 4 Marks Card", "sem4Link")}
                    {renderUploadField("Sem 5 Marks Card", "sem5Link")}
                    {renderUploadField("Sem 6 Marks Card", "sem6Link")}
                    {renderUploadField("Sem 7 Marks Card", "sem7Link")}
                    {renderUploadField("Sem 8 Marks Card", "sem8Link")}
                </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full md:w-auto min-w-[200px]">
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving & Uploading...
                    </>
                ) : (
                    <>
                        <Save className="mr-2 h-4 w-4" />
                        Save All Documents
                    </>
                )}
            </Button>
        </form>
    )
}

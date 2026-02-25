"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { JobForm } from "@/components/admin/job-form"
import { toast } from "sonner"

export default function NewJobPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (data: any) => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/admin/jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })

            if (response.ok) {
                toast.success("Job created successfully!")
                router.push('/admin/jobs')
                router.refresh()
            } else {
                const error = await response.json()
                toast.error(error.error || "Failed to create job")
            }
        } catch (error) {
            console.error('Error creating job:', error)
            toast.error("An unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="container mx-auto py-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Create New Job Posting</h1>
                <p className="text-muted-foreground mt-2">
                    Fill in the details below to post a new job opportunity for students
                </p>
            </div>

            <JobForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
    )
}

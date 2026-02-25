"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { JobForm } from "@/components/admin/job-form"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

export default function EditJobPage() {
    const router = useRouter()
    const params = useParams()
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [jobData, setJobData] = useState<any>(null)

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const response = await fetch(`/api/admin/jobs/${params.id}`)
                if (response.ok) {
                    const data = await response.json()
                    // Format dates for form inputs
                    const job = data.job
                    setJobData({
                        ...job,
                        deadline: job.deadline ? new Date(job.deadline).toISOString().slice(0, 16) : "",
                        startDate: job.startDate ? new Date(job.startDate).toISOString().slice(0, 10) : "",
                    })
                } else {
                    toast.error("Failed to fetch job details")
                    router.push('/admin/jobs')
                }
            } catch (error) {
                console.error('Error fetching job:', error)
                toast.error("An unexpected error occurred")
                router.push('/admin/jobs')
            } finally {
                setIsFetching(false)
            }
        }

        fetchJob()
    }, [params.id, router])

    const handleSubmit = async (data: any) => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/admin/jobs', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: params.id, ...data }),
            })

            if (response.ok) {
                toast.success("Job updated successfully!")
                router.push('/admin/jobs')
                router.refresh()
            } else {
                const error = await response.json()
                toast.error(error.error || "Failed to update job")
            }
        } catch (error) {
            console.error('Error updating job:', error)
            toast.error("An unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    if (isFetching) {
        return (
            <div className="container mx-auto py-6 max-w-4xl space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-6 w-96" />
                <Skeleton className="h-[600px] w-full" />
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Edit Job Posting</h1>
                <p className="text-muted-foreground mt-2">
                    Update the job details below
                </p>
            </div>

            <JobForm
                initialData={jobData}
                onSubmit={handleSubmit}
                isLoading={isLoading}
            />
        </div>
    )
}

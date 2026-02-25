"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { MoreHorizontal, CheckCircle, XCircle, Calendar, UserCheck, Clock } from "lucide-react"

interface ApplicantActionsProps {
    applicationId: string
    currentStatus: string
}

const statusTransitions: Record<string, { label: string; icon: any; newStatus: string }[]> = {
    APPLIED: [
        { label: "Shortlist", icon: UserCheck, newStatus: "SHORTLISTED" },
        { label: "Reject", icon: XCircle, newStatus: "REJECTED" },
    ],
    SHORTLISTED: [
        { label: "Schedule Interview", icon: Calendar, newStatus: "INTERVIEW_SCHEDULED" },
        { label: "Reject", icon: XCircle, newStatus: "REJECTED" },
    ],
    INTERVIEW_SCHEDULED: [
        { label: "Mark Interviewed", icon: Clock, newStatus: "INTERVIEWED" },
        { label: "Reject", icon: XCircle, newStatus: "REJECTED" },
    ],
    INTERVIEWED: [
        { label: "Select", icon: CheckCircle, newStatus: "SELECTED" },
        { label: "Reject", icon: XCircle, newStatus: "REJECTED" },
    ],
    SELECTED: [
        { label: "Offer Accepted", icon: CheckCircle, newStatus: "OFFER_ACCEPTED" },
        { label: "Offer Rejected", icon: XCircle, newStatus: "OFFER_REJECTED" },
    ],
}

export function ApplicantActions({ applicationId, currentStatus }: ApplicantActionsProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedAction, setSelectedAction] = useState<{ label: string; newStatus: string } | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [feedback, setFeedback] = useState("")
    const [interviewDate, setInterviewDate] = useState("")

    const availableActions = statusTransitions[currentStatus] || []

    const handleAction = (action: { label: string; newStatus: string }) => {
        setSelectedAction(action)
        setIsDialogOpen(true)
    }

    const confirmAction = async () => {
        if (!selectedAction) return

        setIsLoading(true)
        try {
            const response = await fetch(`/api/admin/applications/${applicationId}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status: selectedAction.newStatus,
                    feedback,
                    interviewDate: interviewDate ? new Date(interviewDate).toISOString() : undefined,
                }),
            })

            if (response.ok) {
                toast.success(`Application ${selectedAction.label.toLowerCase()}ed successfully`)
                setIsDialogOpen(false)
                setFeedback("")
                setInterviewDate("")
                // Refresh the page to show updated status
                window.location.reload()
            } else {
                const error = await response.json()
                toast.error(error.error || "Failed to update application status")
            }
        } catch (error) {
            console.error("Error updating status:", error)
            toast.error("An unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    if (availableActions.length === 0) {
        return null
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {availableActions.map((action, index) => (
                        <DropdownMenuItem
                            key={action.newStatus}
                            onClick={() => handleAction(action)}
                            className={action.newStatus === "REJECTED" ? "text-red-600" : ""}
                        >
                            <action.icon className="w-4 h-4 mr-2" />
                            {action.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedAction?.label} Applicant</DialogTitle>
                        <DialogDescription>
                            {selectedAction?.newStatus === "REJECTED"
                                ? "This action will reject the applicant. You can add feedback below."
                                : selectedAction?.newStatus === "INTERVIEW_SCHEDULED"
                                    ? "Schedule an interview with this applicant."
                                    : `Update the application status to ${selectedAction?.newStatus?.replace(/_/g, " ").toLowerCase()}.`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {selectedAction?.newStatus === "INTERVIEW_SCHEDULED" && (
                            <div className="space-y-2">
                                <Label htmlFor="interviewDate">Interview Date & Time</Label>
                                <Input
                                    id="interviewDate"
                                    type="datetime-local"
                                    value={interviewDate}
                                    onChange={(e) => setInterviewDate(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="feedback">
                                {selectedAction?.newStatus === "REJECTED" ? "Rejection Reason (Optional)" : "Feedback (Optional)"}
                            </Label>
                            <Textarea
                                id="feedback"
                                placeholder={
                                    selectedAction?.newStatus === "REJECTED"
                                        ? "Provide a reason for rejection..."
                                        : "Add any notes or feedback..."
                                }
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmAction}
                            disabled={isLoading}
                            variant={selectedAction?.newStatus === "REJECTED" ? "destructive" : "default"}
                        >
                            {isLoading ? "Processing..." : "Confirm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

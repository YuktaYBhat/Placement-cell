"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { RichTextEditor } from "@/components/rich-text-editor"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Trash2 } from "lucide-react"

interface JobFormData {
    id?: string
    title: string
    companyName: string
    description: string
    location: string
    jobType: string
    workMode: string
    tier: string
    category: string
    isDreamOffer: boolean
    salary: number
    minCGPA?: number | null
    allowedBranches?: string[] | null
    eligibleBatch?: string | null
    maxBacklogs?: number | null
    deadline?: string
    startDate?: string
    noOfPositions?: number
    status: string
    isVisible: boolean
    customFields?: {
        id?: string
        label: string
        type: "TEXT" | "NUMBER" | "DROPDOWN" | "BOOLEAN" | "FILE_UPLOAD" | "TEXTAREA"
        required: boolean
        options?: string[]
    }[]
}

interface JobFormProps {
    initialData?: Partial<JobFormData>
    onSubmit: (data: JobFormData) => Promise<void>
    isLoading?: boolean
}

const branches = [
    { value: "CSE", label: "Computer Science" },
    { value: "ISE", label: "Information Science" },
    { value: "ECE", label: "Electronics & Communication" },
    { value: "EEE", label: "Electrical & Electronics" },
    { value: "ME", label: "Mechanical" },
    { value: "CE", label: "Civil" },
    { value: "CHE", label: "Chemical" },
    { value: "BT", label: "Biotechnology" },
    { value: "IE", label: "Industrial Engineering" },
    { value: "AIML", label: "AI & Machine Learning" },
]

export function JobForm({ initialData, onSubmit, isLoading = false }: JobFormProps) {
    const router = useRouter()

    // Checkbox states for optional fields
    const [hasMinCGPA, setHasMinCGPA] = useState(!!initialData?.minCGPA)
    const [hasMaxBacklogs, setHasMaxBacklogs] = useState(initialData?.maxBacklogs !== undefined && initialData?.maxBacklogs !== null)
    const [hasEligibleBatch, setHasEligibleBatch] = useState(!!initialData?.eligibleBatch)
    const [hasAllowedBranches, setHasAllowedBranches] = useState(!!initialData?.allowedBranches && initialData.allowedBranches.length > 0)

    const [formData, setFormData] = useState<JobFormData>({
        title: initialData?.title || "",
        companyName: initialData?.companyName || "",
        description: initialData?.description || "",
        location: initialData?.location || "",
        jobType: initialData?.jobType || "FULL_TIME",
        workMode: initialData?.workMode || "OFFICE",
        tier: initialData?.tier || "TIER_3",
        category: initialData?.category || "FTE",
        isDreamOffer: initialData?.isDreamOffer || false,
        salary: initialData?.salary || 0,
        minCGPA: initialData?.minCGPA,
        allowedBranches: initialData?.allowedBranches || [],
        eligibleBatch: initialData?.eligibleBatch || "",
        maxBacklogs: initialData?.maxBacklogs,
        deadline: initialData?.deadline || "",
        startDate: initialData?.startDate || "",
        noOfPositions: initialData?.noOfPositions || 1,
        status: initialData?.status || "DRAFT",
        isVisible: initialData?.isVisible ?? true,
        customFields: initialData?.customFields || [],
    })

    const addCustomField = () => {
        setFormData(prev => ({
            ...prev,
            customFields: [
                ...(prev.customFields || []),
                { label: "", type: "TEXT", required: false, options: [] }
            ]
        }))
    }

    const removeCustomField = (index: number) => {
        setFormData(prev => ({
            ...prev,
            customFields: prev.customFields?.filter((_, i) => i !== index)
        }))
    }

    const updateCustomField = (index: number, updates: any) => {
        setFormData(prev => {
            const fields = [...(prev.customFields || [])]
            fields[index] = { ...fields[index], ...updates }
            return { ...prev, customFields: fields }
        })
    }

    const addOptionToField = (fieldIndex: number, option: string) => {
        if (!option.trim()) return
        const fields = [...(formData.customFields || [])]
        const currentOptions = fields[fieldIndex].options || []
        fields[fieldIndex].options = [...currentOptions, option.trim()]
        setFormData(prev => ({ ...prev, customFields: fields }))
    }

    const removeOptionFromField = (fieldIndex: number, optionIndex: number) => {
        const fields = [...(formData.customFields || [])]
        fields[fieldIndex].options = fields[fieldIndex].options?.filter((_, i) => i !== optionIndex)
        setFormData(prev => ({ ...prev, customFields: fields }))
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Prepare data with nulls for unchecked fields
        const submissionData = {
            ...formData,
            minCGPA: hasMinCGPA ? formData.minCGPA : null,
            maxBacklogs: hasMaxBacklogs ? formData.maxBacklogs : null,
            eligibleBatch: hasEligibleBatch ? formData.eligibleBatch : null,
            allowedBranches: hasAllowedBranches ? formData.allowedBranches : null
        }

        await onSubmit(submissionData)
    }


    const toggleBranch = (branchValue: string) => {
        const currentBranches = formData.allowedBranches || []
        setFormData(prev => ({
            ...prev,
            allowedBranches: currentBranches.includes(branchValue)
                ? currentBranches.filter(b => b !== branchValue)
                : [...currentBranches, branchValue]
        }))
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Provide the basic details about the job posting</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Job Title *</Label>
                            <Input
                                id="title"
                                required
                                placeholder="e.g., Software Engineer"
                                value={formData.title}
                                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Company Name *</Label>
                            <Input
                                id="companyName"
                                required
                                placeholder="e.g., Google"
                                value={formData.companyName}
                                onChange={e => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="location">Location *</Label>
                            <Input
                                id="location"
                                required
                                placeholder="e.g., Bangalore, Karnataka"
                                value={formData.location}
                                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="jobType">Job Type *</Label>
                            <Select
                                value={formData.jobType}
                                onValueChange={value => setFormData(prev => ({ ...prev, jobType: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FULL_TIME">Full Time</SelectItem>
                                    <SelectItem value="PART_TIME">Part Time</SelectItem>
                                    <SelectItem value="INTERNSHIP">Internship</SelectItem>
                                    <SelectItem value="CONTRACT">Contract</SelectItem>
                                    <SelectItem value="FREELANCE">Freelance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="workMode">Work Mode *</Label>
                            <Select
                                value={formData.workMode}
                                onValueChange={value => setFormData(prev => ({ ...prev, workMode: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="OFFICE">Office</SelectItem>
                                    <SelectItem value="REMOTE">Remote</SelectItem>
                                    <SelectItem value="HYBRID">Hybrid</SelectItem>
                                    <SelectItem value="FLEXIBLE">Flexible</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Job Description *</Label>
                        <RichTextEditor
                            content={formData.description}
                            onChange={content => setFormData(prev => ({ ...prev, description: content }))}
                            placeholder="Describe the role, responsibilities, and requirements..."
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Eligibility Criteria */}
            <Card>
                <CardHeader>
                    <CardTitle>Eligibility Criteria</CardTitle>
                    <CardDescription>Define the eligibility requirements for students (Optional)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* CGPA */}
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="hasMinCGPA"
                                checked={hasMinCGPA}
                                onCheckedChange={checked => setHasMinCGPA(checked as boolean)}
                            />
                            <Label htmlFor="hasMinCGPA" className="cursor-pointer font-medium">
                                Set Minimum CGPA Requirement
                            </Label>
                        </div>
                        {hasMinCGPA && (
                            <div className="pl-6 animate-in fade-in slide-in-from-top-2 duration-200">
                                <Label htmlFor="minCGPA">Minimum CGPA</Label>
                                <Input
                                    id="minCGPA"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="10"
                                    placeholder="e.g., 7.0"
                                    value={formData.minCGPA || ""}
                                    onChange={e => setFormData(prev => ({ ...prev, minCGPA: e.target.value ? parseFloat(e.target.value) : undefined }))}
                                    className="max-w-xs mt-1.5"
                                />
                            </div>
                        )}
                    </div>

                    {/* Backlogs */}
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="hasMaxBacklogs"
                                checked={hasMaxBacklogs}
                                onCheckedChange={checked => setHasMaxBacklogs(checked as boolean)}
                            />
                            <Label htmlFor="hasMaxBacklogs" className="cursor-pointer font-medium">
                                Set Maximum Backlogs Requirement
                            </Label>
                        </div>
                        {hasMaxBacklogs && (
                            <div className="pl-6 animate-in fade-in slide-in-from-top-2 duration-200">
                                <Label htmlFor="maxBacklogs">Maximum Active Backlogs Allowed</Label>
                                <Input
                                    id="maxBacklogs"
                                    type="number"
                                    min="0"
                                    placeholder="e.g., 0"
                                    value={formData.maxBacklogs !== undefined && formData.maxBacklogs !== null ? formData.maxBacklogs : ""}
                                    onChange={e => setFormData(prev => ({ ...prev, maxBacklogs: e.target.value ? parseInt(e.target.value) : 0 }))}
                                    className="max-w-xs mt-1.5"
                                />
                            </div>
                        )}
                    </div>

                    {/* Batch */}
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="hasEligibleBatch"
                                checked={hasEligibleBatch}
                                onCheckedChange={checked => setHasEligibleBatch(checked as boolean)}
                            />
                            <Label htmlFor="hasEligibleBatch" className="cursor-pointer font-medium">
                                Set Eligible Batch Requirement
                            </Label>
                        </div>
                        {hasEligibleBatch && (
                            <div className="pl-6 animate-in fade-in slide-in-from-top-2 duration-200">
                                <Label htmlFor="eligibleBatch">Eligible Batch Year</Label>
                                <Input
                                    id="eligibleBatch"
                                    placeholder="e.g., 2024"
                                    value={formData.eligibleBatch || ""}
                                    onChange={e => setFormData(prev => ({ ...prev, eligibleBatch: e.target.value }))}
                                    className="max-w-xs mt-1.5"
                                />
                            </div>
                        )}
                    </div>

                    {/* Branches */}
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="hasAllowedBranches"
                                checked={hasAllowedBranches}
                                onCheckedChange={checked => setHasAllowedBranches(checked as boolean)}
                            />
                            <Label htmlFor="hasAllowedBranches" className="cursor-pointer font-medium">
                                Set Allowed Branches Requirement
                            </Label>
                        </div>
                        {hasAllowedBranches && (
                            <div className="pl-6 animate-in fade-in slide-in-from-top-2 duration-200">
                                <Label className="mb-2 block">Allowed Branches</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {branches.map(branch => (
                                        <div key={branch.value} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`branch-${branch.value}`}
                                                checked={(formData.allowedBranches || []).includes(branch.value)}
                                                onCheckedChange={() => toggleBranch(branch.value)}
                                            />
                                            <Label
                                                htmlFor={`branch-${branch.value}`}
                                                className="text-sm font-normal cursor-pointer"
                                            >
                                                {branch.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Placement Tier & Category */}
            <Card>
                <CardHeader>
                    <CardTitle>Placement Tier & Category</CardTitle>
                    <CardDescription>Set the placement tier and job category</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="salary">Salary (LPA) *</Label>
                            <Input
                                id="salary"
                                type="number"
                                step="0.1"
                                min="0"
                                required
                                placeholder="e.g., 8.5"
                                value={formData.salary || ""}
                                onChange={e => setFormData(prev => ({ ...prev, salary: e.target.value ? parseFloat(e.target.value) : 0 }))}
                            />
                            <p className="text-xs text-muted-foreground">
                                Tier auto-calculated: ≤5 LPA = Tier 3, 5-9 LPA = Tier 2, &gt;9 LPA = Tier 1
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tier">Placement Tier</Label>
                            <Select
                                value={formData.tier}
                                onValueChange={value => setFormData(prev => ({ ...prev, tier: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TIER_3">Tier 3 (≤5 LPA)</SelectItem>
                                    <SelectItem value="TIER_2">Tier 2 (5-9 LPA)</SelectItem>
                                    <SelectItem value="TIER_1">Tier 1 (&gt;9 LPA)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Job Category *</Label>
                            <Select
                                value={formData.category}
                                onValueChange={value => setFormData(prev => ({ ...prev, category: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TRAINING_INTERNSHIP">Training + Internship</SelectItem>
                                    <SelectItem value="INTERNSHIP">Internship</SelectItem>
                                    <SelectItem value="FTE">Full Time Employment</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isDreamOffer"
                            checked={formData.isDreamOffer}
                            onCheckedChange={checked => setFormData(prev => ({ ...prev, isDreamOffer: checked as boolean }))}
                        />
                        <Label htmlFor="isDreamOffer" className="cursor-pointer">
                            Mark as Dream Offer (&gt;10 LPA, allows Tier 3 students to apply)
                        </Label>
                    </div>
                </CardContent>
            </Card>


            {/* Application Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Application Details</CardTitle>
                    <CardDescription>Set deadlines and other application details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="deadline">Application Deadline</Label>
                            <Input
                                id="deadline"
                                type="datetime-local"
                                value={formData.deadline}
                                onChange={e => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Expected Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="noOfPositions">Number of Positions</Label>
                            <Input
                                id="noOfPositions"
                                type="number"
                                min="1"
                                placeholder="e.g., 5"
                                value={formData.noOfPositions}
                                onChange={e => setFormData(prev => ({ ...prev, noOfPositions: e.target.value ? parseInt(e.target.value) : 1 }))}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Custom Application Fields */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Custom Application Fields</CardTitle>
                        <CardDescription>Add extra questions students need to answer when applying</CardDescription>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addCustomField}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Field
                    </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                    {formData.customFields && formData.customFields.length > 0 ? (
                        formData.customFields.map((field, index) => (
                            <div key={index} className="p-4 border rounded-lg space-y-4 relative bg-muted/30">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-2 right-2 text-destructive"
                                    onClick={() => removeCustomField(index)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                    <div className="space-y-2">
                                        <Label>Field Label *</Label>
                                        <Input
                                            placeholder="e.g., Why do you want to join us?"
                                            value={field.label}
                                            onChange={(e) => updateCustomField(index, { label: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Field Type</Label>
                                        <Select
                                            value={field.type}
                                            onValueChange={(val) => updateCustomField(index, { type: val as any })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="TEXT">Short Text</SelectItem>
                                                <SelectItem value="TEXTAREA">Long Text</SelectItem>
                                                <SelectItem value="NUMBER">Number</SelectItem>
                                                <SelectItem value="DROPDOWN">Dropdown Menu</SelectItem>
                                                <SelectItem value="BOOLEAN">Checkbox (Yes/No)</SelectItem>
                                                <SelectItem value="FILE_UPLOAD">File Upload</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`req-${index}`}
                                        checked={field.required}
                                        onCheckedChange={(checked) => updateCustomField(index, { required: !!checked })}
                                    />
                                    <Label htmlFor={`req-${index}`} className="cursor-pointer">Required field</Label>
                                </div>

                                {field.type === "DROPDOWN" && (
                                    <div className="space-y-2 pl-6 border-l-2">
                                        <Label>Dropdown Options</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id={`opt-input-${index}`}
                                                placeholder="Add an option"
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const input = e.currentTarget;
                                                        if (input.value) {
                                                            addOptionToField(index, input.value);
                                                            input.value = "";
                                                        }
                                                    }
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    const input = document.getElementById(`opt-input-${index}`) as HTMLInputElement;
                                                    if (input.value) {
                                                        addOptionToField(index, input.value);
                                                        input.value = "";
                                                    }
                                                }}
                                            >
                                                Add
                                            </Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {field.options?.map((opt, optIdx) => (
                                                <Badge key={optIdx} variant="secondary" className="flex items-center gap-1">
                                                    {opt}
                                                    <X
                                                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                                                        onClick={() => removeOptionFromField(index, optIdx)}
                                                    />
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/20">
                            <p className="text-sm text-muted-foreground italic">No custom fields added yet. Students will only see the default application form.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Status & Visibility */}
            <Card>
                <CardHeader>
                    <CardTitle>Status & Visibility</CardTitle>
                    <CardDescription>Control job posting status and visibility</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={value => setFormData(prev => ({ ...prev, status: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DRAFT">Draft</SelectItem>
                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                    <SelectItem value="CLOSED">Closed</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 flex items-center pt-6">
                            <Checkbox
                                id="isVisible"
                                checked={formData.isVisible}
                                onCheckedChange={checked => setFormData(prev => ({ ...prev, isVisible: checked as boolean }))}
                            />
                            <Label htmlFor="isVisible" className="ml-2 cursor-pointer">
                                Make this job visible to students
                            </Label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isLoading}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : initialData?.id ? "Update Job" : "Create Job"}
                </Button>
            </div>
        </form>
    )
}
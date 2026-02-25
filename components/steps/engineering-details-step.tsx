"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DatePicker } from "@/components/ui/date-picker"
import { DocumentUpload } from "@/components/ui/document-upload"
import { ArrowLeft, AlertCircle, Plus, Trash2, Upload } from "lucide-react"

interface SemesterData {
  semester: number
  sgpa: string
  cgpa: string
  monthPassed: string
  yearPassed: string
  marksCard: File | null
  failed: boolean
  failedSubjects: string[]
}

interface BacklogData {
  code: string
  title: string
}

interface EngineeringFormData {
  collegeName: string
  district: string
  pincode: string
  branch: string
  entryType: string
  seatCategory: string
  gender: string
  usn: string
  libraryId: string
  batch: string
  branchMentor: string
  linkedinLink: string
  githubLink: string
  leetcodeLink: string
  resumeUpload: File | null
  semesters: SemesterData[]
  finalCgpa: string
  hasBacklogs: string
  backlogs: BacklogData[]
}

interface EngineeringDetailsStepProps {
  onNext: (data: EngineeringFormData) => void
  onPrevious: () => void
  initialData?: Partial<EngineeringFormData>
}

export function EngineeringDetailsStep({ onNext, onPrevious, initialData = {} }: EngineeringDetailsStepProps) {
  const [formData, setFormData] = useState<EngineeringFormData>({
    collegeName: "SHRI DHARMASTHALA MANJUNATHESHWARA COLLEGE OF ENGINEERING AND TECHNOLOGY",
    district: "DHARWAD",
    pincode: "580002",
    branch: initialData.branch || "",
    entryType: initialData.entryType || "",
    seatCategory: initialData.seatCategory || "",
    gender: initialData.gender || "",
    usn: initialData.usn || "",
    libraryId: initialData.libraryId || "",
    batch: "2022 - 2026",
    branchMentor: initialData.branchMentor || "",
    linkedinLink: initialData.linkedinLink || "",
    githubLink: initialData.githubLink || "",
    leetcodeLink: initialData.leetcodeLink || "",
    resumeUpload: initialData.resumeUpload || null,
    semesters:
      initialData.semesters ||
      Array.from({ length: 6 }, (_, i): SemesterData => ({
        semester: i + 1,
        sgpa: "",
        cgpa: "",
        monthPassed: "",
        yearPassed: "",
        marksCard: null,
        failed: false,
        failedSubjects: [],
      })),
    finalCgpa: initialData.finalCgpa || "",
    hasBacklogs: initialData.hasBacklogs || "",
    backlogs: initialData.backlogs || [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({})

  const uploadFile = async (file: File, type: string) => {
    const formDataToUpload = new FormData()
    formDataToUpload.append("file", file)
    formDataToUpload.append("type", type)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formDataToUpload,
    })

    if (!response.ok) {
      throw new Error("Upload failed")
    }

    const result = await response.json()
    return result.url
  }

  const handleFileUpload = async (field: string, file: File | null) => {
    if (!file) {
      handleInputChange(field, null)
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, [field]: "File size must be less than 20MB" }))
      return
    }

    setIsUploading((prev) => ({ ...prev, [field]: true }))
    setErrors((prev) => ({ ...prev, [field]: "" }))

    try {
      const uploadType = field === "resumeUpload" ? "resume" : field
      const url = await uploadFile(file, uploadType)
      handleInputChange(field, url)
    } catch (error) {
      console.error(`Upload failed for ${field}:`, error)
      setErrors((prev) => ({ ...prev, [field]: "Failed to upload document. Please try again." }))
    } finally {
      setIsUploading((prev) => ({ ...prev, [field]: false }))
    }
  }

  const handleMarksCardUpload = async (semesterIndex: number, file: File | null) => {
    if (!file) {
      handleSemesterChange(semesterIndex, "marksCard", null)
      return
    }

    const fieldKey = `sem${semesterIndex + 1}_marksCard`
    if (file.size > 20 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, [fieldKey]: "File size must be less than 20MB" }))
      return
    }

    setIsUploading((prev) => ({ ...prev, [fieldKey]: true }))
    setErrors((prev) => ({ ...prev, [fieldKey]: "" }))

    try {
      const url = await uploadFile(file, "semesterMarksCard")
      handleSemesterChange(semesterIndex, "marksCard", url)
    } catch (error) {
      console.error(`Upload failed for semester ${semesterIndex + 1}:`, error)
      setErrors((prev) => ({ ...prev, [fieldKey]: "Failed to upload marks card. Please try again." }))
    } finally {
      setIsUploading((prev) => ({ ...prev, [fieldKey]: false }))
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }

      // If selecting "yes" for backlogs and there are no existing backlogs, add one
      if (field === "hasBacklogs" && value === "yes" && prev.backlogs.length === 0) {
        newData.backlogs = [{ code: "", title: "" }]
      }
      // If selecting "no" for backlogs, clear all backlogs
      else if (field === "hasBacklogs" && value === "no") {
        newData.backlogs = []
      }

      return newData
    })

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleSemesterChange = (semesterIndex: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      semesters: prev.semesters.map((sem: SemesterData, index: number) => (index === semesterIndex ? { ...sem, [field]: value } : sem)),
    }))
  }

  const addBacklog = () => {
    setFormData((prev) => ({
      ...prev,
      backlogs: [...prev.backlogs, { code: "", title: "" }],
    }))
  }

  const removeBacklog = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      backlogs: prev.backlogs.filter((_: BacklogData, i: number) => i !== index),
    }))
  }

  const handleBacklogChange = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      backlogs: prev.backlogs.map((backlog: BacklogData, i: number) =>
        i === index ? { ...backlog, [field]: value } : backlog,
      ),
    }))
  }

  const validateUSN = (usn: string, entryType: string, branch: string) => {
    if (!entryType || !branch) return false

    const validBranches = ["ME", "CE", "EEE", "ECE", "AIML", "CSE", "ISE"]
    if (!validBranches.includes(branch)) return false

    // Map branch codes for USN validation (USN uses different codes)
    const usnBranchMap: Record<string, string> = {
      "ME": "ME",
      "CE": "CV",
      "EEE": "EE",
      "ECE": "EC",
      "AIML": "AI",
      "CSE": "CS",
      "ISE": "IS"
    }

    const usnBranchCode = usnBranchMap[branch]

    if (entryType === "REGULAR") {
      const regex = new RegExp(`^2SD22${usnBranchCode}\\d{3}$`)
      const number = Number.parseInt(usn.slice(-3))
      return regex.test(usn) && number >= 1 && number <= 150
    } else if (entryType === "LATERAL") {
      const regex = new RegExp(`^2SD23${usnBranchCode}\\d{3}$`)
      const number = Number.parseInt(usn.slice(-3))
      return regex.test(usn) && number >= 400 && number <= 430
    }

    return false
  }

  const validateLibraryId = (libraryId: string, entryType: string) => {
    if (!entryType) return false

    if (entryType === "REGULAR") {
      return /^22BE\d{4}$/.test(libraryId)
    } else if (entryType === "LATERAL") {
      return /^DIP23BE\d{3}$/.test(libraryId)
    }

    return false
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Basic validations
    if (!formData.branch) newErrors.branch = "Branch is required"
    if (!formData.entryType) newErrors.entryType = "Entry type is required"
    if (!formData.seatCategory) newErrors.seatCategory = "Seat category is required"
    if (!formData.gender) newErrors.gender = "Gender is required"

    // USN validation
    if (!formData.usn.trim()) {
      newErrors.usn = "USN is required"
    } else if (!validateUSN(formData.usn, formData.entryType, formData.branch)) {
      newErrors.usn = "Invalid USN format"
    }

    // Library ID validation
    if (!formData.libraryId.trim()) {
      newErrors.libraryId = "Library ID is required"
    } else if (!validateLibraryId(formData.libraryId, formData.entryType)) {
      newErrors.libraryId = "Invalid Library ID format"
    }

    // Other validations
    if (!formData.branchMentor.trim()) newErrors.branchMentor = "Branch mentor is required"
    if (!formData.linkedinLink.trim()) {
      newErrors.linkedinLink = "LinkedIn profile is required"
    } else if (!/^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+/.test(formData.linkedinLink)) {
      newErrors.linkedinLink = "Enter a valid LinkedIn URL (e.g., https://linkedin.com/in/username)"
    }

    // GitHub and LeetCode for specific branches
    const techBranches = ["CSE", "ISE", "AIML"]
    if (techBranches.includes(formData.branch)) {
      if (!formData.githubLink.trim()) {
        newErrors.githubLink = "GitHub profile is required for your branch"
      } else if (!/^https?:\/\/(www\.)?github\.com\/[\w-]+/.test(formData.githubLink)) {
        newErrors.githubLink = "Enter a valid GitHub URL (e.g., https://github.com/username)"
      }

      if (!formData.leetcodeLink.trim()) {
        newErrors.leetcodeLink = "LeetCode profile is required for your branch"
      } else if (!/^https?:\/\/(www\.)?leetcode\.com\/(u\/)?[\w-]+/.test(formData.leetcodeLink)) {
        newErrors.leetcodeLink = "Enter a valid LeetCode URL (e.g., https://leetcode.com/username)"
      }
    }

    if (!formData.resumeUpload) newErrors.resumeUpload = "Resume upload is required"
    if (!formData.finalCgpa) newErrors.finalCgpa = "Final CGPA is required"
    if (!formData.hasBacklogs) newErrors.hasBacklogs = "Please specify if you have backlogs"

    // Semester validations
    formData.semesters.forEach((sem: SemesterData, index: number) => {
      if (!sem.sgpa) newErrors[`sem${index}_sgpa`] = `Semester ${index + 1} SGPA is required`
      if (!sem.cgpa) newErrors[`sem${index}_cgpa`] = `Semester ${index + 1} CGPA is required`
      if (!sem.monthPassed) newErrors[`sem${index}_month`] = `Semester ${index + 1} month is required`
      if (!sem.yearPassed) newErrors[`sem${index}_year`] = `Semester ${index + 1} year is required`
      if (!sem.marksCard) newErrors[`sem${index}_marks`] = `Semester ${index + 1} marks card is required`
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onNext(formData)
    }
  }

  const branches = [
    { value: "ME", label: "Mechanical Engineering" },
    { value: "CE", label: "Civil Engineering" },
    { value: "EEE", label: "Electrical and Electronics Engineering" },
    { value: "ECE", label: "Electronics and Communication Engineering" },
    { value: "AIML", label: "Artificial Intelligence and Machine Learning" },
    { value: "CSE", label: "Computer Science Engineering" },
    { value: "ISE", label: "Information Science Engineering" },
  ]

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const generateYears = () => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 11 }, (_, i) => (currentYear - i).toString())
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8 steps-form">
        {/* College Information */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">College Information</CardTitle>
            <CardDescription>Basic college and branch details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>College Name</Label>
                <Input value={formData.collegeName} className="bg-muted w-full" readOnly />
              </div>
              <div>
                <Label>District</Label>
                <Input value={formData.district} className="bg-muted w-full" readOnly />
              </div>
              <div>
                <Label>PIN Code</Label>
                <Input value={formData.pincode} className="bg-muted w-full" readOnly />
              </div>
              <div>
                <Label htmlFor="branch">Branch *</Label>
                <Select value={formData.branch} onValueChange={(value) => handleInputChange("branch", value)}>
                  <SelectTrigger className={`w-full ${errors.branch ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.value} value={branch.value}>
                        {branch.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.branch && <p className="text-sm text-red-500 mt-1">{errors.branch}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="entryType">Entry Type *</Label>
                <Select value={formData.entryType} onValueChange={(value) => handleInputChange("entryType", value)}>
                  <SelectTrigger className={`w-full ${errors.entryType ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="Select Entry Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REGULAR">Regular Student</SelectItem>
                    <SelectItem value="LATERAL">Lateral Entry Student</SelectItem>
                  </SelectContent>
                </Select>
                {errors.entryType && <p className="text-sm text-red-500 mt-1">{errors.entryType}</p>}
              </div>
              <div>
                <Label htmlFor="seatCategory">Seat Category *</Label>
                <Select value={formData.seatCategory} onValueChange={(value) => handleInputChange("seatCategory", value)}>
                  <SelectTrigger className={`w-full ${errors.seatCategory ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="Select Seat Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KCET">KCET</SelectItem>
                    <SelectItem value="MANAGEMENT">Management</SelectItem>
                    <SelectItem value="COMEDK">COMEDK</SelectItem>
                  </SelectContent>
                </Select>
                {errors.seatCategory && <p className="text-sm text-red-500 mt-1">{errors.seatCategory}</p>}
              </div>
              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                  <SelectTrigger className={`w-full ${errors.gender ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <p className="text-sm text-red-500 mt-1">{errors.gender}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="usn">University Seat Number (USN) *</Label>
              <Input
                id="usn"
                value={formData.usn}
                onChange={(e) => handleInputChange("usn", e.target.value)}
                className={`w-full ${errors.usn ? "border-red-500" : ""}`}
                placeholder="e.g., 2SD22ME001 or 2SD23CS400"
              />
              {errors.usn && <p className="text-sm text-red-500 mt-1">{errors.usn}</p>}
              <p className="text-xs text-muted-foreground mt-1">
                Format: 2SD22[BRANCH][001-150] for Regular, 2SD23[BRANCH][400-430] for Lateral
              </p>
            </div>

            <div>
              <Label htmlFor="libraryId">Library ID Card Number *</Label>
              <Input
                id="libraryId"
                value={formData.libraryId}
                onChange={(e) => handleInputChange("libraryId", e.target.value)}
                className={`w-full ${errors.libraryId ? "border-red-500" : ""}`}
                placeholder="e.g., 22BE1234 or DIP23BE123"
              />
              {errors.libraryId && <p className="text-sm text-red-500 mt-1">{errors.libraryId}</p>}
              <p className="text-xs text-muted-foreground mt-1">
                Format: 22BE[4-digit] for Regular, DIP23BE[3-digit] for Lateral
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
            <CardDescription>Mentor, profiles, and resume information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Batch</Label>
              <Input value={formData.batch} className="bg-muted w-full" readOnly />
            </div>

            <div>
              <Label htmlFor="branchMentor">Branch Mentor Name *</Label>
              <Input
                id="branchMentor"
                value={formData.branchMentor}
                onChange={(e) => handleInputChange("branchMentor", e.target.value)}
                className={`w-full ${errors.branchMentor ? "border-red-500" : ""}`}
                placeholder="e.g., DR. JOHN DOE"
              />
              {errors.branchMentor && <p className="text-sm text-red-500 mt-1">{errors.branchMentor}</p>}
            </div>

            <div>
              <Label htmlFor="linkedinLink">LinkedIn Profile Link *</Label>
              <Input
                id="linkedinLink"
                type="url"
                value={formData.linkedinLink}
                onChange={(e) => handleInputChange("linkedinLink", e.target.value)}
                className={`w-full ${errors.linkedinLink ? "border-red-500" : ""}`}
                placeholder="https://www.linkedin.com/in/yourprofile/"
              />
              {errors.linkedinLink && <p className="text-sm text-red-500 mt-1">{errors.linkedinLink}</p>}
            </div>

            {["CSE", "ISE", "AIML"].includes(formData.branch) && (
              <>
                <div>
                  <Label htmlFor="githubLink">GitHub Profile Link *</Label>
                  <Input
                    id="githubLink"
                    type="url"
                    value={formData.githubLink}
                    onChange={(e) => handleInputChange("githubLink", e.target.value)}
                    className={`w-full ${errors.githubLink ? "border-red-500" : ""}`}
                    placeholder="https://github.com/yourprofile"
                  />
                  {errors.githubLink && <p className="text-sm text-red-500 mt-1">{errors.githubLink}</p>}
                  <p className="text-xs text-muted-foreground mt-1">Mandatory for ISE, CSE, AIML students</p>
                </div>

                <div>
                  <Label htmlFor="leetcodeLink">LeetCode Profile Link *</Label>
                  <Input
                    id="leetcodeLink"
                    type="url"
                    value={formData.leetcodeLink}
                    onChange={(e) => handleInputChange("leetcodeLink", e.target.value)}
                    className={`w-full ${errors.leetcodeLink ? "border-red-500" : ""}`}
                    placeholder="https://leetcode.com/yourprofile/"
                  />
                  {errors.leetcodeLink && <p className="text-sm text-red-500 mt-1">{errors.leetcodeLink}</p>}
                  <p className="text-xs text-muted-foreground mt-1">Mandatory for ISE, CSE, AIML students</p>
                </div>
              </>
            )}

            <DocumentUpload
              onFileChange={(file) => handleFileUpload("resumeUpload", file)}
              accept="application/pdf"
              maxSizeMB={10}
              label="Upload Professional Resume"
              required={true}
              error={errors.resumeUpload}
              initialFile={
                typeof formData.resumeUpload === 'string'
                  ? { url: formData.resumeUpload, name: "Uploaded Resume" }
                  : formData.resumeUpload as File | null
              }
              description="• File name format: USN_Resume.pdf<br>• Maximum file size: 10MB<br>• PDF format only<br>• Include professional photo in resume"
              placeholder="Drop your resume PDF here or click to select"
            />
          </CardContent>
        </Card>

        {/* Engineering Academic Details */}
        <Card>
          <CardHeader>
            <CardTitle>Engineering Academic Details</CardTitle>
            <CardDescription>Semester-wise academic performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.semesters.map((semester: SemesterData, index: number) => (
              <Card key={index} className="bg-gray-50/50">
                <CardHeader>
                  <CardTitle className="text-lg">Semester {semester.semester}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`sem${index}_sgpa`}>SGPA *</Label>
                      <Input
                        id={`sem${index}_sgpa`}
                        type="number"
                        value={semester.sgpa}
                        onChange={(e) => handleSemesterChange(index, "sgpa", e.target.value)}
                        className={`w-full ${errors[`sem${index}_sgpa`] ? "border-red-500" : ""}`}
                        placeholder="0.00"
                        min="0"
                        max="10"
                        step="0.01"
                      />
                      {errors[`sem${index}_sgpa`] && (
                        <p className="text-sm text-red-500 mt-1">{errors[`sem${index}_sgpa`]}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`sem${index}_cgpa`}>CGPA *</Label>
                      <Input
                        id={`sem${index}_cgpa`}
                        type="number"
                        value={semester.cgpa}
                        onChange={(e) => handleSemesterChange(index, "cgpa", e.target.value)}
                        className={`w-full ${errors[`sem${index}_cgpa`] ? "border-red-500" : ""}`}
                        placeholder="0.00"
                        min="0"
                        max="10"
                        step="0.01"
                      />
                      {errors[`sem${index}_cgpa`] && (
                        <p className="text-sm text-red-500 mt-1">{errors[`sem${index}_cgpa`]}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`sem${index}_month`}>Month Passed *</Label>
                      <Select
                        value={semester.monthPassed}
                        onValueChange={(value) => handleSemesterChange(index, "monthPassed", value)}
                      >
                        <SelectTrigger className={`w-full ${errors[`sem${index}_month`] ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="Select Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((month) => (
                            <SelectItem key={month} value={month}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors[`sem${index}_month`] && (
                        <p className="text-sm text-red-500 mt-1">{errors[`sem${index}_month`]}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`sem${index}_year`}>Year Passed *</Label>
                      <Select
                        value={semester.yearPassed}
                        onValueChange={(value) => handleSemesterChange(index, "yearPassed", value)}
                      >
                        <SelectTrigger className={`w-full ${errors[`sem${index}_year`] ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {generateYears().map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors[`sem${index}_year`] && (
                        <p className="text-sm text-red-500 mt-1">{errors[`sem${index}_year`]}</p>
                      )}
                    </div>
                  </div>

                  <DocumentUpload
                    onFileChange={(file) => handleMarksCardUpload(index, file)}
                    accept="image/jpeg,image/png,application/pdf"
                    maxSizeMB={10}
                    label={`Upload Semester ${semester.semester} Marks Card`}
                    required={true}
                    error={errors[`sem${index}_marks`]}
                    initialFile={
                      typeof semester.marksCard === 'string'
                        ? { url: semester.marksCard, name: `Semester ${semester.semester} Marks Card` }
                        : semester.marksCard as File | null
                    }
                    description={`Format: USN_Sem${semester.semester}_MarksCard.jpg/pdf • Max 10MB • JPG/PNG/PDF`}
                    placeholder="Drop your marks card here or click to select"
                  />
                </CardContent>
              </Card>
            ))}

            <div>
              <Label htmlFor="finalCgpa">6th Semester CGPA *</Label>
              <Input
                id="finalCgpa"
                type="number"
                value={formData.finalCgpa}
                onChange={(e) => handleInputChange("finalCgpa", e.target.value)}
                className={`w-full ${errors.finalCgpa ? "border-red-500" : ""}`}
                placeholder="0.00"
                min="0"
                max="10"
                step="0.01"
              />
              {errors.finalCgpa && <p className="text-sm text-red-500 mt-1">{errors.finalCgpa}</p>}
            </div>

            <div>
              <Label>Active Backlogs *</Label>
              <RadioGroup
                value={formData.hasBacklogs}
                onValueChange={(value) => handleInputChange("hasBacklogs", value)}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="backlogs_yes" />
                  <Label htmlFor="backlogs_yes" className="cursor-pointer font-normal">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="backlogs_no" />
                  <Label htmlFor="backlogs_no" className="cursor-pointer font-normal">No</Label>
                </div>
              </RadioGroup>
              {errors.hasBacklogs && <p className="text-sm text-red-500 mt-1">{errors.hasBacklogs}</p>}
            </div>

            {formData.hasBacklogs === "yes" && (
              <Card className="bg-red-50/50 border-red-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Backlog Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.backlogs.map((backlog: BacklogData, index: number) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                      <div>
                        <Label htmlFor={`backlog_code_${index}`}>Subject Code</Label>
                        <Input
                          id={`backlog_code_${index}`}
                          value={backlog.code}
                          onChange={(e) => handleBacklogChange(index, "code", e.target.value)}
                          placeholder="e.g., 18ME101"
                          className="w-full"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <Label htmlFor={`backlog_title_${index}`}>Subject Title</Label>
                          <Input
                            id={`backlog_title_${index}`}
                            value={backlog.title}
                            onChange={(e) => handleBacklogChange(index, "title", e.target.value)}
                            placeholder="e.g., ENGINEERING MATHEMATICS"
                            className="w-full"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeBacklog(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addBacklog} className="w-full bg-transparent">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Backlog
                  </Button>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onPrevious} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>
          <Button type="submit" size="lg" className="px-8 py-3">
            Next Step
          </Button>
        </div>
      </form>
    </div>
  )
}

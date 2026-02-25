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
import { ProfilePhotoUpload } from "@/components/ui/profile-photo-upload"
import { ArrowLeft, AlertCircle, Upload, X, User, Camera } from "lucide-react"

interface PersonalInfoStepProps {
  onNext: (data: any) => void
  initialData?: any
}

export function PersonalInfoStep({ onNext, initialData = {} }: PersonalInfoStepProps) {
  const [formData, setFormData] = useState({
    firstName: initialData.firstName || "",
    middleName: initialData.middleName || ".",
    lastName: initialData.lastName || "",
    dateOfBirth: initialData.dateOfBirth || "",
    gender: initialData.gender || "",
    bloodGroup: initialData.bloodGroup || "",
    state: initialData.state || "KARNATAKA",
    nationality: initialData.nationality || "Indian",
    category: initialData.category || "",
    profilePhoto: initialData.profilePhoto || null,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isUploading, setIsUploading] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleInputBlur = (field: string) => {
    // Validate field on blur
    if (field === 'firstName' && !formData.firstName.trim()) {
      setErrors((prev) => ({ ...prev, firstName: "First name is required" }))
    } else if (field === 'lastName' && !formData.lastName.trim()) {
      setErrors((prev) => ({ ...prev, lastName: "Last name is required" }))
    }
    // Add more validations as needed
  }

  const handlePhotoChange = async (file: File | null) => {
    if (!file) {
      setFormData((prev) => ({ ...prev, profilePhoto: null }))
      return
    }

    setIsUploading(true)
    setErrors((prev) => ({ ...prev, profilePhoto: "" }))

    try {
      const formDataToUpload = new FormData()
      formDataToUpload.append('file', file)
      formDataToUpload.append('type', 'profile-photo')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataToUpload,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      setFormData((prev) => ({
        ...prev,
        profilePhoto: result.url
      }))
    } catch (error) {
      console.error('Photo upload failed:', error)
      setErrors((prev) => ({ ...prev, profilePhoto: "Failed to upload photo. Please try again." }))
    } finally {
      setIsUploading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required"
    if (!formData.gender) newErrors.gender = "Gender is required"
    if (!formData.bloodGroup) newErrors.bloodGroup = "Blood group is required"
    if (!formData.category) newErrors.category = "Caste category is required"
    if (!formData.profilePhoto) newErrors.profilePhoto = "Profile photo is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onNext(formData)
    }
  }

  const generateDays = () => {
    return Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, "0"))
  }

  const generateYears = () => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 45 }, (_, i) => (currentYear - i).toString())
  }

  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ]

  const states = [
    "KARNATAKA",
    "ANDHRA PRADESH",
    "ARUNACHAL PRADESH",
    "ASSAM",
    "BIHAR",
    "CHHATTISGARH",
    "GOA",
    "GUJARAT",
    "HARYANA",
    "HIMACHAL PRADESH",
    "JHARKHAND",
    "KERALA",
    "MADHYA PRADESH",
    "MAHARASHTRA",
    "MANIPUR",
    "MEGHALAYA",
    "MIZORAM",
    "NAGALAND",
    "ODISHA",
    "PUNJAB",
    "RAJASTHAN",
    "SIKKIM",
    "TAMIL NADU",
    "TELANGANA",
    "TRIPURA",
    "UTTAR PRADESH",
    "UTTARAKHAND",
    "WEST BENGAL",
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6 steps-form">

        {/* Name Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold tracking-[-0.02em]">Personal Name</CardTitle>
            <CardDescription className="text-sm tracking-[-0.01em]">Enter your full name as per official documents</CardDescription>
          </CardHeader>
          <div className="px-6 pb-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  onBlur={() => handleInputBlur("firstName")}
                  className={errors.firstName ? "border-red-500" : ""}
                  placeholder="Enter first name"
                  aria-invalid={errors.firstName ? "true" : "false"}
                />
                {errors.firstName && <p className="text-sm text-red-600 mt-1.5">{errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="middleName">Middle Name (enter '.' if none)</Label>
                <Input
                  id="middleName"
                  value={formData.middleName}
                  onChange={(e) => handleInputChange("middleName", e.target.value)}
                  onBlur={() => handleInputBlur("middleName")}
                  placeholder="."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  onBlur={() => handleInputBlur("lastName")}
                  className={errors.lastName ? "border-red-500" : ""}
                  placeholder="Enter last name"
                  aria-invalid={errors.lastName ? "true" : "false"}
                />
                {errors.lastName && <p className="text-sm text-red-600 mt-1.5">{errors.lastName}</p>}
              </div>
            </div>
          </div>
        </Card>

        {/* Profile Photo Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold tracking-[-0.02em]">Profile Photo</CardTitle>
            <CardDescription className="text-sm tracking-[-0.01em]">Upload a passport-size photo (JPG/PNG, max 5MB)</CardDescription>
          </CardHeader>
          <div className="px-6 pb-6">
            <ProfilePhotoUpload
              onFileChange={handlePhotoChange}
              maxSizeMB={5}
              required={true}
              error={errors.profilePhoto}
              description="• Passport-size photo (3.5cm x 4.5cm preferred)<br>• Clear, recent photograph with plain background<br>• Face should be clearly visible<br>• File formats: JPG, PNG • Maximum file size: 5MB"
            />
          </div>
        </Card>

        {/* Date of Birth Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold tracking-[-0.02em]">Date of Birth</CardTitle>
            <CardDescription className="text-sm tracking-[-0.01em]">Select your date of birth</CardDescription>
          </CardHeader>
          <div className="px-6 pb-6 space-y-2">
            <div className="space-y-2">
              <Label>Date of Birth *</Label>
              <DatePicker
                date={formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined}
                onSelect={(date) => handleInputChange("dateOfBirth", date?.toISOString() || "")}
                placeholder="Select your date of birth"
                disableFuture={true}
                fromYear={1990}
                toYear={new Date().getFullYear() - 16}
                captionLayout="dropdown"
                className={errors.dateOfBirth ? "border-red-500" : ""}
              />
              {errors.dateOfBirth && <p className="text-sm text-red-600 mt-1.5">{errors.dateOfBirth}</p>}
            </div>
          </div>
        </Card>

        {/* Personal Details Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold tracking-[-0.02em]">Personal Details</CardTitle>
            <CardDescription className="text-sm tracking-[-0.01em]">Basic personal information</CardDescription>
          </CardHeader>
          <div className="px-6 pb-6 space-y-5">
            {/* Gender and Blood Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                  <SelectTrigger className={errors.gender ? "border-red-500" : ""} aria-invalid={errors.gender ? "true" : "false"}>
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <p className="text-sm text-red-600 mt-1.5">{errors.gender}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloodGroup">Blood Group *</Label>
                <Select value={formData.bloodGroup} onValueChange={(value) => handleInputChange("bloodGroup", value)}>
                  <SelectTrigger className={errors.bloodGroup ? "border-red-500" : ""} aria-invalid={errors.bloodGroup ? "true" : "false"}>
                    <SelectValue placeholder="Select Blood Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="O_POSITIVE">O +ve</SelectItem>
                    <SelectItem value="O_NEGATIVE">O -ve</SelectItem>
                    <SelectItem value="A_POSITIVE">A +ve</SelectItem>
                    <SelectItem value="A_NEGATIVE">A -ve</SelectItem>
                    <SelectItem value="B_POSITIVE">B +ve</SelectItem>
                    <SelectItem value="B_NEGATIVE">B -ve</SelectItem>
                    <SelectItem value="AB_POSITIVE">AB +ve</SelectItem>
                    <SelectItem value="AB_NEGATIVE">AB -ve</SelectItem>
                  </SelectContent>
                </Select>
                {errors.bloodGroup && <p className="text-sm text-red-600 mt-1.5">{errors.bloodGroup}</p>}
              </div>
            </div>

            {/* State and Nationality */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Select value={formData.state} onValueChange={(value) => handleInputChange("state", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Input id="nationality" value={formData.nationality} className="bg-neutral-50" readOnly />
              </div>
            </div>

            {/* Caste Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Caste Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger className={errors.category ? "border-red-500" : ""} aria-invalid={errors.category ? "true" : "false"}>
                  <SelectValue placeholder="Select Caste Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GEN">GEN</SelectItem>
                  <SelectItem value="OBC">OBC</SelectItem>
                  <SelectItem value="SC">SC</SelectItem>
                  <SelectItem value="ST">ST</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-red-600 mt-1.5">{errors.category}</p>}
            </div>
          </div>
        </Card>

        <div className="flex justify-end pt-6">
          <Button type="submit" size="lg" className="px-8 h-11 text-sm font-medium tracking-[-0.01em]">
            Next Step
          </Button>
        </div>
      </form>
    </div>
  )
}

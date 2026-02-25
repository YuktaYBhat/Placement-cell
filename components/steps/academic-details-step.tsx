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
import { ArrowLeft, Upload } from "lucide-react"

interface AcademicDetailsStepProps {
  onNext: (data: any) => void
  onPrevious: () => void
  initialData?: any
}

export function AcademicDetailsStep({ onNext, onPrevious, initialData = {} }: AcademicDetailsStepProps) {
  const [formData, setFormData] = useState({
    // 10th Standard
    tenthSchool: initialData.tenthSchool || "",
    tenthArea: initialData.tenthArea || "",
    tenthDistrict: initialData.tenthDistrict || "",
    tenthCity: initialData.tenthCity || "",
    tenthPincode: initialData.tenthPincode || "",
    tenthState: initialData.tenthState || "KARNATAKA",
    tenthBoard: initialData.tenthBoard || "",
    tenthPassingYear: initialData.tenthPassingYear || "",
    tenthPassingMonth: initialData.tenthPassingMonth || "",
    tenthPercentage: initialData.tenthPercentage || "",
    tenthMarksCard: initialData.tenthMarksCard || null,

    // Academic Level
    academicLevel: initialData.academicLevel || "",

    // 12th Standard
    twelfthSchool: initialData.twelfthSchool || "",
    twelfthArea: initialData.twelfthArea || "",
    twelfthDistrict: initialData.twelfthDistrict || "",
    twelfthCity: initialData.twelfthCity || "",
    twelfthPincode: initialData.twelfthPincode || "",
    twelfthState: initialData.twelfthState || "KARNATAKA",
    twelfthBoard: initialData.twelfthBoard || "",
    twelfthPassingYear: initialData.twelfthPassingYear || "",
    twelfthPassingMonth: initialData.twelfthPassingMonth || "",
    twelfthPercentage: initialData.twelfthPercentage || "",
    twelfthMarksCard: initialData.twelfthMarksCard || null,
    // CBSE specific fields
    twelfthCbseSubjects: initialData.twelfthCbseSubjects || "5",
    twelfthCbseMarks: initialData.twelfthCbseMarks || "",
    // ICSE specific fields
    twelfthIcseMarks: initialData.twelfthIcseMarks || "",

    // Diploma
    diplomaCollege: initialData.diplomaCollege || "",
    diplomaArea: initialData.diplomaArea || "",
    diplomaDistrict: initialData.diplomaDistrict || "",
    diplomaCity: initialData.diplomaCity || "",
    diplomaPincode: initialData.diplomaPincode || "",
    diplomaState: initialData.diplomaState || "KARNATAKA",
    diplomaPercentage: initialData.diplomaPercentage || "",
    diplomaCertificates: initialData.diplomaCertificates || null,
    // Semester-wise diploma fields
    diplomaSemesters: initialData.diplomaSemesters || Array.from({ length: 6 }, (_, i) => ({
      semester: i + 1,
      sgpa: "",
      cgpa: "",
      marks: "",
    })),
    // Year-wise totals for calculation
    diplomaFirstYear: initialData.diplomaFirstYear || "",
    diplomaSecondYear: initialData.diplomaSecondYear || "",
    diplomaThirdYear: initialData.diplomaThirdYear || "",
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
      const url = await uploadFile(file, field)
      handleInputChange(field, url)
    } catch (error) {
      console.error(`Upload failed for ${field}:`, error)
      setErrors((prev) => ({ ...prev, [field]: "Failed to upload document. Please try again." }))
    } finally {
      setIsUploading((prev) => ({ ...prev, [field]: false }))
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }

      // Auto-calculate percentage for CBSE board
      if (field === "twelfthCbseMarks" || field === "twelfthCbseSubjects") {
        const marks = field === "twelfthCbseMarks" ? parseFloat(value as string) : parseFloat(prev.twelfthCbseMarks)
        const subjects = field === "twelfthCbseSubjects" ? value as string : prev.twelfthCbseSubjects
        const maxMarks = subjects === "5" ? 500 : 600

        if (!isNaN(marks) && marks >= 0 && marks <= maxMarks) {
          newData.twelfthPercentage = ((marks / maxMarks) * 100).toFixed(2)
        } else if (marks > maxMarks) {
          newData.twelfthPercentage = ""
        }
      }

      // Auto-calculate percentage for ICSE board
      if (field === "twelfthIcseMarks") {
        const marks = parseFloat(value as string)
        const maxMarks = 1000

        if (!isNaN(marks) && marks >= 0 && marks <= maxMarks) {
          newData.twelfthPercentage = ((marks / maxMarks) * 100).toFixed(2)
        } else if (marks > maxMarks) {
          newData.twelfthPercentage = ""
        }
      }

      // Auto-calculate diploma percentage
      if (field === "diplomaFirstYear" || field === "diplomaSecondYear" || field === "diplomaThirdYear") {
        const firstYear = field === "diplomaFirstYear" ? parseFloat(value as string) : parseFloat(prev.diplomaFirstYear)
        const secondYear = field === "diplomaSecondYear" ? parseFloat(value as string) : parseFloat(prev.diplomaSecondYear)
        const thirdYear = field === "diplomaThirdYear" ? parseFloat(value as string) : parseFloat(prev.diplomaThirdYear)

        if (!isNaN(firstYear) && !isNaN(secondYear) && !isNaN(thirdYear) &&
          firstYear <= 1000 && secondYear <= 1800 && thirdYear <= 1200) {
          const weightedFirst = firstYear * 0.25
          const weightedSecond = secondYear * 0.5
          const weightedThird = thirdYear
          const totalWeightedMarks = weightedFirst + weightedSecond + weightedThird
          newData.diplomaPercentage = ((totalWeightedMarks / 2350) * 100).toFixed(2)
        } else if ((firstYear > 1000 || secondYear > 1800 || thirdYear > 1200)) {
          newData.diplomaPercentage = ""
        }
      }

      // Clear percentage calculation fields when board changes
      if (field === "twelfthBoard") {
        if (value !== "CBSE") {
          newData.twelfthCbseMarks = ""
          newData.twelfthCbseSubjects = "5"
        }
        if (value !== "ICSE") {
          newData.twelfthIcseMarks = ""
        }
        if (value === "STATE") {
          // For STATE board, user enters percentage directly
          newData.twelfthPercentage = ""
        }
      }

      return newData
    })

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleDiplomaSemesterChange = (semesterIndex: number, field: string, value: string) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        diplomaSemesters: prev.diplomaSemesters.map((sem: any, index: number) =>
          index === semesterIndex ? { ...sem, [field]: value } : sem
        ),
      }

      // Auto-calculate year totals when semester marks change
      if (field === "marks") {
        const semesters = newData.diplomaSemesters

        // First Year (Semester 1 + 2)
        if (semesterIndex === 0 || semesterIndex === 1) {
          const sem1Marks = parseFloat(semesters[0]?.marks || "0")
          const sem2Marks = parseFloat(semesters[1]?.marks || "0")
          const total = sem1Marks + sem2Marks
          if (total <= 1000) {
            newData.diplomaFirstYear = total.toString()
          }
        }

        // Second Year (Semester 3 + 4)
        if (semesterIndex === 2 || semesterIndex === 3) {
          const sem3Marks = parseFloat(semesters[2]?.marks || "0")
          const sem4Marks = parseFloat(semesters[3]?.marks || "0")
          const total = sem3Marks + sem4Marks
          if (total <= 1800) {
            newData.diplomaSecondYear = total.toString()
          }
        }

        // Third Year (Semester 5 + 6)
        if (semesterIndex === 4 || semesterIndex === 5) {
          const sem5Marks = parseFloat(semesters[4]?.marks || "0")
          const sem6Marks = parseFloat(semesters[5]?.marks || "0")
          const total = sem5Marks + sem6Marks
          if (total <= 1200) {
            newData.diplomaThirdYear = total.toString()
          }
        }

        // Recalculate percentage
        const firstYear = parseFloat(newData.diplomaFirstYear || "0")
        const secondYear = parseFloat(newData.diplomaSecondYear || "0")
        const thirdYear = parseFloat(newData.diplomaThirdYear || "0")

        if (!isNaN(firstYear) && !isNaN(secondYear) && !isNaN(thirdYear) &&
          firstYear <= 1000 && secondYear <= 1800 && thirdYear <= 1200) {
          const weightedFirst = firstYear * 0.25
          const weightedSecond = secondYear * 0.5
          const weightedThird = thirdYear
          const totalWeightedMarks = weightedFirst + weightedSecond + weightedThird
          newData.diplomaPercentage = ((totalWeightedMarks / 2350) * 100).toFixed(2)
        }
      }

      return newData
    })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // 10th Standard validation
    if (!formData.tenthSchool.trim()) newErrors.tenthSchool = "School name is required"
    if (!formData.tenthArea.trim()) newErrors.tenthArea = "Area is required"
    if (!formData.tenthDistrict.trim()) newErrors.tenthDistrict = "District is required"
    if (!formData.tenthCity.trim()) newErrors.tenthCity = "City is required"
    if (!formData.tenthPincode.trim()) {
      newErrors.tenthPincode = "PIN code is required"
    } else if (!/^\d{6}$/.test(formData.tenthPincode)) {
      newErrors.tenthPincode = "Please enter a valid 6-digit PIN code"
    }
    if (!formData.tenthBoard) newErrors.tenthBoard = "Board is required"
    if (!formData.tenthPassingYear) newErrors.tenthPassingYear = "Passing year is required"
    if (!formData.tenthPassingMonth) newErrors.tenthPassingMonth = "Passing month is required"
    if (!formData.tenthPercentage) newErrors.tenthPercentage = "Percentage is required"
    if (!formData.tenthMarksCard) newErrors.tenthMarksCard = "10th marks card is required"

    // Academic level validation
    if (!formData.academicLevel) newErrors.academicLevel = "Please select 12th Standard or Diploma"

    // 12th Standard validation (if selected)
    if (formData.academicLevel === "12th") {
      if (!formData.twelfthSchool.trim()) newErrors.twelfthSchool = "School name is required"
      if (!formData.twelfthArea.trim()) newErrors.twelfthArea = "Area is required"
      if (!formData.twelfthDistrict.trim()) newErrors.twelfthDistrict = "District is required"
      if (!formData.twelfthCity.trim()) newErrors.twelfthCity = "City is required"
      if (!formData.twelfthPincode.trim()) {
        newErrors.twelfthPincode = "PIN code is required"
      } else if (!/^\d{6}$/.test(formData.twelfthPincode)) {
        newErrors.twelfthPincode = "Please enter a valid 6-digit PIN code"
      }
      if (!formData.twelfthBoard) newErrors.twelfthBoard = "Board is required"
      if (!formData.twelfthPassingYear) newErrors.twelfthPassingYear = "Passing year is required"
      if (!formData.twelfthPassingMonth) newErrors.twelfthPassingMonth = "Passing month is required"

      // Validate based on board type
      if (formData.twelfthBoard === "STATE") {
        if (!formData.twelfthPercentage) newErrors.twelfthPercentage = "Percentage is required"
      } else if (formData.twelfthBoard === "CBSE") {
        if (!formData.twelfthCbseMarks) {
          newErrors.twelfthCbseMarks = "Total marks is required"
        } else {
          const marks = parseFloat(formData.twelfthCbseMarks)
          const maxMarks = formData.twelfthCbseSubjects === "5" ? 500 : 600
          if (marks > maxMarks) {
            newErrors.twelfthCbseMarks = `Total marks cannot exceed ${maxMarks} for ${formData.twelfthCbseSubjects} subjects`
          }
        }
      } else if (formData.twelfthBoard === "ICSE") {
        if (!formData.twelfthIcseMarks) {
          newErrors.twelfthIcseMarks = "Total marks is required"
        } else {
          const marks = parseFloat(formData.twelfthIcseMarks)
          if (marks > 1000) {
            newErrors.twelfthIcseMarks = "Total marks cannot exceed 1000"
          }
        }
      }

      if (!formData.twelfthMarksCard) newErrors.twelfthMarksCard = "12th marks card is required"
    }

    // Diploma validation (if selected)
    if (formData.academicLevel === "Diploma") {
      if (!formData.diplomaCollege.trim()) newErrors.diplomaCollege = "College name is required"
      if (!formData.diplomaArea.trim()) newErrors.diplomaArea = "Area is required"
      if (!formData.diplomaDistrict.trim()) newErrors.diplomaDistrict = "District is required"
      if (!formData.diplomaCity.trim()) newErrors.diplomaCity = "City is required"
      if (!formData.diplomaPincode.trim()) {
        newErrors.diplomaPincode = "PIN code is required"
      } else if (!/^\d{6}$/.test(formData.diplomaPincode)) {
        newErrors.diplomaPincode = "Please enter a valid 6-digit PIN code"
      }

      // Validate semester details
      formData.diplomaSemesters.forEach((sem: any, index: number) => {
        if (!sem.sgpa) newErrors[`diploma_sem${index + 1}_sgpa`] = `Semester ${index + 1} SGPA is required`
        if (!sem.cgpa) newErrors[`diploma_sem${index + 1}_cgpa`] = `Semester ${index + 1} CGPA is required`
        if (!sem.marks) newErrors[`diploma_sem${index + 1}_marks`] = `Semester ${index + 1} marks is required`
      })

      // Validate year totals
      if (!formData.diplomaFirstYear) newErrors.diplomaFirstYear = "First year total is required"
      if (!formData.diplomaSecondYear) newErrors.diplomaSecondYear = "Second year total is required"
      if (!formData.diplomaThirdYear) newErrors.diplomaThirdYear = "Third year total is required"

      if (!formData.diplomaPercentage) newErrors.diplomaPercentage = "Diploma percentage calculation failed"
      if (!formData.diplomaCertificates) newErrors.diplomaCertificates = "Diploma certificates are required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onNext(formData)
    }
  }
  const generateYears = () => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 45 }, (_, i) => (currentYear - i).toString())
  }

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
      <form onSubmit={handleSubmit} className="space-y-8 steps-form">

        {/* 10th Standard Details */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">10th Standard Details</CardTitle>
            <CardDescription>Information about your 10th standard education</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="tenthSchool">School Name *</Label>
                <Input
                  id="tenthSchool"
                  value={formData.tenthSchool}
                  onChange={(e) => handleInputChange("tenthSchool", e.target.value)}
                  className={`w-full ${errors.tenthSchool ? "border-red-500" : ""}`}
                  placeholder="Enter school name"
                />
                {errors.tenthSchool && <p className="text-sm text-red-500 mt-1">{errors.tenthSchool}</p>}
              </div>
              <div>
                <Label htmlFor="tenthArea">Area of School *</Label>
                <Input
                  id="tenthArea"
                  value={formData.tenthArea}
                  onChange={(e) => handleInputChange("tenthArea", e.target.value)}
                  className={errors.tenthArea ? "border-red-500" : ""}
                  placeholder="Enter area"
                />
                {errors.tenthArea && <p className="text-sm text-red-500 mt-1">{errors.tenthArea}</p>}
              </div>
              <div>
                <Label htmlFor="tenthDistrict">District *</Label>
                <Input
                  id="tenthDistrict"
                  value={formData.tenthDistrict}
                  onChange={(e) => handleInputChange("tenthDistrict", e.target.value)}
                  className={errors.tenthDistrict ? "border-red-500" : ""}
                  placeholder="Enter district"
                />
                {errors.tenthDistrict && <p className="text-sm text-red-500 mt-1">{errors.tenthDistrict}</p>}
              </div>
              <div>
                <Label htmlFor="tenthCity">City *</Label>
                <Input
                  id="tenthCity"
                  value={formData.tenthCity}
                  onChange={(e) => handleInputChange("tenthCity", e.target.value)}
                  className={errors.tenthCity ? "border-red-500" : ""}
                  placeholder="Enter city"
                />
                {errors.tenthCity && <p className="text-sm text-red-500 mt-1">{errors.tenthCity}</p>}
              </div>
              <div>
                <Label htmlFor="tenthPincode">PIN Code *</Label>
                <Input
                  id="tenthPincode"
                  value={formData.tenthPincode}
                  onChange={(e) => handleInputChange("tenthPincode", e.target.value)}
                  className={errors.tenthPincode ? "border-red-500" : ""}
                  placeholder="6-digit PIN code"
                  maxLength={6}
                />
                {errors.tenthPincode && <p className="text-sm text-red-500 mt-1">{errors.tenthPincode}</p>}
              </div>
              <div>
                <Label htmlFor="tenthState">State *</Label>
                <Select value={formData.tenthState} onValueChange={(value) => handleInputChange("tenthState", value)}>
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
              <div>
                <Label htmlFor="tenthBoard">Board *</Label>
                <Select value={formData.tenthBoard} onValueChange={(value) => handleInputChange("tenthBoard", value)}>
                  <SelectTrigger className={errors.tenthBoard ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select Board" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STATE">STATE</SelectItem>
                    <SelectItem value="CBSE">CBSE</SelectItem>
                    <SelectItem value="ICSE">ICSE</SelectItem>
                  </SelectContent>
                </Select>
                {errors.tenthBoard && <p className="text-sm text-red-500 mt-1">{errors.tenthBoard}</p>}
              </div>
              <div>
                <Label htmlFor="tenthPassingYear">Passing Year *</Label>
                <Select
                  value={formData.tenthPassingYear}
                  onValueChange={(value) => handleInputChange("tenthPassingYear", value)}
                >
                  <SelectTrigger className={errors.tenthPassingYear ? "border-red-500" : ""}>
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
                {errors.tenthPassingYear && <p className="text-sm text-red-500 mt-1">{errors.tenthPassingYear}</p>}
              </div>
              <div>
                <Label htmlFor="tenthPassingMonth">Passing Month *</Label>
                <Select
                  value={formData.tenthPassingMonth}
                  onValueChange={(value) => handleInputChange("tenthPassingMonth", value)}
                >
                  <SelectTrigger className={errors.tenthPassingMonth ? "border-red-500" : ""}>
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
                {errors.tenthPassingMonth && <p className="text-sm text-red-500 mt-1">{errors.tenthPassingMonth}</p>}
              </div>
              <div>
                <Label htmlFor="tenthPercentage">Percentage *</Label>
                <Input
                  id="tenthPercentage"
                  type="number"
                  value={formData.tenthPercentage}
                  onChange={(e) => handleInputChange("tenthPercentage", e.target.value)}
                  className={errors.tenthPercentage ? "border-red-500" : ""}
                  placeholder="Enter percentage"
                  min="0"
                  max="100"
                  step="0.01"
                />
                {errors.tenthPercentage && <p className="text-sm text-red-500 mt-1">{errors.tenthPercentage}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="tenthMarksCard">Upload 10th Marks Card *</Label>
              <div className="mt-2 space-y-2">
                <Input
                  id="tenthMarksCard"
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => handleFileUpload("tenthMarksCard", e.target.files?.[0] || null)}
                  className={`w-full ${errors.tenthMarksCard ? "border-red-500" : ""}`}
                />

                {/* Display existing file or selected file */}
                {formData.tenthMarksCard && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                    {typeof formData.tenthMarksCard === 'string' ? (
                      <div className="flex items-center gap-2 w-full">
                        <span className="text-green-600 font-medium">✓ Uploaded</span>
                        <a
                          href={formData.tenthMarksCard}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-blue-600 hover:underline text-xs"
                        >
                          View Current File
                        </a>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>File selected: {(formData.tenthMarksCard as File)?.name}</span>
                      </>
                    )}
                  </div>
                )}

                {errors.tenthMarksCard && <p className="text-sm text-red-500 mt-1">{errors.tenthMarksCard}</p>}
                <p className="text-xs text-muted-foreground mt-1">Format: USN_10th_MarksCard.jpg/pdf • Max 20MB • JPG/PNG/PDF</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Level Selection */}
        <Card>
          <CardHeader>
            <CardTitle>12th Standard / Diploma</CardTitle>
            <CardDescription>Select your field of study after 10th standard</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label>Select your field *</Label>
              <RadioGroup
                value={formData.academicLevel}
                onValueChange={(value) => handleInputChange("academicLevel", value)}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="12th" id="12th" />
                  <Label htmlFor="12th" className="cursor-pointer font-normal">12th Standard</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Diploma" id="Diploma" />
                  <Label htmlFor="Diploma" className="cursor-pointer font-normal">Diploma</Label>
                </div>
              </RadioGroup>
              {errors.academicLevel && <p className="text-sm text-red-500 mt-1">{errors.academicLevel}</p>}
            </div>
          </CardContent>
        </Card >

        {/* 12th Standard Details */}
        {
          formData.academicLevel === "12th" && (
            <Card>
              <CardHeader>
                <CardTitle>12th Standard Details</CardTitle>
                <CardDescription>Information about your 12th standard education</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="twelfthSchool">School Name *</Label>
                    <Input
                      id="twelfthSchool"
                      value={formData.twelfthSchool}
                      onChange={(e) => handleInputChange("twelfthSchool", e.target.value)}
                      className={errors.twelfthSchool ? "border-red-500" : ""}
                      placeholder="Enter school name"
                    />
                    {errors.twelfthSchool && <p className="text-sm text-red-500 mt-1">{errors.twelfthSchool}</p>}
                  </div>
                  <div>
                    <Label htmlFor="twelfthArea">Area of School *</Label>
                    <Input
                      id="twelfthArea"
                      value={formData.twelfthArea}
                      onChange={(e) => handleInputChange("twelfthArea", e.target.value)}
                      className={errors.twelfthArea ? "border-red-500" : ""}
                      placeholder="Enter area"
                    />
                    {errors.twelfthArea && <p className="text-sm text-red-500 mt-1">{errors.twelfthArea}</p>}
                  </div>
                  <div>
                    <Label htmlFor="twelfthDistrict">District *</Label>
                    <Input
                      id="twelfthDistrict"
                      value={formData.twelfthDistrict}
                      onChange={(e) => handleInputChange("twelfthDistrict", e.target.value)}
                      className={errors.twelfthDistrict ? "border-red-500" : ""}
                      placeholder="Enter district"
                    />
                    {errors.twelfthDistrict && <p className="text-sm text-red-500 mt-1">{errors.twelfthDistrict}</p>}
                  </div>
                  <div>
                    <Label htmlFor="twelfthCity">City *</Label>
                    <Input
                      id="twelfthCity"
                      value={formData.twelfthCity}
                      onChange={(e) => handleInputChange("twelfthCity", e.target.value)}
                      className={errors.twelfthCity ? "border-red-500" : ""}
                      placeholder="Enter city"
                    />
                    {errors.twelfthCity && <p className="text-sm text-red-500 mt-1">{errors.twelfthCity}</p>}
                  </div>
                  <div>
                    <Label htmlFor="twelfthPincode">PIN Code *</Label>
                    <Input
                      id="twelfthPincode"
                      value={formData.twelfthPincode}
                      onChange={(e) => handleInputChange("twelfthPincode", e.target.value)}
                      className={errors.twelfthPincode ? "border-red-500" : ""}
                      placeholder="6-digit PIN code"
                      maxLength={6}
                    />
                    {errors.twelfthPincode && <p className="text-sm text-red-500 mt-1">{errors.twelfthPincode}</p>}
                  </div>
                  <div>
                    <Label htmlFor="twelfthState">State *</Label>
                    <Select
                      value={formData.twelfthState}
                      onValueChange={(value) => handleInputChange("twelfthState", value)}
                    >
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
                  <div>
                    <Label htmlFor="twelfthBoard">Board *</Label>
                    <Select
                      value={formData.twelfthBoard}
                      onValueChange={(value) => handleInputChange("twelfthBoard", value)}
                    >
                      <SelectTrigger className={errors.twelfthBoard ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select Board" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STATE">STATE</SelectItem>
                        <SelectItem value="CBSE">CBSE</SelectItem>
                        <SelectItem value="ICSE">ICSE</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.twelfthBoard && <p className="text-sm text-red-500 mt-1">{errors.twelfthBoard}</p>}
                  </div>
                  <div>
                    <Label htmlFor="twelfthPassingYear">Passing Year *</Label>
                    <Select
                      value={formData.twelfthPassingYear}
                      onValueChange={(value) => handleInputChange("twelfthPassingYear", value)}
                    >
                      <SelectTrigger className={errors.twelfthPassingYear ? "border-red-500" : ""}>
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
                    {errors.twelfthPassingYear && <p className="text-sm text-red-500 mt-1">{errors.twelfthPassingYear}</p>}
                  </div>
                  <div>
                    <Label htmlFor="twelfthPassingMonth">Passing Month *</Label>
                    <Select
                      value={formData.twelfthPassingMonth}
                      onValueChange={(value) => handleInputChange("twelfthPassingMonth", value)}
                    >
                      <SelectTrigger className={errors.twelfthPassingMonth ? "border-red-500" : ""}>
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
                    {errors.twelfthPassingMonth && (
                      <p className="text-sm text-red-500 mt-1">{errors.twelfthPassingMonth}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="twelfthPercentage">Percentage *</Label>
                    <Input
                      id="twelfthPercentage"
                      type="number"
                      value={formData.twelfthPercentage}
                      onChange={(e) => handleInputChange("twelfthPercentage", e.target.value)}
                      className={errors.twelfthPercentage ? "border-red-500" : ""}
                      placeholder="Enter percentage"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                    {errors.twelfthPercentage && <p className="text-sm text-red-500 mt-1">{errors.twelfthPercentage}</p>}
                  </div>
                </div>

                {/* Board-specific fields */}
                {formData.twelfthBoard === "CBSE" && (
                  <Card className="bg-muted/30 mt-4">
                    <CardHeader>
                      <CardTitle className="text-md">CBSE Board Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="twelfthCbseSubjects">Number of Subjects *</Label>
                          <Select
                            value={formData.twelfthCbseSubjects}
                            onValueChange={(value) => handleInputChange("twelfthCbseSubjects", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select subjects" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 Subjects</SelectItem>
                              <SelectItem value="6">6 Subjects</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="twelfthCbseMarks">Total Marks *</Label>
                          <Input
                            id="twelfthCbseMarks"
                            type="number"
                            value={formData.twelfthCbseMarks}
                            onChange={(e) => handleInputChange("twelfthCbseMarks", e.target.value)}
                            className={errors.twelfthCbseMarks ? "border-red-500" : ""}
                            placeholder="Enter total marks"
                            min="0"
                            max={formData.twelfthCbseSubjects === "5" ? 500 : 600}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Maximum marks: {formData.twelfthCbseSubjects === "5" ? "500" : "600"}
                          </p>
                          {errors.twelfthCbseMarks && <p className="text-sm text-red-500 mt-1">{errors.twelfthCbseMarks}</p>}
                        </div>
                      </div>
                      {formData.twelfthPercentage && (
                        <div className="bg-muted/50 border rounded-lg p-3">
                          <p className="text-sm font-medium">
                            Calculated Percentage: <span className="text-lg">{formData.twelfthPercentage}%</span>
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {formData.twelfthBoard === "ICSE" && (
                  <Card className="bg-muted/30 mt-4">
                    <CardHeader>
                      <CardTitle className="text-md">ICSE Board Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="twelfthIcseMarks">Total Marks *</Label>
                          <Input
                            id="twelfthIcseMarks"
                            type="number"
                            value={formData.twelfthIcseMarks}
                            onChange={(e) => handleInputChange("twelfthIcseMarks", e.target.value)}
                            className={errors.twelfthIcseMarks ? "border-red-500" : ""}
                            placeholder="Enter total marks"
                            min="0"
                            max="1000"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Enter marks out of 1000</p>
                          {errors.twelfthIcseMarks && <p className="text-sm text-red-500 mt-1">{errors.twelfthIcseMarks}</p>}
                        </div>
                      </div>
                      {formData.twelfthPercentage && (
                        <div className="bg-muted/50 border rounded-lg p-3">
                          <p className="text-sm font-medium">
                            Calculated Percentage: <span className="text-lg">{formData.twelfthPercentage}%</span>
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <DocumentUpload
                  onFileChange={(file) => handleFileUpload("twelfthMarksCard", file)}
                  accept="image/jpeg,image/png,application/pdf"
                  maxSizeMB={20}
                  label="Upload 12th Standard Marks Card"
                  required={true}
                  error={errors.twelfthMarksCard}
                  initialFile={
                    typeof formData.twelfthMarksCard === 'string'
                      ? { url: formData.twelfthMarksCard, name: "Uploaded 12th Marks Card" }
                      : formData.twelfthMarksCard as File | null
                  }
                  description="• Format: USN_12th_Standard_Marks_Card.jpg/pdf<br>• Maximum file size: 20MB • JPG/PNG/PDF accepted"
                  placeholder="Drop your 12th marks card here or click to select"
                />
              </CardContent>
            </Card>
          )
        }

        {/* Diploma Details */}
        {
          formData.academicLevel === "Diploma" && (
            <Card>
              <CardHeader>
                <CardTitle>Diploma Details</CardTitle>
                <CardDescription>Information about your diploma education</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="diplomaCollege">College Name *</Label>
                    <Input
                      id="diplomaCollege"
                      value={formData.diplomaCollege}
                      onChange={(e) => handleInputChange("diplomaCollege", e.target.value)}
                      className={errors.diplomaCollege ? "border-red-500" : ""}
                      placeholder="Enter college name"
                    />
                    {errors.diplomaCollege && <p className="text-sm text-red-500 mt-1">{errors.diplomaCollege}</p>}
                  </div>
                  <div>
                    <Label htmlFor="diplomaArea">Area *</Label>
                    <Input
                      id="diplomaArea"
                      value={formData.diplomaArea}
                      onChange={(e) => handleInputChange("diplomaArea", e.target.value)}
                      className={errors.diplomaArea ? "border-red-500" : ""}
                      placeholder="Enter area"
                    />
                    {errors.diplomaArea && <p className="text-sm text-red-500 mt-1">{errors.diplomaArea}</p>}
                  </div>
                  <div>
                    <Label htmlFor="diplomaDistrict">District *</Label>
                    <Input
                      id="diplomaDistrict"
                      value={formData.diplomaDistrict}
                      onChange={(e) => handleInputChange("diplomaDistrict", e.target.value)}
                      className={errors.diplomaDistrict ? "border-red-500" : ""}
                      placeholder="Enter district"
                    />
                    {errors.diplomaDistrict && <p className="text-sm text-red-500 mt-1">{errors.diplomaDistrict}</p>}
                  </div>
                  <div>
                    <Label htmlFor="diplomaCity">City *</Label>
                    <Input
                      id="diplomaCity"
                      value={formData.diplomaCity}
                      onChange={(e) => handleInputChange("diplomaCity", e.target.value)}
                      className={errors.diplomaCity ? "border-red-500" : ""}
                      placeholder="Enter city"
                    />
                    {errors.diplomaCity && <p className="text-sm text-red-500 mt-1">{errors.diplomaCity}</p>}
                  </div>
                  <div>
                    <Label htmlFor="diplomaPincode">PIN Code *</Label>
                    <Input
                      id="diplomaPincode"
                      value={formData.diplomaPincode}
                      onChange={(e) => handleInputChange("diplomaPincode", e.target.value)}
                      className={errors.diplomaPincode ? "border-red-500" : ""}
                      placeholder="6-digit PIN code"
                      maxLength={6}
                    />
                    {errors.diplomaPincode && <p className="text-sm text-red-500 mt-1">{errors.diplomaPincode}</p>}
                  </div>
                  <div>
                    <Label htmlFor="diplomaState">State *</Label>
                    <Select
                      value={formData.diplomaState}
                      onValueChange={(value) => handleInputChange("diplomaState", value)}
                    >
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
                </div>

                {/* Semester-wise Details */}
                <div className="space-y-6">
                  <h4 className="text-lg font-semibold">Semester-wise Details</h4>

                  {/* First Year */}
                  <Card className="bg-muted/30">
                    <CardHeader>
                      <CardTitle className="text-md">First Year</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[0, 1].map((semIndex) => (
                        <div key={semIndex} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor={`diploma_sem${semIndex + 1}_sgpa`}>
                              {semIndex + 1}{semIndex === 0 ? "st" : "nd"} Semester SGPA *
                            </Label>
                            <Input
                              type="number"
                              value={formData.diplomaSemesters[semIndex]?.sgpa || ""}
                              onChange={(e) => handleDiplomaSemesterChange(semIndex, "sgpa", e.target.value)}
                              className={errors[`diploma_sem${semIndex + 1}_sgpa`] ? "border-red-500" : ""}
                              placeholder="0.00"
                              min="0"
                              max="10"
                              step="0.01"
                            />
                            {errors[`diploma_sem${semIndex + 1}_sgpa`] && (
                              <p className="text-sm text-red-500 mt-1">{errors[`diploma_sem${semIndex + 1}_sgpa`]}</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor={`diploma_sem${semIndex + 1}_cgpa`}>
                              {semIndex + 1}{semIndex === 0 ? "st" : "nd"} Semester CGPA *
                            </Label>
                            <Input
                              type="number"
                              value={formData.diplomaSemesters[semIndex]?.cgpa || ""}
                              onChange={(e) => handleDiplomaSemesterChange(semIndex, "cgpa", e.target.value)}
                              className={errors[`diploma_sem${semIndex + 1}_cgpa`] ? "border-red-500" : ""}
                              placeholder="0.00"
                              min="0"
                              max="10"
                              step="0.01"
                            />
                            {errors[`diploma_sem${semIndex + 1}_cgpa`] && (
                              <p className="text-sm text-red-500 mt-1">{errors[`diploma_sem${semIndex + 1}_cgpa`]}</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor={`diploma_sem${semIndex + 1}_marks`}>
                              {semIndex + 1}{semIndex === 0 ? "st" : "nd"} Semester Marks *
                            </Label>
                            <Input
                              type="number"
                              value={formData.diplomaSemesters[semIndex]?.marks || ""}
                              onChange={(e) => handleDiplomaSemesterChange(semIndex, "marks", e.target.value)}
                              className={errors[`diploma_sem${semIndex + 1}_marks`] ? "border-red-500" : ""}
                              placeholder="Enter marks"
                              min="0"
                              max="500"
                            />
                            {errors[`diploma_sem${semIndex + 1}_marks`] && (
                              <p className="text-sm text-red-500 mt-1">{errors[`diploma_sem${semIndex + 1}_marks`]}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Second Year */}
                  <Card className="bg-muted/30">
                    <CardHeader>
                      <CardTitle className="text-md">Second Year</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[2, 3].map((semIndex) => (
                        <div key={semIndex} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor={`diploma_sem${semIndex + 1}_sgpa`}>
                              {semIndex + 1}{semIndex === 2 ? "rd" : "th"} Semester SGPA *
                            </Label>
                            <Input
                              type="number"
                              value={formData.diplomaSemesters[semIndex]?.sgpa || ""}
                              onChange={(e) => handleDiplomaSemesterChange(semIndex, "sgpa", e.target.value)}
                              className={errors[`diploma_sem${semIndex + 1}_sgpa`] ? "border-red-500" : ""}
                              placeholder="0.00"
                              min="0"
                              max="10"
                              step="0.01"
                            />
                            {errors[`diploma_sem${semIndex + 1}_sgpa`] && (
                              <p className="text-sm text-red-500 mt-1">{errors[`diploma_sem${semIndex + 1}_sgpa`]}</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor={`diploma_sem${semIndex + 1}_cgpa`}>
                              {semIndex + 1}{semIndex === 2 ? "rd" : "th"} Semester CGPA *
                            </Label>
                            <Input
                              type="number"
                              value={formData.diplomaSemesters[semIndex]?.cgpa || ""}
                              onChange={(e) => handleDiplomaSemesterChange(semIndex, "cgpa", e.target.value)}
                              className={errors[`diploma_sem${semIndex + 1}_cgpa`] ? "border-red-500" : ""}
                              placeholder="0.00"
                              min="0"
                              max="10"
                              step="0.01"
                            />
                            {errors[`diploma_sem${semIndex + 1}_cgpa`] && (
                              <p className="text-sm text-red-500 mt-1">{errors[`diploma_sem${semIndex + 1}_cgpa`]}</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor={`diploma_sem${semIndex + 1}_marks`}>
                              {semIndex + 1}{semIndex === 2 ? "rd" : "th"} Semester Marks *
                            </Label>
                            <Input
                              type="number"
                              value={formData.diplomaSemesters[semIndex]?.marks || ""}
                              onChange={(e) => handleDiplomaSemesterChange(semIndex, "marks", e.target.value)}
                              className={errors[`diploma_sem${semIndex + 1}_marks`] ? "border-red-500" : ""}
                              placeholder="Enter marks"
                              min="0"
                              max="900"
                            />
                            {errors[`diploma_sem${semIndex + 1}_marks`] && (
                              <p className="text-sm text-red-500 mt-1">{errors[`diploma_sem${semIndex + 1}_marks`]}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Third Year */}
                  <Card className="bg-muted/30">
                    <CardHeader>
                      <CardTitle className="text-md">Third Year</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[4, 5].map((semIndex) => (
                        <div key={semIndex} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor={`diploma_sem${semIndex + 1}_sgpa`}>
                              {semIndex + 1}th Semester SGPA *
                            </Label>
                            <Input
                              type="number"
                              value={formData.diplomaSemesters[semIndex]?.sgpa || ""}
                              onChange={(e) => handleDiplomaSemesterChange(semIndex, "sgpa", e.target.value)}
                              className={errors[`diploma_sem${semIndex + 1}_sgpa`] ? "border-red-500" : ""}
                              placeholder="0.00"
                              min="0"
                              max="10"
                              step="0.01"
                            />
                            {errors[`diploma_sem${semIndex + 1}_sgpa`] && (
                              <p className="text-sm text-red-500 mt-1">{errors[`diploma_sem${semIndex + 1}_sgpa`]}</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor={`diploma_sem${semIndex + 1}_cgpa`}>
                              {semIndex + 1}th Semester CGPA *
                            </Label>
                            <Input
                              type="number"
                              value={formData.diplomaSemesters[semIndex]?.cgpa || ""}
                              onChange={(e) => handleDiplomaSemesterChange(semIndex, "cgpa", e.target.value)}
                              className={errors[`diploma_sem${semIndex + 1}_cgpa`] ? "border-red-500" : ""}
                              placeholder="0.00"
                              min="0"
                              max="10"
                              step="0.01"
                            />
                            {errors[`diploma_sem${semIndex + 1}_cgpa`] && (
                              <p className="text-sm text-red-500 mt-1">{errors[`diploma_sem${semIndex + 1}_cgpa`]}</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor={`diploma_sem${semIndex + 1}_marks`}>
                              {semIndex + 1}th Semester Marks *
                            </Label>
                            <Input
                              type="number"
                              value={formData.diplomaSemesters[semIndex]?.marks || ""}
                              onChange={(e) => handleDiplomaSemesterChange(semIndex, "marks", e.target.value)}
                              className={errors[`diploma_sem${semIndex + 1}_marks`] ? "border-red-500" : ""}
                              placeholder="Enter marks"
                              min="0"
                              max={semIndex === 4 ? "900" : "300"}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              {semIndex === 5 ? "Industrial Training" : "Regular Semester"}
                            </p>
                            {errors[`diploma_sem${semIndex + 1}_marks`] && (
                              <p className="text-sm text-red-500 mt-1">{errors[`diploma_sem${semIndex + 1}_marks`]}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Marks Calculation Section */}
                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-md">Diploma Marks Calculation</CardTitle>
                    <CardDescription>Year-wise totals and percentage calculation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground mb-4">
                      <p className="font-medium mb-2">Calculation Formula:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>First Year: 25% of total marks (max 1000)</li>
                        <li>Second Year: 50% of total marks (max 1800)</li>
                        <li>Third Year + Industrial Training: 100% of total marks (max 1200)</li>
                        <li className="font-semibold">Total considered: 2350 marks</li>
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="diplomaFirstYear">First Year Marks (out of 1000) *</Label>
                        <Input
                          type="number"
                          value={formData.diplomaFirstYear}
                          onChange={(e) => handleInputChange("diplomaFirstYear", e.target.value)}
                          className={errors.diplomaFirstYear ? "border-red-500" : ""}
                          placeholder="Auto-calculated"
                          min="0"
                          max="1000"
                          readOnly
                        />
                        {errors.diplomaFirstYear && <p className="text-sm text-red-500 mt-1">{errors.diplomaFirstYear}</p>}
                      </div>
                      <div>
                        <Label htmlFor="diplomaSecondYear">Second Year Marks (out of 1800) *</Label>
                        <Input
                          type="number"
                          value={formData.diplomaSecondYear}
                          onChange={(e) => handleInputChange("diplomaSecondYear", e.target.value)}
                          className={errors.diplomaSecondYear ? "border-red-500" : ""}
                          placeholder="Auto-calculated"
                          min="0"
                          max="1800"
                          readOnly
                        />
                        {errors.diplomaSecondYear && <p className="text-sm text-red-500 mt-1">{errors.diplomaSecondYear}</p>}
                      </div>
                      <div>
                        <Label htmlFor="diplomaThirdYear">Third Year Marks (out of 1200) *</Label>
                        <Input
                          type="number"
                          value={formData.diplomaThirdYear}
                          onChange={(e) => handleInputChange("diplomaThirdYear", e.target.value)}
                          className={errors.diplomaThirdYear ? "border-red-500" : ""}
                          placeholder="Auto-calculated"
                          min="0"
                          max="1200"
                          readOnly
                        />
                        {errors.diplomaThirdYear && <p className="text-sm text-red-500 mt-1">{errors.diplomaThirdYear}</p>}
                      </div>
                      <div>
                        <Label htmlFor="diplomaPercentage">Calculated Diploma Percentage *</Label>
                        <Input
                          type="text"
                          value={formData.diplomaPercentage ? `${formData.diplomaPercentage}%` : ""}
                          readOnly
                          className="font-semibold bg-muted"
                          placeholder="Auto-calculated"
                        />
                        {errors.diplomaPercentage && <p className="text-sm text-red-500 mt-1">{errors.diplomaPercentage}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <DocumentUpload
                  onFileChange={(file) => handleFileUpload("diplomaCertificates", file)}
                  accept="application/pdf"
                  maxSizeMB={200}
                  label="Upload All Diploma Semester Certificates"
                  required={true}
                  error={errors.diplomaCertificates}
                  initialFile={
                    typeof formData.diplomaCertificates === 'string'
                      ? { url: formData.diplomaCertificates, name: "Uploaded Diploma Certificates" }
                      : formData.diplomaCertificates as File | null
                  }
                  description="• Format: USN_Diploma_All_Semester.pdf<br>• Maximum file size: 200MB • PDF only<br>• Include all semester certificates in single PDF"
                  placeholder="Drop your diploma certificates PDF here or click to select"
                />
              </CardContent>
            </Card>
          )
        }

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onPrevious} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>
          <Button type="submit" size="lg" className="px-8 py-3">
            Next Step
          </Button>
        </div>
      </form >
    </div >
  )
}

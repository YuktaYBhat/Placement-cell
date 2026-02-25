"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, ArrowLeft, Copy } from "lucide-react"

interface ContactDetailsStepProps {
  onNext: (data: any) => void
  onPrevious: () => void
  initialData?: any
}

export function ContactDetailsStep({ onNext, onPrevious, initialData = {} }: ContactDetailsStepProps) {
  const [formData, setFormData] = useState({
    studentEmail: initialData.studentEmail || "",
    callingNumber: initialData.callingNumber || "",
    whatsappNumber: initialData.whatsappNumber || "",
    altNumber: initialData.altNumber || "",
    fatherFirstName: initialData.fatherFirstName || "",
    fatherMiddleName: initialData.fatherMiddleName || ".",
    fatherLastName: initialData.fatherLastName || "",
    fatherDeceased: initialData.fatherDeceased || false,
    fatherMobile: initialData.fatherMobile || "",
    fatherEmail: initialData.fatherEmail || "",
    fatherOccupation: initialData.fatherOccupation || "",
    motherFirstName: initialData.motherFirstName || "",
    motherMiddleName: initialData.motherMiddleName || ".",
    motherLastName: initialData.motherLastName || "",
    motherDeceased: initialData.motherDeceased || false,
    motherMobile: initialData.motherMobile || "",
    motherEmail: initialData.motherEmail || "",
    motherOccupation: initialData.motherOccupation || "",
    currentHouse: initialData.currentHouse || "",
    currentCross: initialData.currentCross || "",
    currentArea: initialData.currentArea || "",
    currentDistrict: initialData.currentDistrict || "",
    currentCity: initialData.currentCity || "",
    currentPincode: initialData.currentPincode || "",
    currentState: initialData.currentState || "KARNATAKA",
    sameAsCurrent: initialData.sameAsCurrent || false,
    permanentHouse: initialData.permanentHouse || "",
    permanentCross: initialData.permanentCross || "",
    permanentArea: initialData.permanentArea || "",
    permanentDistrict: initialData.permanentDistrict || "",
    permanentCity: initialData.permanentCity || "",
    permanentPincode: initialData.permanentPincode || "",
    permanentState: initialData.permanentState || "KARNATAKA",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }

      // Auto-copy current address to permanent if checkbox is checked
      if (field.startsWith("current") && prev.sameAsCurrent) {
        const permanentField = field.replace("current", "permanent")
        newData[permanentField as keyof typeof newData] = value as any
      }

      return newData
    })

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleSameAsCurrentChange = (checked: boolean) => {
    setFormData((prev) => {
      const newData = { ...prev, sameAsCurrent: checked }

      if (checked) {
        newData.permanentHouse = prev.currentHouse
        newData.permanentCross = prev.currentCross
        newData.permanentArea = prev.currentArea
        newData.permanentDistrict = prev.currentDistrict
        newData.permanentCity = prev.currentCity
        newData.permanentPincode = prev.currentPincode
        newData.permanentState = prev.currentState
      }

      return newData
    })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Email validation
    if (!formData.studentEmail.trim()) {
      newErrors.studentEmail = "Student email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.studentEmail)) {
      newErrors.studentEmail = "Please enter a valid email address"
    }

    // Phone number validation
    if (!formData.callingNumber.trim()) {
      newErrors.callingNumber = "Calling number is required"
    } else if (!/^\d{10}$/.test(formData.callingNumber)) {
      newErrors.callingNumber = "Please enter a valid 10-digit phone number"
    }

    if (!formData.whatsappNumber.trim()) {
      newErrors.whatsappNumber = "WhatsApp number is required"
    } else if (!/^\d{10}$/.test(formData.whatsappNumber)) {
      newErrors.whatsappNumber = "Please enter a valid 10-digit phone number"
    }

    // Current address validation
    if (!formData.currentHouse.trim()) newErrors.currentHouse = "House name/number is required"
    if (!formData.currentArea.trim()) newErrors.currentArea = "Area/landmark is required"
    if (!formData.currentDistrict.trim()) newErrors.currentDistrict = "District is required"
    if (!formData.currentCity.trim()) newErrors.currentCity = "City is required"
    if (!formData.currentPincode.trim()) {
      newErrors.currentPincode = "PIN code is required"
    } else if (!/^\d{6}$/.test(formData.currentPincode)) {
      newErrors.currentPincode = "Please enter a valid 6-digit PIN code"
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

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8 steps-form">
        {/* Student Contact Information */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Student Contact Information</CardTitle>
            <CardDescription>Your primary contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="studentEmail">Email ID - Student *</Label>
              <Input
                id="studentEmail"
                type="email"
                value={formData.studentEmail}
                onChange={(e) => handleInputChange("studentEmail", e.target.value)}
                className={`w-full ${errors.studentEmail ? "border-red-500" : ""}`}
                placeholder="your.email@gmail.com"
              />
              {errors.studentEmail && <p className="text-sm text-red-500 mt-1">{errors.studentEmail}</p>}
              <p className="text-xs text-muted-foreground mt-1">Use a professional email like yourname@gmail.com</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="callingNumber">Calling Mobile Number *</Label>
                <Input
                  id="callingNumber"
                  value={formData.callingNumber}
                  onChange={(e) => handleInputChange("callingNumber", e.target.value)}
                  className={errors.callingNumber ? "border-red-500" : ""}
                  placeholder="10-digit number"
                  maxLength={10}
                />
                {errors.callingNumber && <p className="text-sm text-red-500 mt-1">{errors.callingNumber}</p>}
              </div>
              <div>
                <Label htmlFor="whatsappNumber">WhatsApp Mobile Number *</Label>
                <Input
                  id="whatsappNumber"
                  value={formData.whatsappNumber}
                  onChange={(e) => handleInputChange("whatsappNumber", e.target.value)}
                  className={errors.whatsappNumber ? "border-red-500" : ""}
                  placeholder="10-digit number"
                  maxLength={10}
                />
                {errors.whatsappNumber && <p className="text-sm text-red-500 mt-1">{errors.whatsappNumber}</p>}
              </div>
              <div>
                <Label htmlFor="altNumber">Alternative Mobile Number</Label>
                <Input
                  id="altNumber"
                  value={formData.altNumber}
                  onChange={(e) => handleInputChange("altNumber", e.target.value)}
                  placeholder="10-digit number"
                  maxLength={10}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parent/Guardian Details */}
        <Card>
          <CardHeader>
            <CardTitle>Parent/Guardian Details</CardTitle>
            <CardDescription>Information about your parents or guardians</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Father's Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Father's Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fatherFirstName">Father's First Name</Label>
                  <Input
                    id="fatherFirstName"
                    value={formData.fatherFirstName}
                    onChange={(e) => handleInputChange("fatherFirstName", e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="fatherMiddleName">Father's Middle Name</Label>
                  <Input
                    id="fatherMiddleName"
                    value={formData.fatherMiddleName}
                    onChange={(e) => handleInputChange("fatherMiddleName", e.target.value)}
                    placeholder="."
                  />
                </div>
                <div>
                  <Label htmlFor="fatherLastName">Father's Last Name</Label>
                  <Input
                    id="fatherLastName"
                    value={formData.fatherLastName}
                    onChange={(e) => handleInputChange("fatherLastName", e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fatherDeceased"
                    checked={formData.fatherDeceased}
                    onCheckedChange={(checked) => handleInputChange("fatherDeceased", checked as boolean)}
                  />
                  <Label htmlFor="fatherDeceased" className="text-sm">
                    Deceased (prefix "Late" will be added)
                  </Label>
                </div>
                <div>
                  <Label htmlFor="fatherMobile">Father's Mobile Number</Label>
                  <Input
                    id="fatherMobile"
                    value={formData.fatherMobile}
                    onChange={(e) => handleInputChange("fatherMobile", e.target.value)}
                    placeholder="10-digit number"
                    maxLength={10}
                  />
                </div>
                <div>
                  <Label htmlFor="fatherEmail">Father's Email ID (Optional)</Label>
                  <Input
                    id="fatherEmail"
                    type="email"
                    value={formData.fatherEmail}
                    onChange={(e) => handleInputChange("fatherEmail", e.target.value)}
                    placeholder="father@email.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="fatherOccupation">Father's Occupation</Label>
                  <Input
                    id="fatherOccupation"
                    value={formData.fatherOccupation}
                    onChange={(e) => handleInputChange("fatherOccupation", e.target.value)}
                    placeholder="e.g., GOVERNMENT EMPLOYEE, BUSINESS OWNER, FARMER"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Mother's Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Mother's Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="motherFirstName">Mother's First Name</Label>
                  <Input
                    id="motherFirstName"
                    value={formData.motherFirstName}
                    onChange={(e) => handleInputChange("motherFirstName", e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="motherMiddleName">Mother's Middle Name</Label>
                  <Input
                    id="motherMiddleName"
                    value={formData.motherMiddleName}
                    onChange={(e) => handleInputChange("motherMiddleName", e.target.value)}
                    placeholder="."
                  />
                </div>
                <div>
                  <Label htmlFor="motherLastName">Mother's Last Name</Label>
                  <Input
                    id="motherLastName"
                    value={formData.motherLastName}
                    onChange={(e) => handleInputChange("motherLastName", e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="motherDeceased"
                    checked={formData.motherDeceased}
                    onCheckedChange={(checked) => handleInputChange("motherDeceased", checked as boolean)}
                  />
                  <Label htmlFor="motherDeceased" className="text-sm">
                    Deceased (prefix "Late" will be added)
                  </Label>
                </div>
                <div>
                  <Label htmlFor="motherMobile">Mother's Mobile Number</Label>
                  <Input
                    id="motherMobile"
                    value={formData.motherMobile}
                    onChange={(e) => handleInputChange("motherMobile", e.target.value)}
                    placeholder="10-digit number"
                    maxLength={10}
                  />
                </div>
                <div>
                  <Label htmlFor="motherEmail">Mother's Email ID (Optional)</Label>
                  <Input
                    id="motherEmail"
                    type="email"
                    value={formData.motherEmail}
                    onChange={(e) => handleInputChange("motherEmail", e.target.value)}
                    placeholder="mother@email.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="motherOccupation">Mother's Occupation</Label>
                  <Input
                    id="motherOccupation"
                    value={formData.motherOccupation}
                    onChange={(e) => handleInputChange("motherOccupation", e.target.value)}
                    placeholder="e.g., HOMEMAKER, TEACHER, DOCTOR"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Details */}
        <Card>
          <CardHeader>
            <CardTitle>Address Details</CardTitle>
            <CardDescription>Current and permanent address information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Address */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Current Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currentHouse">House Name/Number *</Label>
                  <Input
                    id="currentHouse"
                    value={formData.currentHouse}
                    onChange={(e) => handleInputChange("currentHouse", e.target.value)}
                    className={errors.currentHouse ? "border-red-500" : ""}
                    placeholder="e.g., SHANTI NIVAS or #45/A"
                  />
                  {errors.currentHouse && <p className="text-sm text-red-500 mt-1">{errors.currentHouse}</p>}
                </div>
                <div>
                  <Label htmlFor="currentCross">Cross/Street Number</Label>
                  <Input
                    id="currentCross"
                    value={formData.currentCross}
                    onChange={(e) => handleInputChange("currentCross", e.target.value)}
                    placeholder="e.g., 2ND CROSS or 3RD MAIN"
                  />
                </div>
                <div>
                  <Label htmlFor="currentArea">Area/Landmark *</Label>
                  <Input
                    id="currentArea"
                    value={formData.currentArea}
                    onChange={(e) => handleInputChange("currentArea", e.target.value)}
                    className={errors.currentArea ? "border-red-500" : ""}
                    placeholder="e.g., MUNESHWARA NAGARA"
                  />
                  {errors.currentArea && <p className="text-sm text-red-500 mt-1">{errors.currentArea}</p>}
                </div>
                <div>
                  <Label htmlFor="currentDistrict">District *</Label>
                  <Input
                    id="currentDistrict"
                    value={formData.currentDistrict}
                    onChange={(e) => handleInputChange("currentDistrict", e.target.value)}
                    className={errors.currentDistrict ? "border-red-500" : ""}
                    placeholder="Enter district"
                  />
                  {errors.currentDistrict && <p className="text-sm text-red-500 mt-1">{errors.currentDistrict}</p>}
                </div>
                <div>
                  <Label htmlFor="currentCity">City *</Label>
                  <Input
                    id="currentCity"
                    value={formData.currentCity}
                    onChange={(e) => handleInputChange("currentCity", e.target.value)}
                    className={errors.currentCity ? "border-red-500" : ""}
                    placeholder="Enter city"
                  />
                  {errors.currentCity && <p className="text-sm text-red-500 mt-1">{errors.currentCity}</p>}
                </div>
                <div>
                  <Label htmlFor="currentPincode">PIN Code *</Label>
                  <Input
                    id="currentPincode"
                    value={formData.currentPincode}
                    onChange={(e) => handleInputChange("currentPincode", e.target.value)}
                    className={errors.currentPincode ? "border-red-500" : ""}
                    placeholder="6-digit PIN code"
                    maxLength={6}
                  />
                  {errors.currentPincode && <p className="text-sm text-red-500 mt-1">{errors.currentPincode}</p>}
                </div>
              </div>
            </div>

            <Separator />

            {/* Permanent Address */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Permanent Address</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sameAsCurrent"
                    checked={formData.sameAsCurrent}
                    onCheckedChange={handleSameAsCurrentChange}
                  />
                  <Label htmlFor="sameAsCurrent" className="text-sm">
                    Same as Current Address
                  </Label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="permanentHouse">House Name/Number</Label>
                  <Input
                    id="permanentHouse"
                    value={formData.permanentHouse}
                    onChange={(e) => handleInputChange("permanentHouse", e.target.value)}
                    disabled={formData.sameAsCurrent}
                    placeholder="e.g., SHANTI NIVAS or #45/A"
                  />
                </div>
                <div>
                  <Label htmlFor="permanentCross">Cross/Street Number</Label>
                  <Input
                    id="permanentCross"
                    value={formData.permanentCross}
                    onChange={(e) => handleInputChange("permanentCross", e.target.value)}
                    disabled={formData.sameAsCurrent}
                    placeholder="e.g., 2ND CROSS"
                  />
                </div>
                <div>
                  <Label htmlFor="permanentArea">Area/Landmark</Label>
                  <Input
                    id="permanentArea"
                    value={formData.permanentArea}
                    onChange={(e) => handleInputChange("permanentArea", e.target.value)}
                    disabled={formData.sameAsCurrent}
                    placeholder="e.g., MUNESHWARA NAGARA"
                  />
                </div>
                <div>
                  <Label htmlFor="permanentDistrict">District</Label>
                  <Input
                    id="permanentDistrict"
                    value={formData.permanentDistrict}
                    onChange={(e) => handleInputChange("permanentDistrict", e.target.value)}
                    disabled={formData.sameAsCurrent}
                    placeholder="Enter district"
                  />
                </div>
                <div>
                  <Label htmlFor="permanentCity">City</Label>
                  <Input
                    id="permanentCity"
                    value={formData.permanentCity}
                    onChange={(e) => handleInputChange("permanentCity", e.target.value)}
                    disabled={formData.sameAsCurrent}
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <Label htmlFor="permanentPincode">PIN Code</Label>
                  <Input
                    id="permanentPincode"
                    value={formData.permanentPincode}
                    onChange={(e) => handleInputChange("permanentPincode", e.target.value)}
                    disabled={formData.sameAsCurrent}
                    placeholder="6-digit PIN code"
                    maxLength={6}
                  />
                </div>
              </div>
            </div>
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

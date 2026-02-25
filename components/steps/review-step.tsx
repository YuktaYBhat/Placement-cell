"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { IconArrowLeft, IconDownload, IconSend } from "@tabler/icons-react"
import { LoadingSpinner } from "@/components/ui/loading"
import { toast } from "sonner"

interface ReviewStepProps {
  onPrevious: () => void
  formData: any
}

export function ReviewStep({ onPrevious, formData }: ReviewStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleSubmit = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      // Flatten formData into DB-compatible field names
      const personalInfo = formData?.personalInfo || {}
      const contactDetails = formData?.contactDetails || {}
      const addressDetails = formData?.addressDetails || {}
      const tenthDetails = formData?.tenthDetails || {}
      const twelfthDiplomaDetails = formData?.twelfthDiplomaDetails || {}
      const engineeringDetails = formData?.engineeringDetails || {}
      const engineeringAcademicDetails = formData?.engineeringAcademicDetails || {}
      const collegeIdDetails = formData?.collegeIdDetails || {}

      const dbData: Record<string, any> = {
        // Personal Info
        firstName: personalInfo.firstName || undefined,
        middleName: personalInfo.middleName || ".",
        lastName: personalInfo.lastName || undefined,
        dateOfBirth: personalInfo.dateOfBirth ? new Date(personalInfo.dateOfBirth).toISOString() : undefined,
        gender: personalInfo.gender || undefined,
        bloodGroup: personalInfo.bloodGroup || undefined,
        state: personalInfo.state || undefined,
        stateOfDomicile: personalInfo.state || undefined,
        nationality: personalInfo.nationality || undefined,
        category: personalInfo.category || undefined,
        casteCategory: personalInfo.category || undefined,
        profilePhoto: personalInfo.profilePhoto || undefined,

        // Contact Details
        studentEmail: contactDetails.studentEmail || contactDetails.email || undefined,
        email: contactDetails.studentEmail || contactDetails.email || undefined,
        callingMobile: contactDetails.callingMobile || contactDetails.callingNumber || undefined,
        callingNumber: contactDetails.callingMobile || contactDetails.callingNumber || undefined,
        whatsappMobile: contactDetails.whatsappMobile || contactDetails.whatsappNumber || undefined,
        whatsappNumber: contactDetails.whatsappMobile || contactDetails.whatsappNumber || undefined,
        alternativeMobile: contactDetails.alternativeMobile || contactDetails.altNumber || undefined,
        altNumber: contactDetails.alternativeMobile || contactDetails.altNumber || undefined,

        // Parent Details
        fatherFirstName: contactDetails.fatherFirstName || undefined,
        fatherMiddleName: contactDetails.fatherMiddleName || ".",
        fatherLastName: contactDetails.fatherLastName || undefined,
        fatherName: contactDetails.fatherName || undefined,
        fatherMobile: contactDetails.fatherMobile || undefined,
        fatherEmail: contactDetails.fatherEmail || undefined,
        fatherOccupation: contactDetails.fatherOccupation || undefined,
        motherFirstName: contactDetails.motherFirstName || undefined,
        motherMiddleName: contactDetails.motherMiddleName || ".",
        motherLastName: contactDetails.motherLastName || undefined,
        motherName: contactDetails.motherName || undefined,
        motherMobile: contactDetails.motherMobile || undefined,
        motherEmail: contactDetails.motherEmail || undefined,
        motherOccupation: contactDetails.motherOccupation || undefined,

        // Address Details
        currentHouse: addressDetails.currentHouse || undefined,
        currentCross: addressDetails.currentCross || undefined,
        currentArea: addressDetails.currentArea || undefined,
        currentDistrict: addressDetails.currentDistrict || undefined,
        currentCity: addressDetails.currentCity || undefined,
        currentPincode: addressDetails.currentPincode || undefined,
        currentState: addressDetails.currentState || undefined,
        sameAsCurrent: addressDetails.sameAsCurrent || false,
        permanentHouse: addressDetails.permanentHouse || undefined,
        permanentCross: addressDetails.permanentCross || undefined,
        permanentArea: addressDetails.permanentArea || undefined,
        permanentDistrict: addressDetails.permanentDistrict || undefined,
        permanentCity: addressDetails.permanentCity || undefined,
        permanentPincode: addressDetails.permanentPincode || undefined,
        permanentState: addressDetails.permanentState || undefined,

        // 10th Details
        tenthSchool: tenthDetails.tenthSchool || tenthDetails.tenthSchoolName || undefined,
        tenthSchoolName: tenthDetails.tenthSchoolName || tenthDetails.tenthSchool || undefined,
        tenthArea: tenthDetails.tenthArea || undefined,
        tenthDistrict: tenthDetails.tenthDistrict || undefined,
        tenthCity: tenthDetails.tenthCity || undefined,
        tenthPincode: tenthDetails.tenthPincode || undefined,
        tenthState: tenthDetails.tenthState || undefined,
        tenthBoard: tenthDetails.tenthBoard || undefined,
        tenthPassingYear: tenthDetails.tenthPassingYear ? parseInt(tenthDetails.tenthPassingYear) : undefined,
        tenthPassingMonth: tenthDetails.tenthPassingMonth || undefined,
        tenthPercentage: tenthDetails.tenthPercentage ? parseFloat(tenthDetails.tenthPercentage) : undefined,
        tenthAreaDistrictCity: tenthDetails.tenthAreaDistrictCity || undefined,
        tenthMarksCard: tenthDetails.tenthMarksCard || undefined,

        // 12th / Diploma Details
        academicLevel: twelfthDiplomaDetails.twelfthOrDiploma || undefined,
        twelfthSchool: twelfthDiplomaDetails.twelfthSchool || twelfthDiplomaDetails.twelfthSchoolName || undefined,
        twelfthSchoolName: twelfthDiplomaDetails.twelfthSchoolName || twelfthDiplomaDetails.twelfthSchool || undefined,
        twelfthArea: twelfthDiplomaDetails.twelfthArea || undefined,
        twelfthDistrict: twelfthDiplomaDetails.twelfthDistrict || undefined,
        twelfthCity: twelfthDiplomaDetails.twelfthCity || undefined,
        twelfthPincode: twelfthDiplomaDetails.twelfthPincode || undefined,
        twelfthState: twelfthDiplomaDetails.twelfthState || undefined,
        twelfthBoard: twelfthDiplomaDetails.twelfthBoard || undefined,
        twelfthPassingYear: twelfthDiplomaDetails.twelfthPassingYear ? parseInt(twelfthDiplomaDetails.twelfthPassingYear) : undefined,
        twelfthPassingMonth: twelfthDiplomaDetails.twelfthPassingMonth || undefined,
        twelfthPercentage: (twelfthDiplomaDetails.twelfthStatePercentage || twelfthDiplomaDetails.twelfthPercentage) ? parseFloat(twelfthDiplomaDetails.twelfthStatePercentage || twelfthDiplomaDetails.twelfthPercentage) : undefined,
        twelfthMarksCard: twelfthDiplomaDetails.twelfthMarksCard || undefined,
        twelfthCbseSubjects: twelfthDiplomaDetails.twelfthCbseSubjects || undefined,
        twelfthCbseMarks: twelfthDiplomaDetails.twelfthCbseMarks || undefined,
        twelfthIcseMarks: twelfthDiplomaDetails.twelfthIcseMarks || undefined,

        diplomaCollege: twelfthDiplomaDetails.diplomaCollege || undefined,
        diplomaArea: twelfthDiplomaDetails.diplomaArea || undefined,
        diplomaDistrict: twelfthDiplomaDetails.diplomaDistrict || undefined,
        diplomaCity: twelfthDiplomaDetails.diplomaCity || undefined,
        diplomaPincode: twelfthDiplomaDetails.diplomaPincode || undefined,
        diplomaState: twelfthDiplomaDetails.diplomaState || undefined,
        diplomaPercentage: twelfthDiplomaDetails.diplomaPercentage ? parseFloat(twelfthDiplomaDetails.diplomaPercentage) : undefined,
        diplomaCertificates: twelfthDiplomaDetails.diplomaCertificates || twelfthDiplomaDetails.diplomaCertificate || undefined,
        diplomaFirstYear: twelfthDiplomaDetails.diplomaFirstYear || undefined,
        diplomaSecondYear: twelfthDiplomaDetails.diplomaSecondYear || undefined,
        diplomaThirdYear: twelfthDiplomaDetails.diplomaThirdYear || undefined,
        diplomaSemesters: twelfthDiplomaDetails.diplomaSemesters || undefined,

        // Engineering Details
        collegeName: engineeringDetails.collegeName || undefined,
        usn: engineeringDetails.usn || undefined,
        branch: engineeringDetails.branch || undefined,
        entryType: engineeringDetails.entryType || undefined,
        seatCategory: engineeringDetails.seatCategory || undefined,
        libraryId: engineeringDetails.libraryId || undefined,
        batch: engineeringDetails.batch || undefined,
        branchMentor: engineeringDetails.branchMentor || undefined,
        linkedinLink: engineeringDetails.linkedinLink || undefined,
        githubLink: engineeringDetails.githubLink || undefined,
        leetcodeLink: engineeringDetails.leetcodeLink || undefined,
        district: engineeringDetails.district || undefined,
        pincode: engineeringDetails.pincode || undefined,

        // Engineering Academic Details
        finalCgpa: engineeringAcademicDetails.finalCgpa ? parseFloat(engineeringAcademicDetails.finalCgpa) : undefined,
        hasBacklogs: engineeringAcademicDetails.hasBacklogs || undefined,
        activeBacklogs: engineeringAcademicDetails.hasBacklogs === "yes",
        backlogs: engineeringAcademicDetails.backlogs || undefined,
        semesters: engineeringDetails.semesters || undefined,
        resumeUpload: engineeringDetails.resumeUpload || undefined,
        resume: engineeringDetails.resumeUpload || undefined,

        // College ID
        collegeIdCard: collegeIdDetails.collegeIdCard || undefined,

        // Completion flags
        isComplete: true,
        kycStatus: "PENDING",
        completionStep: 6,
      }

      // Remove undefined values
      Object.keys(dbData).forEach(key => {
        if (dbData[key] === undefined) {
          delete dbData[key]
        }
      })

      // Send all form data to the API
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit profile")
      }

      toast.success("Profile submitted successfully! Your KYC verification is pending.", {
        duration: 5000,
        description: "Please visit the Placement Cell with your documents."
      })

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 2000)
    } catch (error) {
      console.error("Submit error:", error)
      toast.error("Failed to submit profile. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownload = () => {
    setIsDownloading(true)
    // TODO: Implement PDF generation
    toast.info("PDF download will be available soon!")
    setTimeout(() => setIsDownloading(false), 1000)
  }

  // Helper to format date
  const formatDate = (dateStr: string | Date | undefined) => {
    if (!dateStr) return "Not provided"
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    } catch {
      return String(dateStr)
    }
  }

  // Extract data from nested structure - matching the profile-completion.tsx structure
  const personalInfo = formData?.personalInfo || {}
  const contactDetails = formData?.contactDetails || {}
  const addressDetails = formData?.addressDetails || {}
  const tenthDetails = formData?.tenthDetails || {}
  const twelfthDiplomaDetails = formData?.twelfthDiplomaDetails || {}
  const engineeringDetails = formData?.engineeringDetails || {}
  const engineeringAcademicDetails = formData?.engineeringAcademicDetails || {}

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-8">
        {/* Submission Notice */}
        <p className="text-sm text-muted-foreground">
          Your KYC verification is pending. Please visit the Placement Cell with all submitted documents for verification.
        </p>

        {/* Personal Information Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">
                  {personalInfo.firstName || "Not provided"} {personalInfo.middleName || ""} {personalInfo.lastName || ""}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">
                  {formatDate(personalInfo.dateOfBirth)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium">{personalInfo.gender || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Blood Group</p>
                <p className="font-medium">{personalInfo.bloodGroup || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <Badge variant="secondary">{personalInfo.category || personalInfo.casteCategory || "Not provided"}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">State of Domicile</p>
                <p className="font-medium">{personalInfo.state || personalInfo.stateOfDomicile || "Not provided"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Student Email</p>
                <p className="font-medium">{contactDetails.studentEmail || contactDetails.email || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Calling Number</p>
                <p className="font-medium">{contactDetails.callingMobile || contactDetails.callingNumber || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">WhatsApp Number</p>
                <p className="font-medium">{contactDetails.whatsappMobile || contactDetails.whatsappNumber || "Not provided"}</p>
              </div>
              {(contactDetails.alternativeMobile || contactDetails.altNumber) && (
                <div>
                  <p className="text-sm text-muted-foreground">Alternative Number</p>
                  <p className="font-medium">{contactDetails.alternativeMobile || contactDetails.altNumber}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Parent Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Father's Name</p>
                <p className="font-medium">{contactDetails.fatherName || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Father's Mobile</p>
                <p className="font-medium">{contactDetails.fatherMobile || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mother's Name</p>
                <p className="font-medium">{contactDetails.motherName || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mother's Mobile</p>
                <p className="font-medium">{contactDetails.motherMobile || "Not provided"}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-3">Current Address</h4>
              <p className="text-sm">
                {addressDetails.currentHouse || "Not provided"},
                {addressDetails.currentCross && ` ${addressDetails.currentCross}, `}
                {addressDetails.currentArea || ""},
                {addressDetails.currentCity || ""},
                {addressDetails.currentDistrict || ""} -
                {addressDetails.currentPincode || ""},
                {addressDetails.currentState || ""}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 10th Standard Summary */}
        <Card>
          <CardHeader>
            <CardTitle>10th Standard Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">School Name</p>
                <p className="font-medium">{tenthDetails.tenthSchoolName || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{tenthDetails.tenthAreaDistrictCity || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Board</p>
                <p className="font-medium">{tenthDetails.tenthBoard || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Year of Passing</p>
                <p className="font-medium">{tenthDetails.tenthPassingYear || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Month of Passing</p>
                <p className="font-medium">{tenthDetails.tenthPassingMonth || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Percentage</p>
                <p className="font-medium">{tenthDetails.tenthPercentage ? `${tenthDetails.tenthPercentage}%` : "Not provided"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 12th/Diploma Summary */}
        <Card>
          <CardHeader>
            <CardTitle>
              {twelfthDiplomaDetails.twelfthOrDiploma === 'Diploma' ? 'Diploma Details' : '12th Standard Details'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {twelfthDiplomaDetails.twelfthOrDiploma === 'Diploma' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">College Name</p>
                  <p className="font-medium">{twelfthDiplomaDetails.diplomaCollege || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">
                    {[twelfthDiplomaDetails.diplomaArea, twelfthDiplomaDetails.diplomaDistrict, twelfthDiplomaDetails.diplomaCity].filter(Boolean).join(', ') || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Percentage</p>
                  <p className="font-medium">{twelfthDiplomaDetails.diplomaPercentage ? `${twelfthDiplomaDetails.diplomaPercentage}%` : "Not provided"}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">School Name</p>
                  <p className="font-medium">{twelfthDiplomaDetails.twelfthSchoolName || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">
                    {[twelfthDiplomaDetails.twelfthArea, twelfthDiplomaDetails.twelfthDistrict, twelfthDiplomaDetails.twelfthCity].filter(Boolean).join(', ') || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Board</p>
                  <p className="font-medium">{twelfthDiplomaDetails.twelfthBoard || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Year of Passing</p>
                  <p className="font-medium">{twelfthDiplomaDetails.twelfthPassingYear || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Percentage</p>
                  <p className="font-medium">{twelfthDiplomaDetails.twelfthStatePercentage ? `${twelfthDiplomaDetails.twelfthStatePercentage}%` : "Not provided"}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Engineering Details Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Engineering Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">College Name</p>
                <p className="font-medium">{engineeringDetails.collegeName || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">USN</p>
                <p className="font-medium">{engineeringDetails.usn || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Branch</p>
                <p className="font-medium">{engineeringDetails.branch || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entry Type</p>
                <p className="font-medium">{engineeringDetails.entryType || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Seat Category</p>
                <p className="font-medium">{engineeringDetails.seatCategory || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Library ID</p>
                <p className="font-medium">{engineeringDetails.libraryId || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Branch Mentor</p>
                <p className="font-medium">{engineeringDetails.branchMentor || engineeringDetails.branchMentorName || "Not provided"}</p>
              </div>
            </div>

            <Separator />

            <h4 className="font-medium">Academic Performance</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Final CGPA</p>
                <p className="font-medium text-lg">{engineeringAcademicDetails.finalCgpa || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Backlogs</p>
                <p className="font-medium">{engineeringAcademicDetails.activeBacklogs ? "Yes" : "No"}</p>
              </div>
            </div>

            <Separator />

            <h4 className="font-medium">Social Profiles</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(engineeringDetails.linkedinLink || engineeringDetails.linkedin) && (
                <div>
                  <p className="text-sm text-muted-foreground">LinkedIn</p>
                  <p className="font-medium truncate">{engineeringDetails.linkedinLink || engineeringDetails.linkedin}</p>
                </div>
              )}
              {(engineeringDetails.githubLink || engineeringDetails.github) && (
                <div>
                  <p className="text-sm text-muted-foreground">GitHub</p>
                  <p className="font-medium truncate">{engineeringDetails.githubLink || engineeringDetails.github}</p>
                </div>
              )}
              {(engineeringDetails.leetcodeLink || engineeringDetails.leetcode) && (
                <div>
                  <p className="text-sm text-muted-foreground">LeetCode</p>
                  <p className="font-medium truncate">{engineeringDetails.leetcodeLink || engineeringDetails.leetcode}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <IconArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleDownload}
              disabled={isDownloading || isSubmitting}
              className="flex items-center gap-2"
            >
              {isDownloading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <IconDownload className="h-4 w-4" />
              )}
              Download Summary
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              size="lg"
              className="px-8 py-3 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Submitting...
                </>
              ) : (
                <>
                  <IconSend className="h-4 w-4" />
                  Submit Form
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
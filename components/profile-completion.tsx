"use client"

import { useState } from "react"
import { PersonalInfoStep } from "@/components/steps/personal-info-step"
import { ContactDetailsStep } from "@/components/steps/contact-details-step"
import { AcademicDetailsStep } from "@/components/steps/academic-details-step"
import { EngineeringDetailsStep } from "@/components/steps/engineering-details-step"
import { CollegeIdStep } from "@/components/steps/college-id-step"
import { ReviewStep } from "@/components/steps/review-step"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Circle } from "lucide-react"

enum Step {
    PERSONAL_INFO = 1,
    CONTACT_DETAILS = 2,
    ACADEMIC_DETAILS = 3,
    ENGINEERING_DETAILS = 4,
    COLLEGE_ID = 5,
    REVIEW = 6,
}

export function ProfileCompletion({ profile }: { profile: any }) {
    const [currentStep, setCurrentStep] = useState<Step>(Step.PERSONAL_INFO)
    // Extract document data from profile.user.document
    const documentData = profile?.user?.document || {}

    const [formData, setFormData] = useState<any>({
        personalInfo: {
            firstName: profile?.firstName ?? "",
            middleName: profile?.middleName ?? "",
            lastName: profile?.lastName ?? "",
            gender: profile?.gender ?? "",
            dateOfBirth: profile?.dateOfBirth ?? "",
            bloodGroup: profile?.bloodGroup ?? "",
            state: profile?.state || profile?.stateOfDomicile || "KARNATAKA",
            nationality: profile?.nationality || "Indian",
            category: profile?.category || profile?.casteCategory || "",
            profilePhoto: profile?.profilePhoto || null,
        },

        contactDetails: {
            studentEmail: profile?.studentEmail || profile?.email || "",
            callingNumber: profile?.callingNumber || profile?.callingMobile || "",
            whatsappNumber: profile?.whatsappNumber || profile?.whatsappMobile || "",
            altNumber: profile?.altNumber || profile?.alternativeMobile || "",
            fatherFirstName: profile?.fatherFirstName || "",
            fatherMiddleName: profile?.fatherMiddleName || ".",
            fatherLastName: profile?.fatherLastName || "",
            fatherName: profile?.fatherName || "",
            fatherDeceased: profile?.fatherDeceased || false,
            fatherMobile: profile?.fatherMobile || "",
            fatherEmail: profile?.fatherEmail || "",
            fatherOccupation: profile?.fatherOccupation || "",
            motherFirstName: profile?.motherFirstName || "",
            motherMiddleName: profile?.motherMiddleName || ".",
            motherLastName: profile?.motherLastName || "",
            motherName: profile?.motherName || "",
            motherDeceased: profile?.motherDeceased || false,
            motherMobile: profile?.motherMobile || "",
            motherEmail: profile?.motherEmail || "",
            motherOccupation: profile?.motherOccupation || "",
        },

        addressDetails: {
            currentHouse: profile?.currentHouse || "",
            currentCross: profile?.currentCross || "",
            currentArea: profile?.currentArea || "",
            currentDistrict: profile?.currentDistrict || "",
            currentCity: profile?.currentCity || "",
            currentPincode: profile?.currentPincode || "",
            currentState: profile?.currentState || "KARNATAKA",
            sameAsCurrent: profile?.sameAsCurrent || false,
            permanentHouse: profile?.permanentHouse || "",
            permanentCross: profile?.permanentCross || "",
            permanentArea: profile?.permanentArea || "",
            permanentDistrict: profile?.permanentDistrict || "",
            permanentCity: profile?.permanentCity || "",
            permanentPincode: profile?.permanentPincode || "",
            permanentState: profile?.permanentState || "KARNATAKA",
        },

        tenthDetails: {
            tenthSchool: profile?.tenthSchoolName ?? "",
            tenthBoard: profile?.tenthBoard ?? "",
            tenthPercentage: profile?.tenthPercentage ?? "",
            tenthPassingYear: profile?.tenthPassingYear ?? "",
            tenthMarksCard: documentData.tenthMarksCardLink || profile?.tenthMarksCard || null, // Prioritize Document model
        },

        twelfthDiplomaDetails: {
            twelfthSchool: profile?.twelfthSchoolName ?? "",
            twelfthPercentage: profile?.twelfthStatePercentage ?? "",
            diplomaCollege: profile?.diplomaCollege ?? "",
            diplomaPercentage: profile?.diplomaPercentage ?? "",
            twelfthMarksCard: documentData.twelfthMarksCardLink || profile?.twelfthMarksCard || null, // Prioritize Document model
        },

        engineeringDetails: {
            collegeName: profile?.collegeName ?? "",
            usn: documentData.usn || profile?.usn || "", // Prioritize Document model
            branch: profile?.branch ?? "",
            entryType: profile?.entryType ?? "",
            seatCategory: profile?.seatCategory ?? "",
            libraryId: profile?.libraryId ?? "",
            batch: profile?.batch ?? "",
            branchMentor: profile?.branchMentor ?? "",
            linkedinLink: profile?.linkedinLink || profile?.linkedin || "",
            githubLink: profile?.githubLink || profile?.github || "",
            leetcodeLink: profile?.leetcodeLink || profile?.leetcode || "",
        },

        engineeringAcademicDetails: {
            finalCgpa: documentData.cgpa?.toString() || profile?.finalCgpa || "", // Prioritize Document model
            activeBacklogs: profile?.activeBacklogs ?? false,
        },

        collegeIdDetails: {
            collegeIdCard: profile?.collegeIdCard ?? null,
        },
    })


    const steps = [
        { id: Step.PERSONAL_INFO, label: "Personal Info" },
        { id: Step.CONTACT_DETAILS, label: "Contact" },
        { id: Step.ACADEMIC_DETAILS, label: "Academic" },
        { id: Step.ENGINEERING_DETAILS, label: "Engineering" },
        { id: Step.COLLEGE_ID, label: "College ID" },
        { id: Step.REVIEW, label: "Review" },
    ]

    const handleNext = (data: any) => {
        setFormData((prev: any) => {
            const updated = { ...prev }

            switch (currentStep) {
                case Step.PERSONAL_INFO:
                    updated.personalInfo = data
                    break

                case Step.CONTACT_DETAILS:
                    // Store all raw data from the step, and then add computed/mapped fields
                    updated.contactDetails = {
                        ...data,
                        // Mapped keys for DB compatibility
                        email: data.studentEmail,
                        callingMobile: data.callingNumber,
                        whatsappMobile: data.whatsappNumber,
                        alternativeMobile: data.altNumber,

                        // Parent details. Full names computed here for convenience, or can be done in ReviewStep
                        fatherName: `${data.fatherFirstName || ""} ${data.fatherMiddleName || ""} ${data.fatherLastName || ""}`.replace(/\s+/g, " ").trim(),
                        motherName: `${data.motherFirstName || ""} ${data.motherMiddleName || ""} ${data.motherLastName || ""}`.replace(/\s+/g, " ").trim(),
                    }
                    // Store address fields separately
                    updated.addressDetails = {
                        currentHouse: data.currentHouse,
                        currentCross: data.currentCross,
                        currentArea: data.currentArea,
                        currentDistrict: data.currentDistrict,
                        currentCity: data.currentCity,
                        currentPincode: data.currentPincode,
                        currentState: data.currentState,
                        sameAsCurrent: data.sameAsCurrent,
                        permanentHouse: data.permanentHouse,
                        permanentCross: data.permanentCross,
                        permanentArea: data.permanentArea,
                        permanentDistrict: data.permanentDistrict,
                        permanentCity: data.permanentCity,
                        permanentPincode: data.permanentPincode,
                        permanentState: data.permanentState,
                    }
                    break

                case Step.ACADEMIC_DETAILS:
                    updated.rawAcademicDetails = data
                    // Map AcademicDetailsStep output to ReviewStep expectations
                    updated.tenthDetails = {
                        tenthSchoolName: data.tenthSchool,
                        tenthAreaDistrictCity: `${data.tenthArea || ""}, ${data.tenthDistrict || ""}, ${data.tenthCity || ""}`,
                        tenthBoard: data.tenthBoard,
                        tenthPassingYear: data.tenthPassingYear,
                        tenthPassingMonth: data.tenthPassingMonth,
                        tenthPercentage: data.tenthPercentage,
                        tenthMarksCard: data.tenthMarksCard,
                        // Include all raw fields for the review step as well
                        ...data
                    }

                    updated.twelfthDiplomaDetails = {
                        twelfthOrDiploma: data.academicLevel,

                        // 12th fields
                        twelfthSchoolName: data.twelfthSchool,
                        twelfthArea: data.twelfthArea,
                        twelfthDistrict: data.twelfthDistrict,
                        twelfthCity: data.twelfthCity,
                        twelfthBoard: data.twelfthBoard,
                        twelfthPassingYear: data.twelfthPassingYear,
                        twelfthStatePercentage: data.twelfthPercentage,
                        twelfthMarksCard: data.twelfthMarksCard,

                        // Diploma fields
                        diplomaCollege: data.diplomaCollege,
                        diplomaArea: data.diplomaArea,
                        diplomaDistrict: data.diplomaDistrict,
                        diplomaCity: data.diplomaCity,
                        diplomaPercentage: data.diplomaPercentage,
                        diplomaCertificates: data.diplomaCertificates,

                        // Include raw choice data
                        ...data
                    }
                    break

                case Step.ENGINEERING_DETAILS:
                    updated.engineeringDetails = data // collegeName, usn, etc match

                    updated.engineeringAcademicDetails = {
                        ...data,
                        activeBacklogs: data.hasBacklogs === "yes",
                        finalCgpa: data.finalCgpa,
                    }
                    break

                case Step.COLLEGE_ID:
                    updated.collegeIdDetails = data
                    break
            }

            return updated
        })

        setCurrentStep((prev) => prev + 1)
    }

    const handlePrevious = () => {
        setCurrentStep((prev) => Math.max(1, prev - 1))
    }

    const renderStep = () => {
        switch (currentStep) {
            case Step.PERSONAL_INFO:
                return (
                    <PersonalInfoStep
                        onNext={handleNext}
                        initialData={formData.personalInfo}
                    />
                )
            case Step.CONTACT_DETAILS:
                return (
                    <ContactDetailsStep
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        initialData={{ ...formData.contactDetails, ...formData.addressDetails }}
                    />
                )
            case Step.ACADEMIC_DETAILS:
                return (
                    <AcademicDetailsStep
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        initialData={formData.rawAcademicDetails || {}}
                    />
                )
            case Step.ENGINEERING_DETAILS:
                return (
                    <EngineeringDetailsStep
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        initialData={formData.engineeringDetails}
                    />
                )
            case Step.COLLEGE_ID:
                return (
                    <CollegeIdStep
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        initialData={formData.collegeIdDetails}
                    />
                )
            case Step.REVIEW:
                return (
                    <ReviewStep
                        onPrevious={handlePrevious}
                        formData={formData}
                    />
                )
            default:
                return null
        }
    }

    return (
        <div className="space-y-8">
            {/* Stepper */}
            <div className="relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10" />
                <div className="flex justify-between max-w-4xl mx-auto px-4">
                    {steps.map((step) => {
                        const isCompleted = currentStep > step.id
                        const isCurrent = currentStep === step.id

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2">
                                <div
                                    className={`
                                        w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200
                                        ${isCompleted ? "bg-green-600 border-green-600 text-white" :
                                            isCurrent ? "bg-blue-600 border-blue-600 text-white" :
                                                "bg-background border-gray-300 text-gray-400"}
                                    `}
                                >
                                    {isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5" />
                                    ) : (
                                        <span className="text-xs font-semibold">{step.id}</span>
                                    )}
                                </div>
                                <span className={`text-xs font-medium ${isCurrent ? "text-blue-600" : "text-muted-foreground"} hidden sm:block`}>
                                    {step.label}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Step Content */}
            <div className="mt-8">
                {renderStep()}
            </div>
        </div>
    )
}

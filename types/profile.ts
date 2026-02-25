// Comprehensive Profile Types for Complete Student Registration

export interface PersonalInfo {
  firstName: string
  middleName: string
  lastName: string
  dateOfBirth: Date
  gender: 'MALE' | 'FEMALE'
  bloodGroup: 'A_POSITIVE' | 'A_NEGATIVE' | 'B_POSITIVE' | 'B_NEGATIVE' | 'AB_POSITIVE' | 'AB_NEGATIVE' | 'O_POSITIVE' | 'O_NEGATIVE'
  stateOfDomicile: string
  nationality: string
  casteCategory: 'GEN' | 'OBC' | 'SC' | 'ST'
  profilePhoto?: string
}

export interface ContactAndParentDetails {
  // Student Contact Details
  email: string
  callingMobile: string
  whatsappMobile: string
  alternativeMobile?: string

  // Parent/Guardian Details
  fatherName?: string
  fatherDeceased: boolean
  fatherMobile?: string
  fatherEmail?: string
  fatherOccupation?: string
  motherName?: string
  motherDeceased: boolean
  motherMobile?: string
  motherEmail?: string
  motherOccupation?: string
}

export interface AddressDetails {
  // Current address individual fields
  currentHouse?: string
  currentCross?: string
  currentArea?: string
  currentDistrict?: string
  currentCity?: string
  currentPincode?: string
  currentState?: string
  currentAddress?: string // Combined computed field

  // Permanent address individual fields
  permanentHouse?: string
  permanentCross?: string
  permanentArea?: string
  permanentDistrict?: string
  permanentCity?: string
  permanentPincode?: string
  permanentState?: string
  permanentAddress?: string // Combined computed field

  sameAsCurrent: boolean
  country: string
}

export interface TenthStandardDetails {
  tenthSchoolName: string
  tenthAreaDistrictCity: string
  tenthPincode: string
  tenthState: string
  tenthBoard: 'STATE' | 'CBSE' | 'ICSE'
  tenthPassingYear: number
  tenthPassingMonth: number
  tenthMarksType: 'PERCENTAGE' | 'SUBJECTS_TOTAL' | 'OUT_OF_1000'
  tenthPercentage?: number
  tenthSubjects?: number
  tenthTotalMarks?: number
  tenthMarksOutOf1000?: number
  tenthMarksCard: string
}

export interface TwelfthStandardDetails {
  twelfthSchoolName: string
  twelfthAreaDistrictCity: string
  twelfthPincode: string
  twelfthState: string
  twelfthBoard: 'STATE' | 'CBSE' | 'ICSE'
  twelfthPassingYear: number
  twelfthPassingMonth: number
  twelfthMarksType: 'PERCENTAGE' | 'SUBJECTS_TOTAL' | 'OUT_OF_1000'
  twelfthPercentage?: number
  twelfthSubjects?: number
  twelfthTotalMarks?: number
  twelfthMarksOutOf1000?: number
  twelfthMarksCard: string
}

export interface DiplomaDetails {
  collegeName: string
  city: string
  district: string
  pincode: string
  state: string
  stream: string
  certificate: string
  semesterSgpa?: Array<{ semester: number, sgpa: number }>
  yearMarks?: Array<{ year: number, marks: number }>
  percentage: number
}

export interface AcademicDetails {
  tenthStandard: TenthStandardDetails
  educationPath: 'twelfth' | 'diploma'
  twelfthStandard?: TwelfthStandardDetails
  diploma?: DiplomaDetails
}

export interface EngineeringDetails {
  collegeName: string
  city: string
  district: string
  pincode: string
  state: string
  branch: 'CSE' | 'ISE' | 'ECE' | 'EEE' | 'ME' | 'CE' | 'AIML' | 'DS'
  entryType: 'REGULAR' | 'LATERAL'
  seatCategory: 'KCET' | 'MANAGEMENT' | 'COMEDK'
  usn: string
  libraryId: string
  residencyStatus: 'HOSTELITE' | 'LOCALITE'

  // Hostel Details (conditional)
  hostelName?: string
  roomNumber?: string
  floorNumber?: string

  // Local Details (conditional)
  localCity?: string
  transportMode?: 'COLLEGE_BUS' | 'PRIVATE_TRANSPORT' | 'PUBLIC_TRANSPORT' | 'WALKING'
  busRoute?: string

  // Additional fields
  branchMentorName: string
  linkedin: string
  github?: string
  leetcode?: string
  resume: string
}

export interface SemesterRecord {
  semester: number
  sgpa: number
  cgpa: number
  monthPassed: number
  yearPassed: number
  marksCard: string
  failedSubjects?: Array<{
    code: string
    title: string
    grade: string
  }>
  clearedAfterFailure?: {
    proof: string
    updatedGrade: string
  }
}

export interface EngineeringAcademicRecords {
  semesterRecords: SemesterRecord[]
}

export interface FinalKYCDetails {
  finalCgpa: number
  activeBacklogs: boolean
  backlogSubjects?: Array<{
    code: string
    title: string
  }>
  branchMentorName: string
  linkedin: string
  github?: string
  leetcode?: string
  resume: string
}

export interface ComprehensiveProfile {
  personalInfo: PersonalInfo
  contactAndParentDetails: ContactAndParentDetails
  addressDetails: AddressDetails
  academicDetails: AcademicDetails
  engineeringDetails: EngineeringDetails
  engineeringAcademicRecords: EngineeringAcademicRecords
  finalKYCDetails: FinalKYCDetails
}

// Form validation schemas
export interface FormValidationRules {
  personalInfo: {
    firstName: { required: true, autoUppercase: true }
    middleName: { required: true, defaultValue: '.' }
    lastName: { required: true, autoUppercase: true }
    dateOfBirth: { required: true }
    gender: { required: true, options: ['MALE', 'FEMALE'] }
    bloodGroup: { required: true }
    stateOfDomicile: { required: true }
    nationality: { readonly: true, default: 'INDIAN' }
    casteCategory: { required: true, options: ['GEN', 'OBC', 'SC', 'ST'] }
  }
  contactDetails: {
    email: { required: true, pattern: 'gmail', professional: true }
    callingMobile: { required: true, pattern: '10-digit' }
    whatsappMobile: { required: true }
    alternativeMobile: { optional: true, mustDiffer: true }
  }
  // ... other validation rules
}

// Profile completion status
export interface ProfileCompletionStatus {
  currentStep: number
  totalSteps: 7
  completedSteps: number[]
  isComplete: boolean
  kycStatus: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'INCOMPLETE'
}

// 1. Add/expand types for 12th/Diploma step:
export interface TwelfthDiplomaDetails {
  // 12th Standard fields
  twelfthOrDiploma: '12th' | 'Diploma'
  // 12th fields
  twelfthSchoolName?: string
  twelfthArea?: string
  twelfthDistrict?: string
  twelfthCity?: string
  twelfthPincode?: string
  twelfthState?: string
  twelfthBoard?: 'STATE' | 'CBSE' | 'ICSE'
  twelfthPassingYear?: number
  twelfthPassingMonth?: string
  twelfthStatePercentage?: number
  twelfthCbseSubjects?: number
  twelfthCbseMarks?: number
  twelfthCbsePercentage?: string
  twelfthIcseMarks?: number
  twelfthIcsePercentage?: string
  twelfthMarkcard?: string
  // Diploma fields
  diplomaCollege?: string
  diplomaArea?: string
  diplomaDistrict?: string
  diplomaCity?: string
  diplomaPincode?: string
  diplomaState?: string
  diplomaCertificates?: string
  diplomaSemesters?: Array<{
    semester: number
    sgpa?: number
    cgpa?: number
    marks?: number
  }>
  diplomaFirstYear?: number
  diplomaSecondYear?: number
  diplomaThirdYear?: number
  diplomaPercentage?: string
}
// 2. Add/expand types for engineering academic step:
export interface EngineeringAcademicDetails {
  semesters: Array<{
    semester: number
    sgpa: number
    cgpa: number
    monthPassed: string
    yearPassed: number
    marksCard: string
    failed?: boolean
    failedSubjects?: Array<{
      code: string
      title: string
      grade: string
      month: string
    }>
    cleared?: boolean
    clearedSubjects?: Array<{
      code: string
      title: string
      grade: string
      month: string
      proof: string
    }>
  }>
  finalCgpa: number
  activeBacklogs: boolean
  backlogSubjects?: Array<{
    code: string
    title: string
  }>
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import {
  Eye,
  Check,
  X,
  Clock,
  User,
  Mail,
  Calendar,
  FileText,
  Download,
  ExternalLink,
  AlertTriangle
} from "lucide-react"
import { format } from "date-fns"
import { getDocumentUrl } from "@/lib/document-utils"

function DocumentPreview({ url, label, publicDomain }: { url: string | null | undefined, label: string, publicDomain?: string }) {
  if (!url) return (
    <div className="border rounded-md p-3 bg-gray-50/50">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm text-muted-foreground">{label}</span>
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Missing</Badge>
      </div>
    </div>
  )

  return (
    <div className="border rounded-md p-3 bg-white shadow-sm border-gray-200">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{label}</span>
          <Badge variant="outline" className="w-fit mt-1 bg-green-50 text-green-700 border-green-200 uppercase text-[10px] font-bold tracking-wider">
            Uploaded
          </Badge>
        </div>
        <Button
          variant="default"
          size="sm"
          className="h-8 px-4 bg-blue-600 hover:bg-blue-700"
          onClick={() => {
            const fileUrl = getDocumentUrl(url, publicDomain);
            console.log("File URL:", fileUrl); // Check browser console
            window.open(fileUrl, '_blank', 'noopener,noreferrer');
          }}
        >
          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
          View
        </Button>
      </div>
    </div>
  )
}

interface BacklogData {
  code: string
  title: string
}

interface SemesterData {
  semester: number
  marksCard: string | null
  sgpa: string
  cgpa: string
}

import type { Profile as PrismaProfile } from "@prisma/client"

export interface Profile extends Omit<PrismaProfile, 'semesters' | 'backlogs'> {
  user: {
    id: string
    name: string | null
    email: string | null
    createdAt: Date
    document?: any // Include Document model
  }
  // Override Json fields
  semesters: SemesterData[] | any
  backlogs: BacklogData[] | any

  // Explicitly add academicDocument if missing from generated type
  academicDocument: string | null
}

interface KYCVerificationQueueProps {
  pendingVerifications: Profile[]
  adminId: string
  publicDomain?: string
}

export function KYCVerificationQueue({ pendingVerifications, adminId, publicDomain }: KYCVerificationQueueProps) {
  // ... (keeping state and helper functions same as they are not needing change) ...
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [verificationNotes, setVerificationNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  // Local state for backlog inputs (if admin needs to edit/verify)
  const [backlogCount, setBacklogCount] = useState<string>("")
  const [backlogSubjects, setBacklogSubjects] = useState<string>("")

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-800'
      case 'VERIFIED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleProfileSelect = (profile: Profile) => {
    setSelectedProfile(profile)
    // Initialize backlog fields from profile data if available
    const count = profile.backlogs?.length || 0
    setBacklogCount(count.toString())

    if (Array.isArray(profile.backlogs)) {
      const subjects = profile.backlogs.map((b: any) => `${b.code} - ${b.title}`).join(", ")
      setBacklogSubjects(subjects)
    } else {
      setBacklogSubjects("")
    }
  }

  const handleVerification = async (profileId: string, status: 'VERIFIED' | 'REJECTED') => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/admin/kyc-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileId,
          status,
          notes: verificationNotes,
          verifiedBy: adminId,
          // Optionally send updated backlog info if API supports it
          backlogCount,
          backlogSubjects
        }),
      })

      if (response.ok) {
        // Refresh the page or update the state
        window.location.reload()
      }
    } catch (error) {
      console.error('Error updating KYC status:', error)
    } finally {
      setIsProcessing(false)
      setVerificationNotes("")
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingVerifications.filter(p => p.kycStatus === 'PENDING').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingVerifications.filter(p => p.kycStatus === 'UNDER_REVIEW').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingVerifications.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verification Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Queue</CardTitle>
          <CardDescription>
            Students awaiting KYC verification and profile review
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingVerifications.length === 0 ? (
            <div className="text-center py-8">
              <Check className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">All caught up!</h3>
              <p className="text-muted-foreground">
                No pending KYC verifications at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingVerifications.map((profile) => (
                <div key={profile.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src="" />
                        <AvatarFallback>
                          {profile.user.name?.charAt(0) || profile.firstName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <h3 className="font-medium">
                          {profile.user.name || `${profile.firstName} ${profile.lastName}` || 'Unknown User'}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {profile.user.email}
                          </span>
                          {profile.usn && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {profile.usn}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(profile.user.createdAt), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(profile.kycStatus)}>
                        {profile.kycStatus.replace('_', ' ')}
                      </Badge>

                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => handleProfileSelect(profile)}>
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Profile Review</DialogTitle>
                              <DialogDescription>
                                Review student profile and documents for KYC verification
                              </DialogDescription>
                            </DialogHeader>

                            {selectedProfile && (
                              <div className="space-y-6">
                                {/* Basic Information */}
                                <div>
                                  <h4 className="font-medium mb-3">Basic Information</h4>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Name:</span>
                                      <p>{selectedProfile.user.name || `${selectedProfile.firstName || ''} ${selectedProfile.middleName || ''} ${selectedProfile.lastName || ''}`.trim() || 'Not provided'}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Email:</span>
                                      <p>{selectedProfile.studentEmail || selectedProfile.user.email}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">USN:</span>
                                      <p>{selectedProfile.usn || selectedProfile.user.document?.usn || 'Not provided'}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Branch:</span>
                                      <p>{selectedProfile.branch || selectedProfile.department || 'Not provided'}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Batch:</span>
                                      <p>{selectedProfile.batch || 'Not provided'}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Profile Completion:</span>
                                      <p>{selectedProfile.isComplete ? 'Complete' : `Step ${selectedProfile.completionStep}/7`}</p>
                                    </div>
                                    {selectedProfile.collegeName && (
                                      <div>
                                        <span className="text-muted-foreground">College:</span>
                                        <p>{selectedProfile.collegeName}</p>
                                      </div>
                                    )}
                                    {selectedProfile.entryType && (
                                      <div>
                                        <span className="text-muted-foreground">Entry Type:</span>
                                        <p>{selectedProfile.entryType}</p>
                                      </div>
                                    )}
                                    {selectedProfile.seatCategory && (
                                      <div>
                                        <span className="text-muted-foreground">Seat Category:</span>
                                        <p>{selectedProfile.seatCategory}</p>
                                      </div>
                                    )}
                                    {selectedProfile.branchMentor && (
                                      <div>
                                        <span className="text-muted-foreground">Branch Mentor:</span>
                                        <p>{selectedProfile.branchMentor}</p>
                                      </div>
                                    )}
                                    {(selectedProfile.callingMobile || selectedProfile.callingNumber) && (
                                      <div>
                                        <span className="text-muted-foreground">Phone:</span>
                                        <p>{selectedProfile.callingMobile || selectedProfile.callingNumber}</p>
                                      </div>
                                    )}
                                    {selectedProfile.user.document?.cgpa && (
                                      <div>
                                        <span className="text-muted-foreground">CGPA:</span>
                                        <p>{selectedProfile.user.document.cgpa}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <Separator />

                                {/* Marks Cards Section */}
                                <div>
                                  <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Marks Cards & Documents
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <DocumentPreview
                                      url={selectedProfile.user.document?.tenthMarksCardLink || selectedProfile.tenthMarksCard}
                                      label="10th Marks Card"
                                      publicDomain={publicDomain}
                                    />

                                    <DocumentPreview
                                      url={selectedProfile.user.document?.twelfthMarksCardLink || selectedProfile.twelfthMarksCard || selectedProfile.diplomaCertificates}
                                      label="12th / Diploma Marks Card"
                                      publicDomain={publicDomain}
                                    />

                                    {/* Semesters 1-8 from Document Model */}
                                    {['sem1Link', 'sem2Link', 'sem3Link', 'sem4Link', 'sem5Link', 'sem6Link', 'sem7Link', 'sem8Link'].map((key, idx) => {
                                      const link = selectedProfile.user.document?.[key]
                                      if (!link) return null
                                      return (
                                        <DocumentPreview
                                          key={key}
                                          url={link}
                                          label={`Semester ${idx + 1}`}
                                          publicDomain={publicDomain}
                                        />
                                      )
                                    })}

                                    <DocumentPreview
                                      url={selectedProfile.academicDocument}
                                      label="Academic Document / Proof"
                                      publicDomain={publicDomain}
                                    />
                                  </div>
                                </div>

                                {/* Semester Marks Cards (Legacy / Profile Model) */}
                                <div className="mt-4">
                                  <h5 className="text-sm font-medium mb-2 text-muted-foreground">Semester Marks Cards (Legacy)</h5>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {Array.isArray(selectedProfile.semesters) && selectedProfile.semesters.map((sem: any, index: number) => (
                                      sem.marksCard && (
                                        <DocumentPreview
                                          key={index}
                                          url={sem.marksCard}
                                          label={`Semester ${sem.semester} (Legacy)`}
                                          publicDomain={publicDomain}
                                        />
                                      )
                                    ))}
                                  </div>
                                </div>

                                <Separator />

                                {/* Backlog Information */}
                                <div>
                                  <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                                    Backlog Verification
                                  </h4>

                                  <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="p-3 bg-slate-50 rounded-md border">
                                      <span className="text-sm text-muted-foreground">Has Backlogs?</span>
                                      <p className={`font-medium ${selectedProfile.hasBacklogs === 'yes' ? 'text-red-600' : 'text-green-600'}`}>
                                        {selectedProfile.hasBacklogs?.toUpperCase() || 'NOT SPECIFIED'}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <div className="grid gap-2">
                                      <Label htmlFor="backlog-count">How many backlogs are there?</Label>
                                      <Input
                                        id="backlog-count"
                                        placeholder="0"
                                        value={backlogCount}
                                        onChange={(e) => setBacklogCount(e.target.value)}
                                        type="number"
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="backlog-subjects">In which subjects? (Subject Codes/Titles)</Label>
                                      <Textarea
                                        id="backlog-subjects"
                                        placeholder="e.g. 18MAT11 - Engineering Mathematics I"
                                        value={backlogSubjects}
                                        onChange={(e) => setBacklogSubjects(e.target.value)}
                                        rows={3}
                                      />
                                    </div>
                                  </div>
                                </div>

                                <Separator />

                                {/* Verification Notes */}
                                <div>
                                  <h4 className="font-medium mb-3">Verification Notes</h4>
                                  <Textarea
                                    placeholder="Add notes about the verification process..."
                                    value={verificationNotes}
                                    onChange={(e) => setVerificationNotes(e.target.value)}
                                    className="min-h-[100px]"
                                  />
                                </div>
                              </div>
                            )}

                            <DialogFooter>
                              <div className="flex gap-2">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" disabled={isProcessing}>
                                      <X className="w-4 h-4 mr-1" />
                                      Reject
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Reject KYC Verification</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to reject this profile? The student will be notified and can resubmit their information.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => selectedProfile && handleVerification(selectedProfile.id, 'REJECTED')}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Reject Profile
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button disabled={isProcessing}>
                                      <Check className="w-4 h-4 mr-1" />
                                      Verify
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Approve KYC Verification</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to approve this profile? The student will be marked as verified and gain full access to placement features.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => selectedProfile && handleVerification(selectedProfile.id, 'VERIFIED')}
                                      >
                                        Verify Profile
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div >
  )
}

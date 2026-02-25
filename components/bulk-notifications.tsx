"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Mail,
  Users,
  Send,
  Filter,
  UserCheck,
  GraduationCap,
  Calendar,
  AlertCircle,
  X,
  Plus
} from "lucide-react"

interface BranchStats {
  branch: string | null
  _count: {
    branch: number
  }
}

interface NotificationStats {
  totalStudents: number
  verifiedStudents: number
  branches: BranchStats[]
}

interface BulkNotificationsProps {
  stats: NotificationStats
  adminId: string
}

export function BulkNotifications({ stats, adminId }: BulkNotificationsProps) {
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [targetGroup, setTargetGroup] = useState("all")
  const [selectedBranches, setSelectedBranches] = useState<string[]>([])
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [attachments, setAttachments] = useState<{ url: string; name: string }[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const handleBranchChange = (branch: string, checked: boolean) => {
    if (checked) {
      setSelectedBranches(prev => [...prev, branch])
    } else {
      setSelectedBranches(prev => prev.filter(b => b !== branch))
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", "academic-document") // Generic type for all attachments

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })

      const data = await res.json()
      if (data.success) {
        setAttachments(prev => [...prev, { url: data.url, name: file.name }])
        alert("File successfully uploaded")
      } else {
        alert(data.error || "Failed to upload file")
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      alert("An error occurred during upload")
    } finally {
      setIsUploading(false)
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const getEstimatedRecipients = () => {
    let count = 0

    if (targetGroup === "all") {
      count = verifiedOnly ? stats.verifiedStudents : stats.totalStudents
    } else if (targetGroup === "verified") {
      count = stats.verifiedStudents
    } else if (targetGroup === "branches" && selectedBranches.length > 0) {
      count = stats.branches
        .filter(b => b.branch && selectedBranches.includes(b.branch))
        .reduce((acc, b) => acc + b._count.branch, 0)
    }

    return count
  }

  const handleSendNotification = async () => {
    if (!subject.trim() || !message.trim()) {
      return
    }

    setIsSending(true)

    try {
      const response = await fetch('/api/admin/bulk-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          message,
          targetGroup,
          selectedBranches,
          verifiedOnly,
          isScheduled,
          scheduledDate: isScheduled ? scheduledDate : null,
          scheduledTime: isScheduled ? scheduledTime : null,
          attachments,
          adminId
        }),
      })

      if (response.ok) {
        // Reset form
        setSubject("")
        setMessage("")
        setTargetGroup("all")
        setSelectedBranches([])
        setVerifiedOnly(false)
        setIsScheduled(false)
        setScheduledDate("")
        setScheduledTime("")
        setAttachments([])

        alert("Notification sent successfully!")
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      alert("Error sending notification. Please try again.")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Notification Form */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Compose Notification
            </CardTitle>
            <CardDescription>
              Create and send bulk notifications to students
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Enter notification subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[150px]"
              />
            </div>

            {/* Simple Attach Files Section */}
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Attach Files (JPG, PNG, PDF, Word, Excel, CSV)</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 border-dashed"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={isUploading}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {isUploading ? "Uploading..." : "Attach File"}
                  </Button>
                </div>
              </div>

              {/* Preview Area for Attachments */}
              {attachments.length > 0 && (
                <div className="space-y-2 p-3 border rounded-lg bg-muted/30 text-sm">
                  <p className="text-xs font-semibold">Selected Files ({attachments.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((file, i) => (
                      <Badge key={i} variant="secondary" className="gap-2 px-3 py-1.5 pr-2 hover:bg-muted transition-colors">
                        <span className="max-w-[150px] truncate font-medium">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 rounded-full hover:bg-destructive hover:text-white"
                          onClick={() => removeAttachment(i)}
                          title="Remove file"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Scheduling Options */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="scheduled"
                  checked={isScheduled}
                  onCheckedChange={(checked) => setIsScheduled(checked as boolean)}
                />
                <Label htmlFor="scheduled" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Schedule for later
                </Label>
              </div>

              {isScheduled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Send Button */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Ready to send?</p>
                <p className="text-sm text-muted-foreground">
                  This will send to approximately {getEstimatedRecipients()} recipients
                </p>
              </div>
              <Button
                onClick={handleSendNotification}
                disabled={!subject.trim() || !message.trim() || isSending}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                {isSending ? "Sending..." : isScheduled ? "Schedule" : "Send Now"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Targeting Options */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Target Audience
            </CardTitle>
            <CardDescription>
              Choose who will receive this notification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Target Group</Label>
              <Select value={targetGroup} onValueChange={setTargetGroup}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="verified">Verified Students Only</SelectItem>
                  <SelectItem value="branches">Specific Branches</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {targetGroup === "branches" && (
              <div className="space-y-2">
                <Label>Select Branches</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {stats.branches.map((branch) => (
                    <div key={branch.branch} className="flex items-center space-x-2">
                      <Checkbox
                        id={branch.branch || "unknown"}
                        checked={selectedBranches.includes(branch.branch || "")}
                        onCheckedChange={(checked) =>
                          handleBranchChange(branch.branch || "", checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={branch.branch || "unknown"}
                        className="flex-1 flex items-center justify-between"
                      >
                        <span>{branch.branch || "Unknown"}</span>
                        <Badge variant="secondary">
                          {branch._count.branch}
                        </Badge>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {targetGroup === "all" && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="verified-only"
                  checked={verifiedOnly}
                  onCheckedChange={(checked) => setVerifiedOnly(checked as boolean)}
                />
                <Label htmlFor="verified-only" className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Verified profiles only
                </Label>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Student Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Students</span>
              <Badge variant="secondary">{stats.totalStudents}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Verified Students</span>
              <Badge className="bg-green-100 text-green-800">
                {stats.verifiedStudents}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Estimated Recipients</span>
              <Badge variant="outline">
                {getEstimatedRecipients()}
              </Badge>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium">Branches</p>
              <div className="space-y-1">
                {stats.branches.slice(0, 5).map((branch) => (
                  <div key={branch.branch} className="flex justify-between text-xs">
                    <span>{branch.branch}</span>
                    <span>{branch._count.branch}</span>
                  </div>
                ))}
                {stats.branches.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    +{stats.branches.length - 5} more branches
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning */}
        <Card className="border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-800">
                  Important Notice
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  Bulk notifications will be sent via in-app notifications.
                  Please review your message carefully before sending.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

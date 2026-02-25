"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Calendar, Clock, MapPin, Users, Plus, Edit2, Trash2, Eye, UserPlus, UserMinus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ScheduleEvent {
  id: string
  title: string
  description: string
  date: string
  time: string
  duration: number
  location: string
  type: 'interview' | 'test' | 'group-discussion' | 'presentation' | 'meeting' | 'webinar'
  company?: string
  jobId?: string
  attendees: number
  maxAttendees?: number
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
  isVisible: boolean
  createdBy: string
  isRegistered?: boolean
}

interface JobOption {
  id: string
  title: string
  companyName: string
}

interface SchedulerProps {
  isAdmin?: boolean
  userId?: string
}

const eventTypes = [
  { value: 'interview', label: 'Interview', color: 'bg-blue-500' },
  { value: 'test', label: 'Test', color: 'bg-red-500' },
  { value: 'group-discussion', label: 'Group Discussion', color: 'bg-green-500' },
  { value: 'presentation', label: 'Presentation', color: 'bg-purple-500' },
  { value: 'meeting', label: 'Meeting', color: 'bg-orange-500' },
  { value: 'webinar', label: 'Webinar', color: 'bg-cyan-500' },
]

export function Scheduler({ isAdmin = false, userId }: SchedulerProps) {
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null)
  const [viewFilter, setViewFilter] = useState<'all' | 'upcoming' | 'today'>('upcoming')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [availableJobs, setAvailableJobs] = useState<JobOption[]>([])

  const [newEvent, setNewEvent] = useState<Partial<ScheduleEvent>>({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 60,
    location: '',
    type: 'meeting',
    company: '',
    jobId: '',
    maxAttendees: 10,
    isVisible: true
  })

  // Fetch events from API
  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/schedule')
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      } else {
        toast.error("Failed to fetch events")
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      toast.error("Failed to fetch events")
    } finally {
      setLoading(false)
    }
  }

  // Fetch active jobs for the selector
  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs?limit=100')
      if (response.ok) {
        const data = await response.json()
        setAvailableJobs(
          (data.jobs || []).map((j: any) => ({
            id: j.id,
            title: j.title,
            companyName: j.companyName,
          }))
        )
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    }
  }

  useEffect(() => {
    fetchEvents()
    if (isAdmin) fetchJobs()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const resetNewEvent = () => {
    setNewEvent({
      title: '',
      description: '',
      date: '',
      time: '',
      duration: 60,
      location: '',
      type: 'meeting',
      company: '',
      jobId: '',
      maxAttendees: 10,
      isVisible: true
    })
  }

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newEvent)
      })

      if (response.ok) {
        const createdEvent = await response.json()
        setEvents([...events, createdEvent])
        resetNewEvent()
        setIsCreateDialogOpen(false)
        toast.success("Event created successfully")
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to create event")
      }
    } catch (error) {
      console.error('Error creating event:', error)
      toast.error("Failed to create event")
    }
  }

  const handleUpdateEvent = async () => {
    if (!editingEvent) return

    try {
      const response = await fetch(`/api/schedule/${editingEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingEvent)
      })

      if (response.ok) {
        const updatedEvent = await response.json()
        setEvents(events.map(event =>
          event.id === editingEvent.id ? updatedEvent : event
        ))
        setEditingEvent(null)
        toast.success("Event updated successfully")
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to update event")
      }
    } catch (error) {
      console.error('Error updating event:', error)
      toast.error("Failed to update event")
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/schedule/${eventId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setEvents(events.filter(event => event.id !== eventId))
        toast.success("Event deleted successfully")
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to delete event")
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      toast.error("Failed to delete event")
    }
  }

  const handleRegisterForEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/schedule/${eventId}/register`, {
        method: 'POST'
      })

      if (response.ok) {
        // Update the event to show increased attendee count and registration status
        setEvents(events.map(event =>
          event.id === eventId
            ? { ...event, attendees: event.attendees + 1, isRegistered: true }
            : event
        ))
        toast.success("Successfully registered for event")
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to register for event")
      }
    } catch (error) {
      console.error('Error registering for event:', error)
      toast.error("Failed to register for event")
    }
  }

  const handleUnregisterFromEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/schedule/${eventId}/register`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Update the event to show decreased attendee count and registration status
        setEvents(events.map(event =>
          event.id === eventId
            ? { ...event, attendees: event.attendees - 1, isRegistered: false }
            : event
        ))
        toast.success("Successfully unregistered from event")
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to unregister from event")
      }
    } catch (error) {
      console.error('Error unregistering from event:', error)
      toast.error("Failed to unregister from event")
    }
  }

  const getFilteredEvents = () => {
    let filtered = events

    // Filter by visibility (students only see visible events)
    if (!isAdmin) {
      filtered = filtered.filter(event => event.isVisible)
    }

    // Filter by date
    const today = new Date().toISOString().split('T')[0]
    if (viewFilter === 'today') {
      filtered = filtered.filter(event => event.date === today)
    } else if (viewFilter === 'upcoming') {
      filtered = filtered.filter(event => event.date >= today)
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(event => event.type === typeFilter)
    }

    // Sort by date and time
    return filtered.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`)
      const dateB = new Date(`${b.date}T${b.time}`)
      return dateA.getTime() - dateB.getTime()
    })
  }

  const getEventTypeInfo = (type: ScheduleEvent['type']) => {
    return eventTypes.find(t => t.value === type) || eventTypes[0]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const isEventToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0]
    return dateString === today
  }

  const isEventUpcoming = (dateString: string, timeString: string) => {
    const eventDateTime = new Date(`${dateString}T${timeString}`)
    const now = new Date()
    return eventDateTime > now
  }

  const filteredEvents = getFilteredEvents()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Schedule</h2>
          <p className="text-muted-foreground">
            {isAdmin ? 'Manage placement events and schedules' : 'View your upcoming placement events'}
          </p>
        </div>

        {isAdmin && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Add a new placement event to the schedule
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="e.g., Technical Interview - Software Engineer"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Event description..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duration (min)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="15"
                      step="15"
                      value={newEvent.duration}
                      onChange={(e) => setNewEvent({ ...newEvent, duration: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxAttendees">Max Attendees</Label>
                    <Input
                      id="maxAttendees"
                      type="number"
                      min="1"
                      value={newEvent.maxAttendees}
                      onChange={(e) => setNewEvent({ ...newEvent, maxAttendees: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="type">Event Type</Label>
                  <Select
                    value={newEvent.type}
                    onValueChange={(value) => setNewEvent({ ...newEvent, type: value as ScheduleEvent['type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="linkedJob">Link to Job (Optional)</Label>
                  <Select
                    value={newEvent.jobId || 'none'}
                    onValueChange={(value) => {
                      const selectedJob = availableJobs.find(j => j.id === value)
                      setNewEvent({
                        ...newEvent,
                        jobId: value === 'none' ? '' : value,
                        company: value === 'none' ? newEvent.company : selectedJob?.companyName || newEvent.company,
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a job" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {availableJobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.title} — {job.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    placeholder="e.g., Conference Room A"
                  />
                </div>

                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={newEvent.company}
                    onChange={(e) => setNewEvent({ ...newEvent, company: e.target.value })}
                    placeholder="e.g., TechCorp Solutions"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateEvent}>
                  Create Event
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          <Select value={viewFilter} onValueChange={(value) => setViewFilter(value as typeof viewFilter)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {eventTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredEvents.length} events
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No events found</h3>
                <p className="text-muted-foreground">
                  {isAdmin ? 'Create your first event to get started.' : 'No events scheduled at the moment.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredEvents.map((event) => {
            const typeInfo = getEventTypeInfo(event.type)
            const isToday = isEventToday(event.date)
            const isUpcoming = isEventUpcoming(event.date, event.time)

            return (
              <Card key={event.id} className={cn(
                "transition-all duration-200 hover:shadow-md",
                isToday && "border-orange-200 bg-orange-50/50",
                !isUpcoming && event.status !== 'completed' && "opacity-75"
              )}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-3 h-3 rounded-full", typeInfo.color)} />
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        {isToday && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            Today
                          </Badge>
                        )}
                        <Badge variant="outline" className="capitalize">
                          {event.status}
                        </Badge>
                      </div>

                      {event.description && (
                        <p className="text-muted-foreground text-sm">{event.description}</p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(event.date)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {event.time} ({event.duration} min)
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {event.attendees}/{event.maxAttendees || '∞'}
                        </div>
                      </div>

                      {event.company && (
                        <div className="text-sm">
                          <span className="font-medium">Company:</span> {event.company}
                        </div>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="flex gap-2 ml-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{event.title}</DialogTitle>
                              <DialogDescription>Event Details</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Description</Label>
                                <p className="text-sm text-muted-foreground">{event.description || 'No description'}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Date & Time</Label>
                                  <p className="text-sm">{formatDate(event.date)} at {event.time}</p>
                                </div>
                                <div>
                                  <Label>Duration</Label>
                                  <p className="text-sm">{event.duration} minutes</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Location</Label>
                                  <p className="text-sm">{event.location || 'Not specified'}</p>
                                </div>
                                <div>
                                  <Label>Attendees</Label>
                                  <p className="text-sm">{event.attendees}/{event.maxAttendees || '∞'}</p>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingEvent(event)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {!isAdmin && isUpcoming && (
                      <div className="flex gap-2 ml-4">
                        {event.isRegistered ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnregisterFromEvent(event.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <UserMinus className="w-4 h-4 mr-2" />
                            Unregister
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRegisterForEvent(event.id)}
                            disabled={!!(event.maxAttendees && event.attendees >= event.maxAttendees)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            {event.maxAttendees && event.attendees >= event.maxAttendees ? 'Full' : 'Register'}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Edit Dialog */}
      {editingEvent && (
        <Dialog open={!!editingEvent} onOpenChange={() => setEditingEvent(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
              <DialogDescription>Update event details</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Event Title</Label>
                <Input
                  id="edit-title"
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingEvent.description}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-date">Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editingEvent.date}
                    onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-time">Time</Label>
                  <Input
                    id="edit-time"
                    type="time"
                    value={editingEvent.time}
                    onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={editingEvent.location}
                  onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingEvent(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateEvent}>
                Update Event
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

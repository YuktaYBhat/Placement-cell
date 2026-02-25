import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user with role information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    const isAdmin = user?.role === 'ADMIN'

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, date, time, duration, location, type, company, maxAttendees, isVisible, status } = body

    // Combine date and time if provided
    let eventDateTime
    if (date && time) {
      eventDateTime = new Date(`${date}T${time}:00`)
    }

    const updateData: any = {}
    if (title) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (eventDateTime) updateData.date = eventDateTime
    if (duration) updateData.duration = duration
    if (location !== undefined) updateData.location = location
    if (type) updateData.type = type.toUpperCase()
    if (company !== undefined) updateData.company = company
    if (maxAttendees) updateData.maxAttendees = maxAttendees
    if (isVisible !== undefined) updateData.isVisible = isVisible
    if (status) updateData.status = status.toUpperCase()

    const event = await prisma.scheduleEvent.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    // Transform the response
    const transformedEvent = {
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date.toISOString().split('T')[0],
      time: event.date.toTimeString().slice(0, 5),
      duration: event.duration,
      location: event.location,
      type: event.type.toLowerCase(),
      company: event.company,
      attendees: event.attendees.length,
      maxAttendees: event.maxAttendees,
      status: event.status.toLowerCase(),
      isVisible: event.isVisible,
      createdBy: event.createdBy
    }

    return NextResponse.json(transformedEvent)
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user with role information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    const isAdmin = user?.role === 'ADMIN'

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.scheduleEvent.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const event = await prisma.scheduleEvent.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Get user with role information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    const isAdmin = user?.role === 'ADMIN'
    if (!isAdmin && !event.isVisible) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Transform the response
    const transformedEvent = {
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date.toISOString().split('T')[0],
      time: event.date.toTimeString().slice(0, 5),
      duration: event.duration,
      location: event.location,
      type: event.type.toLowerCase(),
      company: event.company,
      attendees: event.attendees.length,
      maxAttendees: event.maxAttendees,
      status: event.status.toLowerCase(),
      isVisible: event.isVisible,
      createdBy: event.createdBy
    }

    return NextResponse.json(transformedEvent)
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
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
        attendees: true
      }
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (!event.isVisible) {
      return NextResponse.json({ error: "Event not available for registration" }, { status: 400 })
    }

    // Check if user is already registered
    const existingRegistration = await prisma.eventAttendee.findUnique({
      where: {
        eventId_userId: {
          eventId: id,
          userId: session.user.id
        }
      }
    })

    if (existingRegistration) {
      return NextResponse.json({ error: "Already registered for this event" }, { status: 400 })
    }

    // Check if event is full
    if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
      return NextResponse.json({ error: "Event is full" }, { status: 400 })
    }

    // Register user for event
    await prisma.eventAttendee.create({
      data: {
        eventId: id,
        userId: session.user.id
      }
    })

    return NextResponse.json({ success: true, message: "Successfully registered for event" })
  } catch (error) {
    console.error('Error registering for event:', error)
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

    // Unregister user from event
    const deleted = await prisma.eventAttendee.deleteMany({
      where: {
        eventId: id,
        userId: session.user.id
      }
    })

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Not registered for this event" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Successfully unregistered from event" })
  } catch (error) {
    console.error('Error unregistering from event:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

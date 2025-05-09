import { NextResponse } from "next/server";
import { prisma } from "@/db";
import { auth } from "@/auth";

// GET all in-person events for the logged-in user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const events = await prisma.in_Person_Events.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// POST a new in-person event
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { event, date, location, url, notes } = body;

    if (!event || !date) {
      return NextResponse.json(
        { error: "Event name and date are required" },
        { status: 400 }
      );
    }

    const newEvent = await prisma.in_Person_Events.create({
      data: {
        event,
        date,
        location,
        url,
        notes,
        userId: session.user.id,
        scheduled: true,
        attended: false,
        connectedOnline: false,
        numPeopleSpokenTo: null,
        numLinkedInRequests: null,
      },
    });

    return NextResponse.json(newEvent);
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}

// PUT to update an event's status
export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      scheduled,
      attended,
      connectedOnline,
      event,
      date,
      location,
      url,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Ensure the event belongs to the user
    const existingEvent = await prisma.in_Person_Events.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Only include the fields that are being updated
    const updateData: any = {};

    if (scheduled !== undefined) updateData.scheduled = scheduled;
    if (attended !== undefined) updateData.attended = attended;
    if (connectedOnline !== undefined)
      updateData.connectedOnline = connectedOnline;
    if (event !== undefined) updateData.event = event;
    if (date !== undefined) updateData.date = date;
    if (location !== undefined) updateData.location = location;
    if (url !== undefined) updateData.url = url;
    if (notes !== undefined) updateData.notes = notes;

    const updatedEvent = await prisma.in_Person_Events.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

// DELETE an event
export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Ensure the event belongs to the user
    const event = await prisma.in_Person_Events.findFirst({
      where: {
        id: parseInt(id),
        userId: session.user.id,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await prisma.in_Person_Events.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}

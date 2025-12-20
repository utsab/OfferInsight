import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/db";
import { getUserIdForRequest } from "@/app/lib/api-user-helper";

// GET all in-person events for the logged-in user (or specified user if instructor)
export async function GET(request: NextRequest) {
  try {
    const { userId, error } = await getUserIdForRequest(request);

    if (error || !userId) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
    }

    const events = await prisma.in_Person_Events.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch events", details: errorMessage },
      { status: 500 }
    );
  }
}

// POST a new in-person event
export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await getUserIdForRequest(request);

    if (error || !userId) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { event, date, location, url, notes, status, careerFair, numPeopleSpokenTo, numLinkedInRequests, numOfInterviews, dateCreated, dateModified } = body; // ===== DATE FIELD EDITING =====

    if (!event || !date) {
      return NextResponse.json(
        { error: "Event name and date are required" },
        { status: 400 }
      );
    }

    const newEvent = await prisma.in_Person_Events.create({
      data: {
        event,
        date: new Date(date),
        location,
        url,
        notes,
        userId: userId,
        status: status || "scheduled",
        careerFair: careerFair ?? false,
        numPeopleSpokenTo: numPeopleSpokenTo ?? null,
        numLinkedInRequests: numLinkedInRequests ?? null,
        numOfInterviews: numOfInterviews ?? null,
        // ===== DATE FIELD EDITING: Allow setting dateCreated and dateModified if provided =====
        dateCreated: dateCreated ? new Date(dateCreated) : undefined,
        // dateModified: Set to current date on create, unless ENABLE_DATE_FIELD_EDITING provides a value
        dateModified: dateModified ? new Date(dateModified) : new Date(),
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

// PATCH to update just the status (more efficient for drag and drop updates)
export async function PATCH(request: NextRequest) {
  try {
    const { userId, error } = await getUserIdForRequest(request);

    if (error || !userId) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status, dateModified } = body;

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    if (status === undefined) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Ensure the event belongs to the user
    const existingEvent = await prisma.in_Person_Events.findFirst({
      where: {
        id: parseInt(id),
        userId: userId,
      },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Update status and dateModified
    // dateModified: Always set to current date on status change, unless ENABLE_DATE_FIELD_EDITING provides a value
    const updateData: any = { 
      status,
      dateModified: dateModified ? new Date(dateModified) : new Date(),
    };

    const updatedEvent = await prisma.in_Person_Events.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("Error updating event status:", error);
    return NextResponse.json(
      { error: "Failed to update event status" },
      { status: 500 }
    );
  }
}

// PUT to update an event's status
export async function PUT(request: NextRequest) {
  try {
    const { userId, error } = await getUserIdForRequest(request);

    if (error || !userId) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      status,
      event: eventName,
      date,
      location,
      url,
      notes,
      numPeopleSpokenTo,
      numLinkedInRequests,
      numOfInterviews,
      careerFair,
      dateCreated, // ===== DATE FIELD EDITING =====
      dateModified, // ===== DATE FIELD EDITING =====
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
        userId: userId,
      },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Only include the fields that are being updated
    const updateData: any = {};

    if (status !== undefined) updateData.status = status;
    if (eventName !== undefined) updateData.event = eventName;
    if (date !== undefined) updateData.date = new Date(date);
    if (location !== undefined) updateData.location = location;
    if (url !== undefined) updateData.url = url;
    if (notes !== undefined) updateData.notes = notes;
    if (numPeopleSpokenTo !== undefined)
      updateData.numPeopleSpokenTo = numPeopleSpokenTo;
    if (numLinkedInRequests !== undefined)
      updateData.numLinkedInRequests = numLinkedInRequests;
    if (numOfInterviews !== undefined)
      updateData.numOfInterviews = numOfInterviews;
    if (careerFair !== undefined)
      updateData.careerFair = careerFair;
    // ===== DATE FIELD EDITING: Allow updating dateCreated and dateModified if provided =====
    if (dateCreated !== undefined) updateData.dateCreated = new Date(dateCreated);
    // dateModified: Always set to current date on any field update, unless ENABLE_DATE_FIELD_EDITING provides a value
    updateData.dateModified = dateModified ? new Date(dateModified) : new Date();

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
export async function DELETE(request: NextRequest) {
  try {
    const { userId, error } = await getUserIdForRequest(request);

    if (error || !userId) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
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
        userId: userId,
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

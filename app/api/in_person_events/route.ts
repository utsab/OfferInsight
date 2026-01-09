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
    const { event, date, location, url, status, careerFair, nameOfPersonSpokenTo, sentLinkedInRequest, followUpMessage, dateCreated, dateModified } = body; // ===== DATE FIELD EDITING =====

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
        userId: userId,
        status: status || "scheduling",
        careerFair: careerFair ?? false,
        nameOfPersonSpokenTo: nameOfPersonSpokenTo || null,
        sentLinkedInRequest: sentLinkedInRequest ?? false,
        followUpMessage: followUpMessage || null,
        // ===== DATE FIELD EDITING: Allow setting dateCreated and dateModified if provided =====
        dateCreated: dateCreated ? new Date(dateCreated) : undefined,
        // dateModified: Set to current date on create, or use provided value if specified
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
    const { status } = body;

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

    // Only update if status actually changed
    if (status === existingEvent.status) {
      // Status unchanged, return existing event without updating
      return NextResponse.json(existingEvent);
    }

    // Update status and dateModified
    // dateModified: Set to current date when status changes
    const updateData: any = { 
      status,
      dateModified: new Date(),
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
      nameOfPersonSpokenTo,
      sentLinkedInRequest,
      followUpMessage,
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

    // Only include the fields that are being updated and have actually changed
    const updateData: any = {};
    let hasChanges = false;

    if (status !== undefined && status !== existingEvent.status) {
      updateData.status = status;
      hasChanges = true;
    }
    if (eventName !== undefined && eventName !== existingEvent.event) {
      updateData.event = eventName;
      hasChanges = true;
    }
    if (date !== undefined) {
      const newDate = new Date(date);
      if (newDate.getTime() !== existingEvent.date.getTime()) {
        updateData.date = newDate;
        hasChanges = true;
      }
    }
    if (location !== undefined && location !== existingEvent.location) {
      updateData.location = location;
      hasChanges = true;
    }
    if (url !== undefined && url !== existingEvent.url) {
      updateData.url = url;
      hasChanges = true;
    }
    if (nameOfPersonSpokenTo !== undefined && nameOfPersonSpokenTo !== existingEvent.nameOfPersonSpokenTo) {
      updateData.nameOfPersonSpokenTo = nameOfPersonSpokenTo;
      hasChanges = true;
    }
    if (sentLinkedInRequest !== undefined && sentLinkedInRequest !== existingEvent.sentLinkedInRequest) {
      updateData.sentLinkedInRequest = sentLinkedInRequest;
      hasChanges = true;
    }
    if (followUpMessage !== undefined && followUpMessage !== existingEvent.followUpMessage) {
      updateData.followUpMessage = followUpMessage;
      hasChanges = true;
    }
    if (careerFair !== undefined && careerFair !== existingEvent.careerFair) {
      updateData.careerFair = careerFair;
      hasChanges = true;
    }
    // ===== DATE FIELD EDITING: Allow updating dateCreated if provided =====
    if (dateCreated !== undefined) {
      const newDateCreated = new Date(dateCreated);
      if (newDateCreated.getTime() !== existingEvent.dateCreated.getTime()) {
        updateData.dateCreated = newDateCreated;
        hasChanges = true;
      }
    }
    // ===== DATE FIELD EDITING: Allow updating dateModified if provided =====
    if (dateModified !== undefined) {
      if (dateModified === null) {
        // Allow clearing dateModified
        updateData.dateModified = null;
        hasChanges = true;
      } else {
        const newDateModified = new Date(dateModified);
        const existingDateModified = existingEvent.dateModified ? new Date(existingEvent.dateModified) : null;
        if (!existingDateModified || newDateModified.getTime() !== existingDateModified.getTime()) {
          updateData.dateModified = newDateModified;
          hasChanges = true;
        }
      }
    } else if (hasChanges) {
      // Only auto-update dateModified if no explicit value was provided and other fields changed
      updateData.dateModified = new Date();
    }
    
    if (hasChanges) {
      const updatedEvent = await prisma.in_Person_Events.update({
        where: { id },
        data: updateData,
      });
      return NextResponse.json(updatedEvent);
    } else {
      // No changes, return existing event without updating
      return NextResponse.json(existingEvent);
    }
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

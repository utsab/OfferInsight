import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { auth } from "@/auth";

// GET: Fetch all LinkedIn outreach for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const outreaches = await prisma.linkedin_Outreach.findMany({
      where: { userId: user.id },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(outreaches);
  } catch (error) {
    console.error("Error fetching LinkedIn outreach:", error);
    return NextResponse.json(
      { error: "Failed to fetch LinkedIn outreach" },
      { status: 500 }
    );
  }
}

// POST: Create a new LinkedIn outreach
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data = await request.json();

    const outreach = await prisma.linkedin_Outreach.create({
      data: {
        name: data.name,
        company: data.company,
        message: data.message || null,
        linkedInUrl: data.linkedInUrl || null,
        notes: data.notes || null,
        status: data.status || "outreachRequestSent", // TODO: This is apart of default status. eliminate redundancy (1/3)
        recievedReferral: data.recievedReferral || false,
        userId: user.id,
        // ===== DATE FIELD EDITING: Allow setting dateCreated and dateCompleted if provided =====
        dateCreated: data.dateCreated ? new Date(data.dateCreated) : undefined,
        dateCompleted: data.dateCompleted ? new Date(data.dateCompleted) : null,
      },
    });

    return NextResponse.json(outreach);
  } catch (error) {
    console.error("Error creating LinkedIn outreach:", error);
    return NextResponse.json(
      { error: "Failed to create LinkedIn outreach" },
      { status: 500 }
    );
  }
}

// PATCH: Update just the status of a LinkedIn outreach (more efficient for drag and drop updates)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { status, dateCompleted } = body;

    if (status === undefined) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the outreach belongs to the user
    const outreach = await prisma.linkedin_Outreach.findFirst({
      where: {
        id: parseInt(id),
        userId: user.id,
      },
    });

    if (!outreach) {
      return NextResponse.json(
        { error: "LinkedIn outreach not found or not owned by user" },
        { status: 404 }
      );
    }

    // Update status and dateCompleted
    const updateData: any = { status };
    if (dateCompleted !== undefined) {
      updateData.dateCompleted = dateCompleted ? new Date(dateCompleted) : null;
    }

    const updatedOutreach = await prisma.linkedin_Outreach.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json(updatedOutreach);
  } catch (error) {
    console.error("Error updating LinkedIn outreach status:", error);
    return NextResponse.json(
      { error: "Failed to update LinkedIn outreach status" },
      { status: 500 }
    );
  }
}

// PUT: Update an existing LinkedIn outreach
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // First check if the outreach belongs to the user
    const outreach = await prisma.linkedin_Outreach.findFirst({
      where: {
        id: data.id,
        userId: user.id,
      },
    });

    if (!outreach) {
      return NextResponse.json(
        { error: "LinkedIn outreach not found or not owned by user" },
        { status: 404 }
      );
    }

    // Update the outreach
    const updatedOutreach = await prisma.linkedin_Outreach.update({
      where: { id: data.id },
      data: {
        name: data.name !== undefined ? data.name : outreach.name,
        company: data.company !== undefined ? data.company : outreach.company,
        message: data.message !== undefined ? data.message : outreach.message,
        linkedInUrl:
          data.linkedInUrl !== undefined
            ? data.linkedInUrl
            : outreach.linkedInUrl,
        notes: data.notes !== undefined ? data.notes : outreach.notes,
        status: data.status !== undefined ? data.status : outreach.status,
        recievedReferral:
          data.recievedReferral !== undefined
            ? data.recievedReferral
            : outreach.recievedReferral,
        // ===== DATE FIELD EDITING: Allow updating dateCreated and dateCompleted if provided =====
        dateCreated:
          data.dateCreated !== undefined
            ? new Date(data.dateCreated)
            : outreach.dateCreated,
        dateCompleted:
          data.dateCompleted !== undefined
            ? (data.dateCompleted ? new Date(data.dateCompleted) : null)
            : outreach.dateCompleted,
      },
    });

    return NextResponse.json(updatedOutreach);
  } catch (error) {
    console.error("Error updating LinkedIn outreach:", error);
    return NextResponse.json(
      { error: "Failed to update LinkedIn outreach" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a LinkedIn outreach
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the outreach belongs to the user
    const outreach = await prisma.linkedin_Outreach.findFirst({
      where: {
        id: parseInt(id),
        userId: user.id,
      },
    });

    if (!outreach) {
      return NextResponse.json(
        { error: "LinkedIn outreach not found or not owned by user" },
        { status: 404 }
      );
    }

    // Delete the outreach
    await prisma.linkedin_Outreach.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting LinkedIn outreach:", error);
    return NextResponse.json(
      { error: "Failed to delete LinkedIn outreach" },
      { status: 500 }
    );
  }
}

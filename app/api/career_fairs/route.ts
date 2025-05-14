import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { auth } from "@/auth";

// GET: Fetch all career fairs for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const careerFairs = await prisma.career_Fairs.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(careerFairs);
  } catch (error) {
    console.error("Error fetching career fairs:", error);
    return NextResponse.json(
      { error: "Failed to fetch career fairs" },
      { status: 500 }
    );
  }
}

// POST: Create a new career fair
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { event, date, location, url, notes, status } = body;

    if (!event || !date) {
      return NextResponse.json(
        { error: "Event name and date are required" },
        { status: 400 }
      );
    }

    const careerFair = await prisma.career_Fairs.create({
      data: {
        event,
        date,
        location,
        url,
        notes,
        userId: session.user.id,
        status: status || "scheduled",
      },
    });

    return NextResponse.json(careerFair);
  } catch (error) {
    console.error("Error creating career fair:", error);
    return NextResponse.json(
      { error: "Failed to create career fair" },
      { status: 500 }
    );
  }
}

// PUT: Update a career fair
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, event, date, location, url, notes, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Career fair ID is required" },
        { status: 400 }
      );
    }

    // Check if the career fair belongs to the user
    const careerFair = await prisma.career_Fairs.findUnique({
      where: { id },
    });

    if (!careerFair) {
      return NextResponse.json(
        { error: "Career fair not found" },
        { status: 404 }
      );
    }

    if (careerFair.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to update this career fair" },
        { status: 403 }
      );
    }

    // Update fields
    const updatedData: any = {};

    if (event !== undefined) updatedData.event = event;
    if (date !== undefined) updatedData.date = date;
    if (location !== undefined) updatedData.location = location;
    if (url !== undefined) updatedData.url = url;
    if (notes !== undefined) updatedData.notes = notes;
    if (status !== undefined) updatedData.status = status;

    const updatedCareerFair = await prisma.career_Fairs.update({
      where: { id },
      data: updatedData,
    });

    return NextResponse.json(updatedCareerFair);
  } catch (error) {
    console.error("Error updating career fair:", error);
    return NextResponse.json(
      { error: "Failed to update career fair" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a career fair
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Career fair ID is required" },
        { status: 400 }
      );
    }

    // Check if the career fair belongs to the user
    const careerFair = await prisma.career_Fairs.findUnique({
      where: { id: parseInt(id) },
    });

    if (!careerFair) {
      return NextResponse.json(
        { error: "Career fair not found" },
        { status: 404 }
      );
    }

    if (careerFair.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to delete this career fair" },
        { status: 403 }
      );
    }

    await prisma.career_Fairs.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting career fair:", error);
    return NextResponse.json(
      { error: "Failed to delete career fair" },
      { status: 500 }
    );
  }
}

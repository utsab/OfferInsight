"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/db";
import { auth } from "@/auth";

// GET all applications with outreach for the logged-in user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const applications = await prisma.applications_With_Outreach.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

// POST a new application with outreach
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      company,
      hiringManager,
      msgToManager,
      recruiter,
      msgToRecruiter,
      notes,
      status,
      dateCreated, // ===== DATE FIELD EDITING =====
      dateModified, // ===== DATE FIELD EDITING =====
    } = body;

    if (!company) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    const newApplication = await prisma.applications_With_Outreach.create({
      data: {
        company,
        hiringManager: hiringManager || null,
        msgToManager: msgToManager || null,
        recruiter: recruiter || null,
        msgToRecruiter: msgToRecruiter || null,
        notes: notes || null,
        status: status || "applied",
        userId: session.user.id,
        // ===== DATE FIELD EDITING: Allow setting dateCreated and dateModified if provided =====
        dateCreated: dateCreated ? new Date(dateCreated) : undefined,
        // dateModified: Set to current date on create, unless ENABLE_DATE_FIELD_EDITING provides a value
        dateModified: dateModified ? new Date(dateModified) : new Date(),
      },
    });

    return NextResponse.json({
      application: newApplication,
    });
  } catch (error) {
    console.error("Error creating application:", error);
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 }
    );
  }
}

// PATCH to update just the status (more efficient for drag and drop updates)
export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status, dateModified } = body;

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }

    if (status === undefined) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Ensure the application belongs to the user
    const existingApplication =
      await prisma.applications_With_Outreach.findFirst({
        where: {
          id: parseInt(id),
          userId: session.user.id,
        },
      });

    if (!existingApplication) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Update status and dateModified
    // dateModified: Always set to current date on status change, unless ENABLE_DATE_FIELD_EDITING provides a value
    const updateData: any = { 
      status,
      dateModified: dateModified ? new Date(dateModified) : new Date(),
    };

    const updatedApplication = await prisma.applications_With_Outreach.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error("Error updating application status:", error);
    return NextResponse.json(
      { error: "Failed to update application status" },
      { status: 500 }
    );
  }
}

// PUT to update an application
export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      company,
      hiringManager,
      msgToManager,
      recruiter,
      msgToRecruiter,
      notes,
      status,
      dateCreated, // ===== DATE FIELD EDITING =====
      dateModified, // ===== DATE FIELD EDITING =====
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }

    // Ensure the application belongs to the user
    const existingApplication =
      await prisma.applications_With_Outreach.findFirst({
        where: {
          id,
          userId: session.user.id,
        },
      });

    if (!existingApplication) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Only include the fields that are being updated
    const updateData: any = {};

    if (company !== undefined) updateData.company = company;
    if (hiringManager !== undefined) updateData.hiringManager = hiringManager;
    if (msgToManager !== undefined) updateData.msgToManager = msgToManager;
    if (recruiter !== undefined) updateData.recruiter = recruiter;
    if (msgToRecruiter !== undefined)
      updateData.msgToRecruiter = msgToRecruiter;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;
    // ===== DATE FIELD EDITING: Allow updating dateCreated and dateModified if provided =====
    if (dateCreated !== undefined) updateData.dateCreated = new Date(dateCreated);
    // dateModified: Always set to current date on any field update, unless ENABLE_DATE_FIELD_EDITING provides a value
    updateData.dateModified = dateModified ? new Date(dateModified) : new Date();

    const updatedApplication = await prisma.applications_With_Outreach.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}

// DELETE an application
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
        { error: "Application ID is required" },
        { status: 400 }
      );
    }

    // Ensure the application belongs to the user
    const application = await prisma.applications_With_Outreach.findFirst({
      where: {
        id: parseInt(id),
        userId: session.user.id,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    await prisma.applications_With_Outreach.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting application:", error);
    return NextResponse.json(
      { error: "Failed to delete application" },
      { status: 500 }
    );
  }
}

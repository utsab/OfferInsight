"use server";

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/db";
import { getUserIdForRequest } from "@/app/lib/api-user-helper";
import { getDateInUserTimezone } from "@/app/lib/server-date-utils";

// GET all applications with outreach for the logged-in user (or specified user if instructor)
export async function GET(request: NextRequest) {
  try {
    const { userId, error } = await getUserIdForRequest(request);

    if (error || !userId) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
    }

    const applications = await prisma.applications_With_Outreach.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch applications", details: errorMessage },
      { status: 500 }
    );
  }
}

// POST a new application with outreach
export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await getUserIdForRequest(request);

    if (error || !userId) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
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
        userId: userId,
        // ===== DATE FIELD EDITING: Allow setting dateCreated and dateModified if provided =====
        dateCreated: dateCreated ? new Date(dateCreated) : undefined,
        // dateModified: Set to current date on create, or use provided value if specified (adjusted for user's timezone)
        dateModified: dateModified ? new Date(dateModified) : getDateInUserTimezone(),
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
export async function PATCH(request: NextRequest) {
  try {
    const { userId, error } = await getUserIdForRequest(request);

    if (error || !userId) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = body;

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
          userId: userId,
        },
      });

    if (!existingApplication) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Only update if status actually changed
    if (status === existingApplication.status) {
      // Status unchanged, return existing application without updating
      return NextResponse.json(existingApplication);
    }

    // Update status and dateModified
    // dateModified: Set to current date when status changes (adjusted for user's timezone)
    const updateData: any = { 
      status,
      dateModified: getDateInUserTimezone(),
    };

    const updatedApplication = await prisma.applications_With_Outreach.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error("Error updating application status:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to update application status", details: errorMessage },
      { status: 500 }
    );
  }
}

// PUT to update an application
export async function PUT(request: NextRequest) {
  try {
    const { userId, error } = await getUserIdForRequest(request);

    if (error || !userId) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
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
          userId: userId,
        },
      });

    if (!existingApplication) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Only include the fields that are being updated and have actually changed
    const updateData: any = {};
    let hasChanges = false;

    if (company !== undefined && company !== existingApplication.company) {
      updateData.company = company;
      hasChanges = true;
    }
    if (hiringManager !== undefined && hiringManager !== existingApplication.hiringManager) {
      updateData.hiringManager = hiringManager;
      hasChanges = true;
    }
    if (msgToManager !== undefined && msgToManager !== existingApplication.msgToManager) {
      updateData.msgToManager = msgToManager;
      hasChanges = true;
    }
    if (recruiter !== undefined && recruiter !== existingApplication.recruiter) {
      updateData.recruiter = recruiter;
      hasChanges = true;
    }
    if (msgToRecruiter !== undefined && msgToRecruiter !== existingApplication.msgToRecruiter) {
      updateData.msgToRecruiter = msgToRecruiter;
      hasChanges = true;
    }
    if (notes !== undefined && notes !== existingApplication.notes) {
      updateData.notes = notes;
      hasChanges = true;
    }
    if (status !== undefined && status !== existingApplication.status) {
      updateData.status = status;
      hasChanges = true;
    }
    // ===== DATE FIELD EDITING: Allow updating dateCreated if provided =====
    if (dateCreated !== undefined) {
      const newDateCreated = new Date(dateCreated);
      if (newDateCreated.getTime() !== existingApplication.dateCreated.getTime()) {
        updateData.dateCreated = newDateCreated;
        hasChanges = true;
      }
    }
    // dateModified: Only update if at least one field actually changed (adjusted for user's timezone)
    if (hasChanges) {
      updateData.dateModified = getDateInUserTimezone();
      const updatedApplication = await prisma.applications_With_Outreach.update({
        where: { id },
        data: updateData,
      });
      return NextResponse.json(updatedApplication);
    } else {
      // No changes, return existing application without updating
      return NextResponse.json(existingApplication);
    }
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}

// DELETE an application
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
        { error: "Application ID is required" },
        { status: 400 }
      );
    }

    // Ensure the application belongs to the user
    const application = await prisma.applications_With_Outreach.findFirst({
      where: {
        id: parseInt(id),
        userId: userId,
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

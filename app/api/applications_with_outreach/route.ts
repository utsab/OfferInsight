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

    const applications = await prisma.applications_with_Outreach.findMany({
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
    } = body;

    if (!company) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    const newApplication = await prisma.applications_with_Outreach.create({
      data: {
        company,
        hiringManager: hiringManager || null,
        msgToManager: msgToManager || null,
        recruiter: recruiter || null,
        msgToRecruiter: msgToRecruiter || null,
        notes: notes || null,
        appliedStatus: true,
        msgToRecruiterStatus: false,
        msgToManagerStatus: false,
        interviewStatus: false,
        offerStatus: false,
        userId: session.user.id,
      },
    });

    return NextResponse.json(newApplication);
  } catch (error) {
    console.error("Error creating application:", error);
    return NextResponse.json(
      { error: "Failed to create application" },
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
      appliedStatus,
      msgToRecruiterStatus,
      msgToManagerStatus,
      interviewStatus,
      offerStatus,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }

    // Ensure the application belongs to the user
    const existingApplication =
      await prisma.applications_with_Outreach.findFirst({
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
    if (appliedStatus !== undefined) updateData.appliedStatus = appliedStatus;
    if (msgToRecruiterStatus !== undefined)
      updateData.msgToRecruiterStatus = msgToRecruiterStatus;
    if (msgToManagerStatus !== undefined)
      updateData.msgToManagerStatus = msgToManagerStatus;
    if (interviewStatus !== undefined)
      updateData.interviewStatus = interviewStatus;
    if (offerStatus !== undefined) updateData.offerStatus = offerStatus;

    const updatedApplication = await prisma.applications_with_Outreach.update({
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
    const application = await prisma.applications_with_Outreach.findFirst({
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

    await prisma.applications_with_Outreach.delete({
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

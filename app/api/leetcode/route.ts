"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/db";
import { auth } from "@/auth";

// GET all LeetCode records for the logged-in user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const problems = await prisma.leetcode_Practice.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json(problems);
  } catch (error) {
    console.error("Error fetching LeetCode problems:", error);
    return NextResponse.json({ error: "Failed to fetch problems" }, { status: 500 });
  }
}

// POST a new LeetCode entry
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { problem, problemType, difficulty, url, reflection, status, dateCreated, dateModified } = await request.json(); // ===== DATE FIELD EDITING =====

    if (!problem?.trim()) {
      return NextResponse.json({ error: "Problem title is required" }, { status: 400 });
    }

    const newProblem = await prisma.leetcode_Practice.create({
      data: {
        problem: problem.trim(),
        problemType: problemType?.trim() || null,
        difficulty: difficulty?.trim() || null,
        url: url?.trim() || null,
        reflection: reflection?.trim() || null,
        status: status || "planned",
        userId: session.user.id,
        // ===== DATE FIELD EDITING: Allow setting dateCreated and dateModified if provided =====
        dateCreated: dateCreated ? new Date(dateCreated) : undefined,
        // dateModified: Set to current date on create, unless ENABLE_DATE_FIELD_EDITING provides a value
        dateModified: dateModified ? new Date(dateModified) : new Date(),
      },
    });

    return NextResponse.json(newProblem);
  } catch (error) {
    console.error("Error creating LeetCode problem:", error);
    return NextResponse.json({ error: "Failed to create problem" }, { status: 500 });
  }
}

// PATCH to update just the status
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
      return NextResponse.json({ error: "Problem ID is required" }, { status: 400 });
    }

    if (status === undefined) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const existing = await prisma.leetcode_Practice.findFirst({
      where: {
        id: parseInt(id, 10),
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Update status and dateModified
    // dateModified: Always set to current date on status change, unless ENABLE_DATE_FIELD_EDITING provides a value
    const updateData: any = { 
      status,
      dateModified: dateModified ? new Date(dateModified) : new Date(),
    };

    const updated = await prisma.leetcode_Practice.update({
      where: { id: parseInt(id, 10) },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating LeetCode status:", error);
    return NextResponse.json({ error: "Failed to update problem status" }, { status: 500 });
  }
}

// PUT to update an entire LeetCode entry
export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, problem, problemType, difficulty, url, reflection, status, dateCreated, dateModified } = await request.json(); // ===== DATE FIELD EDITING =====

    if (!id) {
      return NextResponse.json({ error: "Problem ID is required" }, { status: 400 });
    }

    const existing = await prisma.leetcode_Practice.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    const updatedProblem = await prisma.leetcode_Practice.update({
      where: { id },
      data: {
        ...(problem !== undefined ? { problem: problem?.trim() || existing.problem } : {}),
        ...(problemType !== undefined ? { problemType: problemType?.trim() || null } : {}),
        ...(difficulty !== undefined ? { difficulty: difficulty?.trim() || null } : {}),
        ...(url !== undefined ? { url: url?.trim() || null } : {}),
        ...(reflection !== undefined ? { reflection: reflection?.trim() || null } : {}),
        ...(status !== undefined ? { status } : {}),
        // ===== DATE FIELD EDITING: Allow updating dateCreated and dateModified if provided =====
        ...(dateCreated !== undefined ? { dateCreated: new Date(dateCreated) } : {}),
        // dateModified: Always set to current date on any field update, unless ENABLE_DATE_FIELD_EDITING provides a value
        dateModified: dateModified ? new Date(dateModified) : new Date(),
      },
    });

    return NextResponse.json(updatedProblem);
  } catch (error) {
    console.error("Error updating LeetCode problem:", error);
    return NextResponse.json({ error: "Failed to update problem" }, { status: 500 });
  }
}

// DELETE a LeetCode entry
export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Problem ID is required" }, { status: 400 });
    }

    const existing = await prisma.leetcode_Practice.findFirst({
      where: {
        id: parseInt(id, 10),
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    await prisma.leetcode_Practice.delete({ where: { id: parseInt(id, 10) } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting LeetCode problem:", error);
    return NextResponse.json({ error: "Failed to delete problem" }, { status: 500 });
  }
}

"use server";

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/db";
import { getUserIdForRequest } from "@/app/lib/api-user-helper";
import { getDateInUserTimezone } from "@/app/lib/server-date-utils";

// GET all LeetCode records for the logged-in user (or specified user if instructor)
export async function GET(request: NextRequest) {
  try {
    const { userId, error } = await getUserIdForRequest(request);

    if (error || !userId) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
    }

    const problems = await prisma.leetcode_Practice.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json(problems);
  } catch (error) {
    console.error("Error fetching LeetCode problems:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { errorMessage, errorStack });
    return NextResponse.json(
      { error: "Failed to fetch problems", details: errorMessage },
      { status: 500 }
    );
  }
}

// POST a new LeetCode entry
export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await getUserIdForRequest(request);

    if (error || !userId) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
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
        userId: userId,
        // ===== DATE FIELD EDITING: Allow setting dateCreated and dateModified if provided =====
        dateCreated: dateCreated ? new Date(dateCreated) : undefined,
        // dateModified: Set to current date on create, or use provided value if specified (adjusted for user's timezone)
        dateModified: dateModified ? new Date(dateModified) : getDateInUserTimezone(),
      },
    });

    return NextResponse.json(newProblem);
  } catch (error) {
    console.error("Error creating LeetCode problem:", error);
    return NextResponse.json({ error: "Failed to create problem" }, { status: 500 });
  }
}

// PATCH to update just the status
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
      return NextResponse.json({ error: "Problem ID is required" }, { status: 400 });
    }

    if (status === undefined) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const existing = await prisma.leetcode_Practice.findFirst({
      where: {
        id: parseInt(id, 10),
        userId: userId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Only update if status actually changed
    if (status === existing.status) {
      // Status unchanged, return existing problem without updating
      return NextResponse.json(existing);
    }

    // Update status and dateModified
    // dateModified: Set to current date when status changes (adjusted for user's timezone)
    const updateData: any = { 
      status,
      dateModified: getDateInUserTimezone(),
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
export async function PUT(request: NextRequest) {
  try {
    const { userId, error } = await getUserIdForRequest(request);

    if (error || !userId) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
    }

    const { id, problem, problemType, difficulty, url, reflection, status, dateCreated } = await request.json(); // ===== DATE FIELD EDITING =====

    if (!id) {
      return NextResponse.json({ error: "Problem ID is required" }, { status: 400 });
    }

    const existing = await prisma.leetcode_Practice.findFirst({
      where: {
        id,
        userId: userId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Build update data only for fields that have actually changed
    const updateData: any = {};
    let hasChanges = false;

    if (problem !== undefined) {
      const trimmedProblem = problem?.trim() || existing.problem;
      if (trimmedProblem !== existing.problem) {
        updateData.problem = trimmedProblem;
        hasChanges = true;
      }
    }
    if (problemType !== undefined) {
      const trimmedProblemType = problemType?.trim() || null;
      if (trimmedProblemType !== existing.problemType) {
        updateData.problemType = trimmedProblemType;
        hasChanges = true;
      }
    }
    if (difficulty !== undefined) {
      const trimmedDifficulty = difficulty?.trim() || null;
      if (trimmedDifficulty !== existing.difficulty) {
        updateData.difficulty = trimmedDifficulty;
        hasChanges = true;
      }
    }
    if (url !== undefined) {
      const trimmedUrl = url?.trim() || null;
      if (trimmedUrl !== existing.url) {
        updateData.url = trimmedUrl;
        hasChanges = true;
      }
    }
    if (reflection !== undefined) {
      const trimmedReflection = reflection?.trim() || null;
      if (trimmedReflection !== existing.reflection) {
        updateData.reflection = trimmedReflection;
        hasChanges = true;
      }
    }
    if (status !== undefined && status !== existing.status) {
      updateData.status = status;
      hasChanges = true;
    }
    // ===== DATE FIELD EDITING: Allow updating dateCreated if provided =====
    if (dateCreated !== undefined) {
      const newDateCreated = new Date(dateCreated);
      if (newDateCreated.getTime() !== existing.dateCreated.getTime()) {
        updateData.dateCreated = newDateCreated;
        hasChanges = true;
      }
    }
    // dateModified: Only update if at least one field actually changed (adjusted for user's timezone)
    if (hasChanges) {
      updateData.dateModified = getDateInUserTimezone();
    }

    // Only perform update if there are actual changes
    const updatedProblem = hasChanges
      ? await prisma.leetcode_Practice.update({
          where: { id },
          data: updateData,
        })
      : existing;

    return NextResponse.json(updatedProblem);
  } catch (error) {
    console.error("Error updating LeetCode problem:", error);
    return NextResponse.json({ error: "Failed to update problem" }, { status: 500 });
  }
}

// DELETE a LeetCode entry
export async function DELETE(request: NextRequest) {
  try {
    const { userId, error } = await getUserIdForRequest(request);

    if (error || !userId) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Problem ID is required" }, { status: 400 });
    }

    const existing = await prisma.leetcode_Practice.findFirst({
      where: {
        id: parseInt(id, 10),
        userId: userId,
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

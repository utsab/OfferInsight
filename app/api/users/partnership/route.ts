import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import { getUserIdForRequest } from "@/app/lib/api-user-helper";

// GET: Fetch user's active partnership and history
export async function GET(request: NextRequest) {
  try {
    const { userId, error } = await getUserIdForRequest(request);

    if (error || !userId) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
    }

    // Get active partnership with partnership details
    const activePartnership = await prisma.userPartnership.findFirst({
      where: {
        userId,
        status: "active",
      },
      include: {
        partnership: true,
      },
    });

    // Get completed partnerships (history) with partnership details
    const completedPartnerships = await prisma.userPartnership.findMany({
      where: {
        userId,
        status: "completed",
      },
      include: {
        partnership: true,
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    // Transform to include partnershipName for backwards compatibility
    const activeResponse = activePartnership ? {
      ...activePartnership,
      partnershipName: activePartnership.partnership.name,
    } : null;

    const completedResponse = completedPartnerships.map(p => ({
      ...p,
      partnershipName: p.partnership.name,
    }));

    return NextResponse.json({
      active: activeResponse,
      completed: completedResponse,
    });
  } catch (error) {
    console.error("Error fetching user partnership:", error);
    return NextResponse.json(
      { error: "Failed to fetch partnership" },
      { status: 500 }
    );
  }
}

// POST: Start a new partnership
export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await getUserIdForRequest(request);

    if (error || !userId) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
    }

    const { partnershipId } = await request.json();

    if (!partnershipId) {
      return NextResponse.json(
        { error: "Partnership ID is required" },
        { status: 400 }
      );
    }

    // Check if partnership exists and has available spots
    const partnership = await prisma.partnership.findUnique({
      where: { id: partnershipId },
    });

    if (!partnership) {
      return NextResponse.json(
        { error: "Partnership not found" },
        { status: 404 }
      );
    }

    if (!partnership.isActive) {
      return NextResponse.json(
        { error: "This partnership is no longer available" },
        { status: 400 }
      );
    }

    if (partnership.activeUserCount >= partnership.maxUsers) {
      return NextResponse.json(
        { error: "This partnership is full. Please select a different one." },
        { status: 400 }
      );
    }

    // Check if user already has an active partnership
    const existingActive = await prisma.userPartnership.findFirst({
      where: {
        userId,
        status: "active",
      },
    });

    if (existingActive) {
      return NextResponse.json(
        { error: "You already have an active partnership. Complete or abandon it first." },
        { status: 400 }
      );
    }

    // Check if user has already completed this specific partnership
    const alreadyCompleted = await prisma.userPartnership.findFirst({
      where: {
        userId,
        partnershipId,
        status: "completed",
      },
    });

    if (alreadyCompleted) {
      return NextResponse.json(
        { error: "You have already completed this partnership." },
        { status: 400 }
      );
    }

    // Use transaction to create partnership and increment count atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create new user partnership
      const newPartnership = await tx.userPartnership.create({
        data: {
          userId,
          partnershipId,
          status: "active",
        },
        include: {
          partnership: true,
        },
      });

      // Increment active user count
      await tx.partnership.update({
        where: { id: partnershipId },
        data: {
          activeUserCount: {
            increment: 1,
          },
        },
      });

      return newPartnership;
    });

    return NextResponse.json({
      ...result,
      partnershipName: result.partnership.name,
    });
  } catch (error) {
    console.error("Error creating partnership:", error);
    return NextResponse.json(
      { error: "Failed to create partnership" },
      { status: 500 }
    );
  }
}

// PUT: Update partnership status (complete or abandon)
export async function PUT(request: NextRequest) {
  try {
    const { userId, error } = await getUserIdForRequest(request);

    if (error || !userId) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
    }

    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "Partnership ID and status are required" },
        { status: 400 }
      );
    }

    if (!["active", "completed", "abandoned"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'active', 'completed', or 'abandoned'" },
        { status: 400 }
      );
    }

    // Verify the partnership belongs to this user
    const userPartnership = await prisma.userPartnership.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!userPartnership) {
      return NextResponse.json(
        { error: "Partnership not found" },
        { status: 404 }
      );
    }

    const wasActive = userPartnership.status === "active";
    const becomingInactive = status === "completed" || status === "abandoned";

    // Use transaction to update status and decrement count atomically
    const result = await prisma.$transaction(async (tx) => {
      // Update the user partnership
      const updatedPartnership = await tx.userPartnership.update({
        where: { id },
        data: {
          status,
          completedAt: status === "completed" ? new Date() : null,
        },
        include: {
          partnership: true,
        },
      });

      // Decrement active user count if moving from active to completed/abandoned
      if (wasActive && becomingInactive) {
        await tx.partnership.update({
          where: { id: userPartnership.partnershipId },
          data: {
            activeUserCount: {
              decrement: 1,
            },
          },
        });
      }

      return updatedPartnership;
    });

    return NextResponse.json({
      ...result,
      partnershipName: result.partnership.name,
    });
  } catch (error) {
    console.error("Error updating partnership:", error);
    return NextResponse.json(
      { error: "Failed to update partnership" },
      { status: 500 }
    );
  }
}

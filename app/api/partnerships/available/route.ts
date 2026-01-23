import { NextResponse } from "next/server";
import { prisma } from "@/db";

// GET: Fetch all available partnerships (not full)
export async function GET() {
  try {
    // Get all active partnerships
    const allPartnerships = await prisma.partnership.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    // Filter into available (has spots) and full (no spots)
    const available = allPartnerships.filter(p => p.activeUserCount < p.maxUsers);
    const full = allPartnerships.filter(p => p.activeUserCount >= p.maxUsers);

    // Transform to include spotsRemaining
    const availableWithSpots = available.map(p => ({
      id: p.id,
      name: p.name,
      linkedIn: p.linkedIn,
      company: p.company,
      role: p.role,
      spotsRemaining: p.maxUsers - p.activeUserCount,
      maxUsers: p.maxUsers,
    }));

    const fullPartnerships = full.map(p => ({
      id: p.id,
      name: p.name,
      linkedIn: p.linkedIn,
      company: p.company,
      role: p.role,
    }));

    return NextResponse.json({
      available: availableWithSpots,
      full: fullPartnerships,
    });
  } catch (error) {
    console.error("Error fetching available partnerships:", error);
    return NextResponse.json(
      { error: "Failed to fetch available partnerships" },
      { status: 500 }
    );
  }
}

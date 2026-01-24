import { NextResponse } from "next/server";
import { prisma } from "@/db";
import partnershipsData from "@/partnerships/partnerships.json";
import typesData from "@/partnerships/types.json";

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

    // Helper to get criteria with type info
    const getCriteriaWithInfo = (partnershipId: number) => {
      const partnershipDef = partnershipsData.partnerships.find(p => p.id === partnershipId);
      if (!partnershipDef) return [];

      return partnershipDef.criteria.map(c => {
        if (c.type === 'multiple_choice' && c.choices) {
          return {
            ...c,
            choices: c.choices.map(choice => {
              const typeDef = (typesData.types as any)[choice.type];
              return {
                type: choice.type,
                label: typeDef?.metric || choice.type,
                quality: typeDef?.quality || 'Extra Goal',
                is_primary: typeDef?.is_primary ?? false
              };
            }),
            quality: (typesData.types as any)[c.choices[0].type]?.quality || 'Option'
          };
        }
        
        const typeDef = (typesData.types as any)[c.type];
        return {
          ...c,
          ...typeDef
        };
      });
    };

    // Transform to include spotsRemaining and criteria
    const availableWithSpots = available.map(p => ({
      id: p.id,
      name: p.name,
      linkedIn: p.linkedIn,
      company: p.company,
      role: p.role,
      spotsRemaining: p.maxUsers - p.activeUserCount,
      maxUsers: p.maxUsers,
      criteria: getCriteriaWithInfo(p.id)
    }));

    const fullWithCriteria = full.map(p => ({
      id: p.id,
      name: p.name,
      linkedIn: p.linkedIn,
      company: p.company,
      role: p.role,
      criteria: getCriteriaWithInfo(p.id)
    }));

    return NextResponse.json({
      available: availableWithSpots,
      full: fullWithCriteria,
    });
  } catch (error) {
    console.error("Error fetching available partnerships:", error);
    return NextResponse.json(
      { error: "Failed to fetch available partnerships" },
      { status: 500 }
    );
  }
}

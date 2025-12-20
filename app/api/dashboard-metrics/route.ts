import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/db";
import { getCurrentMonthDateRange } from "@/app/lib/date-utils";
import { getUserIdForRequest } from "@/app/lib/api-user-helper";

export async function GET(request: NextRequest) {
  try {
    const { userId, error } = await getUserIdForRequest(request);

    if (error || !userId) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 });
    }

    // Get the user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        appsWithOutreachPerWeek: true,
        linkedinOutreachPerWeek: true,
        inPersonEventsPerMonth: true,
        careerFairsPerYear: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Define date range for current month
    const { firstDayOfMonth, lastDayOfMonth } = getCurrentMonthDateRange();

    // Count applications with outreach created this month
    const appWithOutreachCount = await prisma.applications_With_Outreach.count({
      where: {
        userId: user.id,
        dateCreated: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
        msgToManager: {
          not: "",
        },
        msgToRecruiter: {
          not: "",
        },
        recruiter: {
          not: "",
        },
        hiringManager: {
          not: "",
        },
      },
    });

    // Count LinkedIn outreach created this month
    const linkedInOutreachCount = await prisma.linkedin_Outreach.count({
      where: {
        userId: user.id,
        dateCreated: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
    });

    // Count in-person events this month
    const inPersonEventsCount = await prisma.in_Person_Events.count({
      where: {
        userId: user.id,
        date: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
        status: {
          in: ["attended", "connectedOnline", "followUp"],
        },
      },
    });

    // Count career fairs this month (career fairs are now part of In_Person_Events with careerFair flag)
    const careerFairsCount = await prisma.in_Person_Events.count({
      where: {
        userId: user.id,
        date: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
        careerFair: true,
        status: {
          in: ["attended", "followUp"],
        },
      },
    });

    // Return the metrics data
    return NextResponse.json({
      appWithOutreachCount,
      linkedInOutreachCount,
      inPersonEventsCount,
      careerFairsCount,
      appsWithOutreachPerWeek: user.appsWithOutreachPerWeek || 10,
      linkedinOutreachPerWeek: user.linkedinOutreachPerWeek || 10,
      inPersonEventsPerMonth: user.inPersonEventsPerMonth || 5,
      careerFairsPerYear: user.careerFairsPerYear || 5,
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

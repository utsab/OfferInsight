import { NextResponse } from "next/server";
import { auth } from "auth";
import { prisma } from "@/db";

export async function GET() {
  // Get the user's session
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the user data
    const user = await prisma.user.findUnique({
      where: { email: session.user.email || "" },
      select: {
        id: true,
        apps_with_outreach_per_week: true,
        info_interview_outreach_per_week: true,
        in_person_events_per_month: true,
        career_fairs_quota: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Define date range for current month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const lastDayOfMonth = new Date();
    lastDayOfMonth.setMonth(lastDayOfMonth.getMonth() + 1);
    lastDayOfMonth.setDate(0);
    lastDayOfMonth.setHours(23, 59, 59, 999);

    // Count applications with outreach created this month
    const appWithOutreachCount = await prisma.applications_with_Outreach.count({
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

    // Count career fairs this month
    const careerFairsCount = await prisma.career_Fairs.count({
      where: {
        userId: user.id,
        date: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
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
      apps_with_outreach_per_week: user.apps_with_outreach_per_week || 10,
      info_interview_outreach_per_week:
        user.info_interview_outreach_per_week || 10,
      in_person_events_per_month: user.in_person_events_per_month || 5,
      career_fairs_quota: user.career_fairs_quota || 5,
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

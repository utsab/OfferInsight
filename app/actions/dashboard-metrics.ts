"use server";

import { auth } from "auth";
import { prisma } from "@/db";
import { getCurrentWeekDateRange, getCurrentMonthDateRange } from "@/app/lib/date-utils";


export async function getDashboardMetrics() {
  // Get the user's session
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  try {
    // Get the user data
    const user = await prisma.user.findUnique({
      where: { email: session.user.email || "" },
      select: {
        id: true,
        apps_with_outreach_per_week: true,
        info_interview_outreach_per_month: true,
        in_person_events_per_month: true,
        career_fairs_quota: true,
      },
    });

    if (!user) {
      return null;
    }

    // Define date range for current month
    const { firstDayOfMonth, lastDayOfMonth } = getCurrentMonthDateRange();

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
    return {
      appWithOutreachCount,
      linkedInOutreachCount,
      inPersonEventsCount,
      careerFairsCount,
      apps_with_outreach_per_week: user.apps_with_outreach_per_week || 10,
      info_interview_outreach_per_month:
        user.info_interview_outreach_per_month || 10,
      in_person_events_per_month: user.in_person_events_per_month || 5,
      career_fairs_quota: user.career_fairs_quota || 5,
    };
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return null;
  }
}

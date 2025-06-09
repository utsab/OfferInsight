"use server";

import { auth } from "auth";
import { prisma } from "@/db";

// Helper function to get the start and end of the current week (Monday to Sunday)
function getCurrentWeekDateRange() {
  const now = new Date();
  // Get the current day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const currentDay = now.getDay();

  // Calculate days to Monday (if today is Sunday, we need to go back 6 days)
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;

  // Create a new date for Monday (start of the week)
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysToMonday);
  monday.setHours(0, 0, 0, 0);

  // Create a new date for Sunday (end of the week)
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
}

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
        info_interview_outreach_per_week: true,
        in_person_events_per_month: true,
        career_fairs_quota: true,
      },
    });

    if (!user) {
      return null;
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
    return {
      appWithOutreachCount,
      linkedInOutreachCount,
      inPersonEventsCount,
      careerFairsCount,
      apps_with_outreach_per_week: user.apps_with_outreach_per_week || 10,
      info_interview_outreach_per_week:
        user.info_interview_outreach_per_week || 10,
      in_person_events_per_month: user.in_person_events_per_month || 5,
      career_fairs_quota: user.career_fairs_quota || 5,
    };
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return null;
  }
}

import { NextResponse } from "next/server";
import { getInstructorSession } from "@/app/lib/instructor-auth";
import { prisma } from "@/db";
import { getCurrentMonthDateRange } from "@/app/lib/date-utils";

// Completed status values based on dashboard completion column logic
// Mapping completion column IDs to status values (same as dashboard)
// Applications: completion columns map 1:1 to status values
const APPLICATION_COMPLETION_STATUSES = ['messagedHiringManager', 'messagedRecruiter', 'followedUp', 'interview'];

// LinkedIn: map completion column IDs to status values
// Columns: ['outreach', 'accepted', 'followedUpLinkedin', 'linkedinOutreach']
// Map to statuses: outreachRequestSent, accepted, followedUp, linkedinOutreach
const LINKEDIN_COMPLETION_STATUSES = ['outreachRequestSent', 'accepted', 'followedUp', 'linkedinOutreach'];

// Events: map completion column IDs to status values  
// Columns: ['attended', 'linkedinRequestsSent', 'followups']
// Map to statuses: attended, linkedinRequestsSent, followUp
const EVENT_COMPLETION_STATUSES = ['attended', 'linkedinRequestsSent', 'followUp'];

// LeetCode: completion column 'reflected' maps to status 'reflected'
const LEET_COMPLETION_STATUSES = ['reflected'];

export async function GET() {
  try {
    // Check instructor authentication
    const instructor = await getInstructorSession();
    if (!instructor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current month date range
    const { firstDayOfMonth, lastDayOfMonth } = getCurrentMonthDateRange();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        onboardingProgress: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // For each user, get their stats
    const studentsData = await Promise.all(
      users.map(async (user) => {
        // Check if user is active (has any activity in last 30 days)
        const recentActivity = await prisma.$transaction([
          prisma.applications_With_Outreach.findFirst({
            where: {
              userId: user.id,
              OR: [
                { dateCreated: { gte: thirtyDaysAgo } },
                { dateModified: { gte: thirtyDaysAgo } },
              ],
            },
          }),
          prisma.linkedin_Outreach.findFirst({
            where: {
              userId: user.id,
              OR: [
                { dateCreated: { gte: thirtyDaysAgo } },
                { dateModified: { gte: thirtyDaysAgo } },
              ],
            },
          }),
          prisma.in_Person_Events.findFirst({
            where: {
              userId: user.id,
              OR: [
                { dateCreated: { gte: thirtyDaysAgo } },
                { dateModified: { gte: thirtyDaysAgo } },
              ],
            },
          }),
          prisma.leetcode_Practice.findFirst({
            where: {
              userId: user.id,
              OR: [
                { dateCreated: { gte: thirtyDaysAgo } },
                { dateModified: { gte: thirtyDaysAgo } },
              ],
            },
          }),
        ]);
        const isActive = recentActivity.some(result => result !== null);

        // Count completed applications (last month and all time)
        const [applicationsLastMonth, applicationsAllTime] = await Promise.all([
          prisma.applications_With_Outreach.count({
            where: {
              userId: user.id,
              status: { in: APPLICATION_COMPLETION_STATUSES },
              dateCreated: {
                gte: firstDayOfMonth,
                lte: lastDayOfMonth,
              },
            },
          }),
          prisma.applications_With_Outreach.count({
            where: {
              userId: user.id,
              status: { in: APPLICATION_COMPLETION_STATUSES },
            },
          }),
        ]);

        // Count completed LinkedIn outreach / Coffee Chats (last month and all time)
        const [coffeeChatsLastMonth, coffeeChatsAllTime] = await Promise.all([
          prisma.linkedin_Outreach.count({
            where: {
              userId: user.id,
              status: { in: LINKEDIN_COMPLETION_STATUSES },
              dateCreated: {
                gte: firstDayOfMonth,
                lte: lastDayOfMonth,
              },
            },
          }),
          prisma.linkedin_Outreach.count({
            where: {
              userId: user.id,
              status: { in: LINKEDIN_COMPLETION_STATUSES },
            },
          }),
        ]);

        // Count completed events (last month and all time)
        // For events, use the `date` field, not dateCreated (matching dashboard logic)
        const [eventsLastMonth, eventsAllTime] = await Promise.all([
          prisma.in_Person_Events.count({
            where: {
              userId: user.id,
              status: { in: EVENT_COMPLETION_STATUSES },
              date: {
                gte: firstDayOfMonth,
                lte: lastDayOfMonth,
              },
            },
          }),
          prisma.in_Person_Events.count({
            where: {
              userId: user.id,
              status: { in: EVENT_COMPLETION_STATUSES },
            },
          }),
        ]);

        // Count completed LeetCode problems (last month and all time)
        const [leetCodeLastMonth, leetCodeAllTime] = await Promise.all([
          prisma.leetcode_Practice.count({
            where: {
              userId: user.id,
              status: { in: LEET_COMPLETION_STATUSES },
              dateCreated: {
                gte: firstDayOfMonth,
                lte: lastDayOfMonth,
              },
            },
          }),
          prisma.leetcode_Practice.count({
            where: {
              userId: user.id,
              status: { in: LEET_COMPLETION_STATUSES },
            },
          }),
        ]);

        return {
          id: user.id,
          name: user.name || 'Unknown',
          email: user.email,
          isActive,
          progress: user.onboardingProgress || 0,
          applications: {
            lastMonth: applicationsLastMonth,
            allTime: applicationsAllTime,
          },
          coffeeChats: {
            lastMonth: coffeeChatsLastMonth,
            allTime: coffeeChatsAllTime,
          },
          events: {
            lastMonth: eventsLastMonth,
            allTime: eventsAllTime,
          },
          leetCode: {
            lastMonth: leetCodeLastMonth,
            allTime: leetCodeAllTime,
          },
        };
      })
    );

    return NextResponse.json({ students: studentsData });
  } catch (error) {
    console.error("Error fetching students data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


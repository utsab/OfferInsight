import { NextResponse } from "next/server";
import { getInstructorSession } from "@/app/lib/instructor-auth";
import { prisma } from "@/db";
import { getCurrentMonthDateRange } from "@/app/lib/date-utils";

// Completed status values based on dashboard completion column logic
// Mapping completion column IDs to status values (same as dashboard)
// Applications: completion columns map 1:1 to status values
const APPLICATION_COMPLETION_STATUSES = ['messageHiringManager', 'messageRecruiter', 'followUp', 'interview'];

// LinkedIn: map completion column IDs to status values
// Columns: ['outreach', 'accepted', 'followedUpLinkedin', 'linkedinOutreach']
// Map to statuses: outreachRequestSent, accepted, followedUp, linkedinOutreach
const LINKEDIN_COMPLETION_STATUSES = ['sendingOutreachRequest', 'acceptingRequest', 'followingUp', 'linkedinOutreach', 'askingForReferral'];

// Events: map completion column IDs to status values  
// Columns: ['attended', 'linkedinRequestsSent', 'followups']
// Map to statuses: attended, linkedinRequestsSent, followUp
const EVENT_COMPLETION_STATUSES = ['attending', 'sendingLinkedInRequests', 'followingUp'];

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
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // Fetch all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // For each user, get their stats
    const studentsData = await Promise.all(
      users.map(async (user) => {
        // Find the most recent dateModified across all card types for activeStatus
        const [mostRecentApp, mostRecentLinkedIn, mostRecentEvent, mostRecentLeetCode] = await Promise.all([
          prisma.applications_With_Outreach.findFirst({
            where: { userId: user.id, dateModified: { not: null } },
            select: { dateModified: true },
            orderBy: { dateModified: 'desc' },
          }),
          prisma.linkedin_Outreach.findFirst({
            where: { userId: user.id, dateModified: { not: null } },
            select: { dateModified: true },
            orderBy: { dateModified: 'desc' },
          }),
          prisma.in_Person_Events.findFirst({
            where: { userId: user.id, dateModified: { not: null } },
            select: { dateModified: true },
            orderBy: { dateModified: 'desc' },
          }),
          prisma.leetcode_Practice.findFirst({
            where: { userId: user.id, dateModified: { not: null } },
            select: { dateModified: true },
            orderBy: { dateModified: 'desc' },
          }),
        ]);

        // Find the most recent dateModified across all card types
        const allDates = [
          mostRecentApp?.dateModified,
          mostRecentLinkedIn?.dateModified,
          mostRecentEvent?.dateModified,
          mostRecentLeetCode?.dateModified,
        ].filter((date): date is Date => date !== null && date !== undefined);

        const mostRecentDate = allDates.length > 0 
          ? new Date(Math.max(...allDates.map(d => d.getTime())))
          : null;

        // Calculate activeStatus based on most recent dateModified
        // Green (2): within 1 week, Yellow (1): within 2 weeks, Red (0): beyond 2 weeks or no activity
        let activeStatus = 0; // red
        if (mostRecentDate) {
          if (mostRecentDate >= oneWeekAgo) {
            activeStatus = 2; // green - within 1 week
          } else if (mostRecentDate >= twoWeeksAgo) {
            activeStatus = 1; // yellow - within 2 weeks but not 1 week
          } else {
            activeStatus = 0; // red - beyond 2 weeks
          }
        }

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

        // Calculate progressStatus based on metrics:
        // There are 3 categories:
        // 1. Applications (>= 1)
        // 2. Events/Coffee Chats (events >= 1 OR coffeeChats >= 4)
        // 3. LeetCode (>= 4)
        // Green (2): All 3 categories met
        // Yellow (1): 2 categories met (missing only 1)
        // Red (0): 1 or 0 categories met (missing 2 or more)
        const hasApplications = applicationsLastMonth >= 1;
        const hasEventsOrCoffeeChats = eventsLastMonth >= 1 || coffeeChatsLastMonth >= 4;
        const hasLeetCode = leetCodeLastMonth >= 4;
        
        const categoriesMet = [hasApplications, hasEventsOrCoffeeChats, hasLeetCode].filter(Boolean).length;
        const progressStatus = categoriesMet === 3 ? 2 : categoriesMet === 2 ? 1 : 0;

        return {
          id: user.id,
          name: user.name || 'Unknown',
          email: user.email,
          activeStatus,
          progressStatus,
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


import { NextResponse } from "next/server";
import { getInstructorSession } from "@/app/lib/instructor-auth";
import { prisma } from "@/db";
import { getCurrentMonthDateRange } from "@/app/lib/date-utils";
import partnershipsData from "@/partnerships/partnerships.json";

// Completed status values based on dashboard completion column logic
// Mapping completion column IDs to status values (same as dashboard)
// Applications: completion columns map 1:1 to status values
const APPLICATION_COMPLETION_STATUSES = ['messageHiringManager', 'messageRecruiter', 'followUp', 'interview'];

// LinkedIn: map completion column IDs to status values
// Columns: ['prospects', 'sendFirstMessage', 'requestAccepted', 'followUp', 'coffeeChat', 'askForReferral']
// Map to statuses: prospects, sendFirstMessage, requestAccepted, followUp, coffeeChat, askForReferral
const LINKEDIN_COMPLETION_STATUSES = ['prospects', 'sendFirstMessage', 'requestAccepted', 'followUp', 'coffeeChat', 'askForReferral'];

// Events: map completion column IDs to status values  
// Columns: ['attended', 'linkedinRequestsSent', 'followups']
// Map to statuses: attended, linkedinRequestsSent, followUp
const EVENT_COMPLETION_STATUSES = ['attended', 'sendLinkedInRequest', 'followUp'];

// LeetCode: completion column 'reflect' maps to status 'reflect'
const LEET_COMPLETION_STATUSES = ['reflect'];

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
        const [
          openSourceEntries,
          activePartnership,
        ] = await Promise.all([
          // Open Source: all entries for this user (to derive issues + criteria counts, including extras)
          prisma.openSourceEntry.findMany({
            where: {
              userId: user.id,
            },
            select: {
              status: true,
              criteriaType: true,
              selectedExtras: true,
              partnershipName: true,
              dateModified: true,
            },
          }),
          // Active partnership to get correct total criteria from partnership definition
          prisma.userPartnership.findFirst({
            where: { userId: user.id, status: 'active' },
            include: { partnership: true },
          }),
        ]);

        // Derive Open Source stats:
        // - issuesCompleted: number of 'issue' cards with status 'done'
        // - total criteria count: from partnership definition (sum of all criteria counts), matching OpenSourceTab
        // - completed criteria count: done entries fulfilling each criteria (direct or as extra)
        const issuesCompletedCount = openSourceEntries.filter(
          (entry) => entry.criteriaType === 'issue' && entry.status === 'done'
        ).length;

        let totalCriteriaCount = 0;
        let completedCriteriaCount = 0;

        if (activePartnership) {
          // Total = sum of ALL criteria counts (primaries + extras) from partnership definition.
          // Same logic as OpenSourceTab totalCriteriaProgress. multiple_choice → user's selected choice.
          const selections = (activePartnership.selections as Record<string, string>) || {};
          let mcIndex = 0;
          const criteria = (partnershipsData.partnerships.find(
            (p: { id: number }) => p.id === activePartnership.partnershipId
          )?.criteria || []).flatMap((c: { type: string; count?: number; choices?: { type: string; count?: number }[] }) => {
            if (c.type === 'multiple_choice' && c.choices) {
              const selectedType = selections[String(mcIndex)];
              mcIndex++;
              if (!selectedType) return [];
              const selectedChoice = c.choices.find((choice: { type: string }) => choice.type === selectedType);
              if (!selectedChoice) return [];
              return [{ type: selectedChoice.type, count: selectedChoice.count || 1 }];
            }
            return [{ type: c.type, count: c.count || 1 }];
          });

          const partnershipName = activePartnership.partnership.name;
          const doneEntries = openSourceEntries.filter(
            (e) => e.status === 'done' && e.partnershipName === partnershipName
          );

          for (const criteriaItem of criteria) {
            if (criteriaItem.type === 'multiple_choice') continue;

            const requiredCount = criteriaItem.count || 1;
            totalCriteriaCount += requiredCount;

            const completedForCriteria = doneEntries.filter((entry) => {
              if (entry.criteriaType === criteriaItem.type) return true;
              const extras = entry.selectedExtras as string[] | null;
              return extras && Array.isArray(extras) && extras.includes(criteriaItem.type);
            }).length;

            completedCriteriaCount += Math.min(completedForCriteria, requiredCount);
          }
        } else {
          // No active partnership: fall back to card-based count (legacy / no partnership selected)
          for (const entry of openSourceEntries) {
            const extras = Array.isArray(entry.selectedExtras)
              ? (entry.selectedExtras as unknown[]).length
              : 0;

            totalCriteriaCount += 1 + extras;

            if (entry.status === 'done') {
              completedCriteriaCount += 1 + extras;
            }
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

        // Count referrals received (all time - referrals are exciting achievements!)
        const referralCount = await prisma.linkedin_Outreach.count({
          where: {
            userId: user.id,
            recievedReferral: true,
          },
        });

        // Calculate activeStatus based on Open Source only (rolling windows from current day):
        // Green (2): At least 2 distinct criteria types completed in last 30 days (any criteria, not just issues)
        // Yellow (1): At least 1 issue completed in last 90 days
        // Red (0): No active partnership, or neither condition met
        // Green has priority over Yellow when both could apply
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        let activeStatus = 0; // Red by default

        if (activePartnership) {
          const partnershipName = activePartnership.partnership.name;
          const doneEntriesForPartnership = openSourceEntries.filter(
            (e) => e.status === 'done' && e.partnershipName === partnershipName
          );

          // Green: at least 2 distinct criteria types completed in last 30 days
          const doneInLast30Days = doneEntriesForPartnership.filter(
            (e) => e.dateModified && new Date(e.dateModified) >= thirtyDaysAgo
          );
          const criteriaTypesInLast30Days = new Set<string>();
          for (const e of doneInLast30Days) {
            if (e.criteriaType) criteriaTypesInLast30Days.add(e.criteriaType);
            const extras = e.selectedExtras as string[] | null;
            if (extras && Array.isArray(extras)) {
              extras.forEach((t) => criteriaTypesInLast30Days.add(t));
            }
          }
          if (criteriaTypesInLast30Days.size >= 2) {
            activeStatus = 2; // Green
          } else {
            // Yellow: at least 1 issue completed in last 90 days
            const issueDoneInLast90Days = doneEntriesForPartnership.some(
              (e) =>
                e.criteriaType === 'issue' &&
                e.dateModified &&
                new Date(e.dateModified) >= ninetyDaysAgo
            );
            if (issueDoneInLast90Days) {
              activeStatus = 1; // Yellow
            }
          }
        }

        // Calculate progressStatus based on non-Open Source tabs (Applications, Events/Coffee Chats, LeetCode):
        // Green (2): All 3 categories met
        // Yellow (1): 2 categories met
        // Red (0): 1 or 0 categories met
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
          referralCount,
          openSource: {
            issuesCompleted: issuesCompletedCount,
            completedCount: completedCriteriaCount,
            totalCount: totalCriteriaCount,
            partnershipName: activePartnership?.partnership?.name ?? null,
          },
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


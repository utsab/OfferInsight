import { lusitana } from "@/app/ui/fonts";
import { redirect } from "next/navigation";
import { auth } from "auth";
import { prisma } from "@/db";
import { TotalProgressBarWrapper } from "@/app/ui/dashboard/total-progress-wrapper";
import { getCurrentWeekDateRange, getCurrentMonthDateRange } from "@/app/lib/date-utils";

export default async function Page() {
  const session = await auth();
  if (!session?.user) {
    console.log("Unauthorized!!!!!!!!!!!!!!!!!!!!!!");
    redirect("/"); // Redirect to the sign-in page
  }

  // Get the user data with custom type to handle onboarding_progress
  const user = await prisma.user.findUnique({
    where: { email: session.user.email || "" },
    select: {
      id: true,
      onboarding_progress: true,
      apps_with_outreach_per_week: true,
      info_interview_outreach_per_week: true,
      in_person_events_per_month: true,
      career_fairs_quota: true,
    },
  });

  if (!user) {
    redirect("/");
  }

  if (user.onboarding_progress === 0) {
    console.log("Onboarding progress is 0.");
    redirect("/onboarding/page1");
  } else if (user.onboarding_progress === 1) {
    redirect("/onboarding/page2");
  } else if (user.onboarding_progress === 2) {
    redirect("/onboarding/page3");
  }

  // Get the current week's date range
  const { monday, sunday } = getCurrentWeekDateRange();

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

  // Prepare metrics for total progress bar - this will be used as initial data
  // The client-side context will take over for updates
  const metricsData = [
    {
      name: "Applications",
      current: appWithOutreachCount,
      total: user.apps_with_outreach_per_week || 10,
    },
    {
      name: "LinkedIn",
      current: linkedInOutreachCount,
      total: user.info_interview_outreach_per_week || 10,
    },
    {
      name: "Events",
      current: inPersonEventsCount,
      total: user.in_person_events_per_month || 5,
    },
    {
      name: "Career Fairs",
      current: careerFairsCount,
      total: user.career_fairs_quota || 5,
    },
  ];

  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Dashboard
      </h1>

      {/* Total Progress Bar - provide initial server-rendered data */}
      <TotalProgressBarWrapper metricsData={metricsData} />

      {/* <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
        <AnalyticsCard
          title="Applications with Outreach"
          current={appWithOutreachCount}
          total={user.apps_with_outreach_per_week || -1}
          displayValue={`${appWithOutreachCount}/${
            user.apps_with_outreach_per_week || 10
          } per week`}
        />

        <AnalyticsCard
          title="Linked-in Outreach"
          current={linkedInOutreachCount}
          total={user.info_interview_outreach_per_week || -1}
          displayValue={`${linkedInOutreachCount}/${
            user.info_interview_outreach_per_week || 10
          } per week`}
        />

        <AnalyticsCard
          title="In-person Events"
          current={inPersonEventsCount}
          total={user.in_person_events_per_month || -1}
          displayValue={`${inPersonEventsCount}/${
            user.in_person_events_per_month || -1
          } per month`}
        />

        <AnalyticsCard
          title="Career Fairs"
          current={careerFairsCount}
          total={user.career_fairs_quota || -1}
          displayValue={`${careerFairsCount}/${
            user.career_fairs_quota || -1
          } total`}
        />
      </div> */}
    </main>
  );
}

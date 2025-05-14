import { AnalyticsCard } from "@/app/ui/dashboard/analytics-card";
import { lusitana } from "@/app/ui/fonts";
import { redirect } from "next/navigation";
import { auth } from "auth";
import { prisma } from "@/db";

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
      apps_with_outreach_tracker: true,
      info_interview_outreach_per_week: true,
      in_person_events_per_month: true,
      lastTrackerResetDate: true,
    },
  });

  if (!user) {
    redirect("/");
  }

  // Check if we need to reset the tracker (if it's Monday and hasn't been reset yet)
  const today = new Date();
  const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday
  const lastReset = user.lastTrackerResetDate
    ? new Date(user.lastTrackerResetDate)
    : null;

  // If it's Monday (1) or if the last reset was before this week's Monday, reset the tracker
  const needsReset =
    currentDay === 1 &&
    (!lastReset || lastReset.getTime() < getStartOfMonday(today).getTime());

  if (needsReset) {
    // Reset the tracker and update the last reset date
    await prisma.user.update({
      where: { id: user.id },
      data: {
        apps_with_outreach_tracker: 0,
        lastTrackerResetDate: today,
      },
    });

    // Update the user object with reset values for display
    user.apps_with_outreach_tracker = 0;
  }

  if (user.onboarding_progress === 0) {
    console.log("Onboarding progress is 0.");
    redirect("/onboarding/page1");
  } else if (user.onboarding_progress === 1) {
    redirect("/onboarding/page2");
  } else if (user.onboarding_progress === 2) {
    redirect("/onboarding/page3");
  }

  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Dashboard
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
        <AnalyticsCard
          title="Applications with Outreach"
          current={user.apps_with_outreach_tracker || 0}
          total={user.apps_with_outreach_per_week || 10}
          displayValue={`${user.apps_with_outreach_tracker || 0}/${
            user.apps_with_outreach_per_week || 10
          } per week`}
        />

        <AnalyticsCard
          title="Linked-in Outreach"
          current={0}
          total={user.info_interview_outreach_per_week || 10}
          displayValue={`0/${
            user.info_interview_outreach_per_week || 10
          } per week`}
        />

        <AnalyticsCard
          title="In-person Events"
          current={0}
          total={user.in_person_events_per_month || 5}
          displayValue={`0/${user.in_person_events_per_month || 5} per month`}
        />

        <AnalyticsCard
          title="Career Fairs - TODO: onboarding request."
          current={0}
          total={10}
          displayValue="0/10"
        />
      </div>
    </main>
  );
}

// Helper function to get the start of Monday for the current week
function getStartOfMonday(date: Date): Date {
  const day = date.getDay(); // 0 is Sunday, 1 is Monday
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday being 0
  const monday = new Date(date);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

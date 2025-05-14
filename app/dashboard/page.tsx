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
      info_interview_outreach_per_week: true,
      in_person_events_per_month: true,
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

  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Dashboard
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
        <AnalyticsCard
          title="Applications with Outreach"
          current={0}
          total={user.apps_with_outreach_per_week || 10}
          displayValue={`0/${user.apps_with_outreach_per_week || 10} per week`}
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

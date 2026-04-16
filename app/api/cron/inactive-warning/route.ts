import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db";
import {
  sendEmail,
  buildInactivityWarningEmail,
  buildSecondWarningEmail,
  buildRemovalNoticeEmail,
} from "@/app/lib/email";

type WarningLevel = "first" | "second" | "removal";

interface EmailResult {
  userId: string;
  email: string;
  warningLevel: WarningLevel;
  success: boolean;
  error?: string;
}

const DEBUG_TEST_EMAILS = ["utsab.k.saha@gmail.com", "ttran913@gmail.com"];

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET;

    if (!expectedToken) {
      console.error("CRON_SECRET environment variable is not set");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const debugMode = searchParams.get("debug") === "true";

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const baseWhere = {
      email: { not: null },
      partnerships: { some: { status: "active" } },
      removedFromResumeBook: false,
      openSource: {
        some: {},
        none: { dateModified: { gte: thirtyDaysAgo } },
      },
      OR: [
        { inactivityWarningCount: 0 },
        {
          inactivityWarningCount: { in: [1, 2] },
          lastInactivityWarningSent: { lt: sevenDaysAgo },
        },
      ],
    };

    const inactiveUsers = await prisma.user.findMany({
      where: debugMode
        ? { ...baseWhere, email: { in: DEBUG_TEST_EMAILS } }
        : baseWhere,
      select: {
        id: true,
        email: true,
        name: true,
        inactivityWarningCount: true,
      },
    });

    const results: EmailResult[] = [];

    for (const user of inactiveUsers) {
      if (!user.email) continue;

      const currentWarningCount = user.inactivityWarningCount;
      let warningLevel: WarningLevel;
      let emailContent: { subject: string; text: string; html: string };
      let updateData: { lastInactivityWarningSent: Date; inactivityWarningCount: number; removedFromResumeBook?: boolean };

      if (currentWarningCount === 0) {
        warningLevel = "first";
        emailContent = buildInactivityWarningEmail(user.name);
        updateData = {
          lastInactivityWarningSent: new Date(),
          inactivityWarningCount: 1,
        };
      } else if (currentWarningCount === 1) {
        warningLevel = "second";
        emailContent = buildSecondWarningEmail(user.name);
        updateData = {
          lastInactivityWarningSent: new Date(),
          inactivityWarningCount: 2,
        };
      } else {
        warningLevel = "removal";
        emailContent = buildRemovalNoticeEmail(user.name);
        updateData = {
          lastInactivityWarningSent: new Date(),
          inactivityWarningCount: 3,
          removedFromResumeBook: true,
        };
      }

      try {
        await sendEmail({
          to: user.email,
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html,
        });
        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
        results.push({ userId: user.id, email: user.email, warningLevel, success: true });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`Failed to send ${warningLevel} warning to ${user.email}:`, errorMessage);
        results.push({ userId: user.id, email: user.email, warningLevel, success: false, error: errorMessage });
      }
    }

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    const summary = {
      firstWarnings: successful.filter((r) => r.warningLevel === "first").length,
      secondWarnings: successful.filter((r) => r.warningLevel === "second").length,
      removalNotices: successful.filter((r) => r.warningLevel === "removal").length,
    };

    console.log(
      `Inactivity warnings sent: ${summary.firstWarnings} first, ${summary.secondWarnings} second, ${summary.removalNotices} removals. Failed: ${failed.length}`
    );

    return NextResponse.json({
      message: "Inactivity warning job completed",
      debugMode,
      totalProcessed: inactiveUsers.length,
      summary,
      emailsFailed: failed.length,
      details: results,
    });
  } catch (error) {
    console.error("Error in inactivity warning cron job:", error);
    return NextResponse.json(
      { error: "Failed to process inactivity warnings" },
      { status: 500 }
    );
  }
}

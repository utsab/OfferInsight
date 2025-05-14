import { NextResponse } from "next/server";
import { prisma } from "@/db";
import { auth } from "auth";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Increment the apps_with_outreach_tracker counter for the user
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        apps_with_outreach_tracker: {
          increment: 1,
        },
      },
      select: {
        apps_with_outreach_tracker: true,
        apps_with_outreach_per_week: true,
      },
    });

    return NextResponse.json({
      success: true,
      current: updatedUser.apps_with_outreach_tracker,
      total: updatedUser.apps_with_outreach_per_week,
    });
  } catch (error) {
    console.error("Error incrementing tracker:", error);
    return NextResponse.json(
      { error: "Failed to update tracker." },
      { status: 500 }
    );
  }
}

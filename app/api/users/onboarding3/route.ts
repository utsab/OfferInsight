import { NextResponse } from 'next/server';
import { prisma } from '@/db';
import { auth } from 'auth';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { 
      commitment, 
      apps_with_outreach_per_week, 
      info_interview_outreach_per_month, 
      in_person_events_per_month,
      career_fairs_quota,
      projected_offer_date
    } = await request.json();

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        commitment,
        apps_with_outreach_per_week,
        info_interview_outreach_per_month,
        in_person_events_per_month,
        career_fairs_quota,
        projected_offer_date: projected_offer_date ? new Date(projected_offer_date) : undefined,
        onboarding_progress: 3,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user plan:', error);
    return NextResponse.json({ error: 'Failed to update user plan.' }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import { prisma } from '@/db';
import { auth } from 'auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        school: true,
        major: true,
        expectedGraduationDate: true,
        monthsToSecureInternship: true,
        commitment: true,
        applications_per_week: true,
        apps_with_outreach_per_week: true,
        info_interview_outreach_per_week: true,
        in_person_events_per_month: true,
        onboarding_progress: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: 'Failed to fetch user data.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { monthsToSecureInternship, commitment, applications_per_week, apps_with_outreach_per_week, info_interview_outreach_per_week, in_person_events_per_month } = await request.json();

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        monthsToSecureInternship,
        commitment,
        applications_per_week,
        apps_with_outreach_per_week,
        info_interview_outreach_per_week,
        in_person_events_per_month,
        onboarding_progress: 2,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user information:', error);
    return NextResponse.json({ error: 'Failed to update user information.' }, { status: 500 });
  }
}
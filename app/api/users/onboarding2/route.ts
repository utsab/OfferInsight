import { NextResponse } from 'next/server';
import { prisma } from '@/db';
import { auth } from 'auth';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { monthsToSecureInternship } = await request.json();

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        monthsToSecureInternship,
        onboarding_progress: 2,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user information:', error);
    return NextResponse.json({ error: 'Failed to update user information.' }, { status: 500 });
  }
}
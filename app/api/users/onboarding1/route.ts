import { NextResponse } from 'next/server';
import { prisma } from '@/db';
import { auth } from 'auth';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { name, school, major, expectedGraduationDate } = body;

    const leetPatch =
      Object.prototype.hasOwnProperty.call(body, 'leetCodeUserName')
        ? {
            leetCodeUserName:
              typeof body.leetCodeUserName === 'string' && body.leetCodeUserName.trim().length > 0
                ? body.leetCodeUserName.trim()
                : null,
          }
        : {};

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name,
        school,
        major,
        expectedGraduationDate: new Date(expectedGraduationDate),
        onboardingProgress: 1,
        ...leetPatch,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user information:', error);
    return NextResponse.json({ error: 'Failed to update user information.' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { prisma } from '@/db';
import { auth } from 'auth';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { name, school, major, expectedGraduationDate } = await request.json();

    console.log('onboarding1 API route called *****************************');
    console.log("name: ", name, "school: ", school, "major: ", major, "expectedGraduationDate: ", expectedGraduationDate);

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name,
        school,
        major,
        expectedGraduationDate: new Date(expectedGraduationDate),
        onboarding_progress: 1,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user information:', error);
    return NextResponse.json({ error: 'Failed to update user information.' }, { status: 500 });
  }
}
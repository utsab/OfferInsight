"use server"

import { cookies } from 'next/headers';
import { prisma } from '@/db';

export async function getInstructorSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('instructor_session')?.value;

  if (!sessionId) {
    return null;
  }

  try {
    const instructor = await prisma.instructor.findUnique({
      where: { id: sessionId },
    });

    return instructor;
  } catch (error) {
    console.error('Error fetching instructor session:', error);
    return null;
  }
}

export async function signOutInstructor() {
  const cookieStore = await cookies();
  cookieStore.delete('instructor_session');
}


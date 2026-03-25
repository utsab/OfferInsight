"use server"

import { cookies } from 'next/headers';
import { prisma } from '@/db';

export const INSTRUCTOR_ROLES = {
  ADMIN: 'ADMIN',
  READ_ONLY: 'READ_ONLY',
} as const;

export type InstructorRole = typeof INSTRUCTOR_ROLES[keyof typeof INSTRUCTOR_ROLES];

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

export function canInstructorMutateUserData(instructor: { role?: string } | null) {
  if (!instructor) return false;
  return instructor.role !== INSTRUCTOR_ROLES.READ_ONLY;
}

export async function signOutInstructor() {
  const cookieStore = await cookies();
  cookieStore.delete('instructor_session');
}


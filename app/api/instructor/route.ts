import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getInstructorSession } from '@/app/lib/instructor-auth';
import { prisma } from '@/db';

// GET - Get current instructor session
export async function GET() {
  try {
    const instructor = await getInstructorSession();
    
    if (!instructor) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      id: instructor.id,
      username: instructor.username,
    });
  } catch (error) {
    console.error('Error fetching instructor session:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

// POST - Sign in (if body has username/password) or Sign out (if body has action: 'signout')
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if this is a sign-out request
    if (body.action === 'signout') {
      const cookieStore = await cookies();
      cookieStore.delete('instructor_session');
      return NextResponse.json({ success: true });
    }
    
    // Otherwise, treat as sign-in
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // For now, we'll check against hardcoded credentials first
    // In production, you should hash passwords and compare properly
    if (username === 'instructor00' && password === 'opensource00') {
      // Find or create the instructor with correct credentials
      let instructor = await prisma.instructor.findUnique({
        where: { username: 'instructor00' },
      });

      if (!instructor) {
        // Create the instructor if it doesn't exist
        instructor = await prisma.instructor.create({
          data: {
            username: 'instructor00',
            password: 'opensource00', // In production, hash this
          },
        });
      } else if (instructor.password !== 'opensource00') {
        // Update password if it doesn't match (in case of old data)
        instructor = await prisma.instructor.update({
          where: { id: instructor.id },
          data: { password: 'opensource00' },
        });
      }

      // Set session cookie
      const cookieStore = await cookies();
      cookieStore.set('instructor_session', instructor.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return NextResponse.json({ success: true });
    }

    // Check if instructor exists and password matches (for future non-hardcoded instructors)
    const existingInstructor = await prisma.instructor.findUnique({
      where: { username },
    });

    if (existingInstructor && existingInstructor.password === password) {
      // Set session cookie
      const cookieStore = await cookies();
      cookieStore.set('instructor_session', existingInstructor.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid username or password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Instructor authentication error:', error);
    return NextResponse.json(
      { error: 'An error occurred during authentication' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getInstructorSession } from '@/app/lib/instructor-auth';
import { prisma } from '@/db';
import bcrypt from 'bcrypt';

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

    // Find instructor by username
    const instructor = await prisma.instructor.findUnique({
      where: { username },
    });

    if (!instructor) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Check if password is hashed (starts with $2a$, $2b$, or $2y$)
    const isPasswordHashed = instructor.password.startsWith('$2a$') || 
                            instructor.password.startsWith('$2b$') || 
                            instructor.password.startsWith('$2y$');

    let passwordMatches = false;

    if (isPasswordHashed) {
      // Compare with bcrypt
      passwordMatches = await bcrypt.compare(password, instructor.password);
    } else {
      // Legacy plaintext password - compare directly, then hash it
      passwordMatches = instructor.password === password;
      
      // If password matches and it's plaintext, hash it for future use
      if (passwordMatches) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.instructor.update({
          where: { id: instructor.id },
          data: { password: hashedPassword },
        });
      }
    }

    if (!passwordMatches) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
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
  } catch (error) {
    console.error('Instructor authentication error:', error);
    return NextResponse.json(
      { error: 'An error occurred during authentication' },
      { status: 500 }
    );
  }
}


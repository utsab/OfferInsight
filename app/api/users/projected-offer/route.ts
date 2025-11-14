import { NextResponse } from 'next/server';
import { prisma } from '@/db';
import { auth } from 'auth';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { projectedOfferDate } = await request.json();

    if (!projectedOfferDate) {
      return NextResponse.json({ error: 'projectedOfferDate is required' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        projectedOfferDate: new Date(projectedOfferDate),
      },
      select: {
        id: true,
        projectedOfferDate: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating projected offer date:', error);
    return NextResponse.json({ error: 'Failed to update projected offer date.' }, { status: 500 });
  }
}


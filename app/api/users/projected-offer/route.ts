import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/db';
import { getUserIdForRequest } from '@/app/lib/api-user-helper';

export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await getUserIdForRequest(request);

    if (error || !userId) {
      return NextResponse.json({ error: error || 'Not authenticated' }, { status: 401 });
    }

    const { projectedOfferDate } = await request.json();

    if (!projectedOfferDate) {
      return NextResponse.json({ error: 'projectedOfferDate is required' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
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


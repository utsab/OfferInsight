import { NextRequest, NextResponse } from 'next/server';
import { getUserIdForRequest } from '@/app/lib/api-user-helper';
import { deepWorkSchedulePayload, validateSlotSelection } from '@/app/lib/deep-work/slots';
import { prisma } from '@/db';

async function loadSlotKeys(userId: string): Promise<string[]> {
  const rows = await prisma.deepWorkSlotSignup.findMany({
    where: { userId },
    select: { slotKey: true },
  });
  return rows.map((row) => row.slotKey);
}

/** The student's weekly Deep Work slots and next session. Instructors may pass `?userId=`. */
export async function GET(request: NextRequest) {
  try {
    const { userId, error } = await getUserIdForRequest(request);
    if (!userId) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(deepWorkSchedulePayload(await loadSlotKeys(userId)));
  } catch (error) {
    console.error('Error fetching Deep Work schedule:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}

/** Replace the signed-in student's picks. Body: `{ slotKeys: ["mon-19", "thu-18"] }`. */
export async function PUT(request: NextRequest) {
  try {
    if (new URL(request.url).searchParams.has('userId')) {
      return NextResponse.json(
        { error: 'Students choose their own Deep Work sessions.' },
        { status: 403 }
      );
    }
    const { userId, error } = await getUserIdForRequest(request);
    if (!userId) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const slotKeys = body?.slotKeys;
    const invalid = validateSlotSelection(slotKeys);
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.deepWorkSlotSignup.deleteMany({ where: { userId } }),
      prisma.deepWorkSlotSignup.createMany({
        data: (slotKeys as string[]).map((slotKey) => ({ userId, slotKey })),
      }),
    ]);

    return NextResponse.json(deepWorkSchedulePayload(slotKeys as string[]));
  } catch (error) {
    console.error('Error saving Deep Work schedule:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db';
import { getUserIdForRequest, canMutateUserDataForRequest } from '@/app/lib/api-user-helper';

export async function GET(request: NextRequest) {
  try {
    const { userId, error } = await getUserIdForRequest(request);
    if (error || !userId) {
      return NextResponse.json({ error: error || 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        school: true,
        major: true,
        expectedGraduationDate: true,
        leetCodeUserName: true,
        accounts: {
          select: {
            provider: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const providerSet = new Set(
      user.accounts
        .map((account) => account.provider?.trim().toLowerCase())
        .filter((provider): provider is string => Boolean(provider))
    );

    // Keep email as a fallback login method for magic-link/passwordless flows.
    if (user.email) {
      providerSet.add('email');
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      school: user.school,
      major: user.major,
      expectedGraduationDate: user.expectedGraduationDate,
      leetCodeUserName: user.leetCodeUserName,
      loginMethods: Array.from(providerSet),
    });
  } catch (error) {
    console.error('Error fetching account data:', error);
    return NextResponse.json({ error: 'Failed to fetch account data.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const mutationPermission = await canMutateUserDataForRequest(request);
    if (!mutationPermission.allowed) {
      return NextResponse.json({ error: mutationPermission.error || 'Forbidden' }, { status: 403 });
    }

    const { userId, error } = await getUserIdForRequest(request);
    if (error || !userId) {
      return NextResponse.json({ error: error || 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: typeof body.name === 'string' ? body.name.trim() || null : undefined,
        school: typeof body.school === 'string' ? body.school.trim() || null : undefined,
        major: typeof body.major === 'string' ? body.major.trim() || null : undefined,
        leetCodeUserName:
          typeof body.leetCodeUserName === 'string'
            ? body.leetCodeUserName.trim() || null
            : undefined,
        expectedGraduationDate:
          typeof body.expectedGraduationDate === 'string' && body.expectedGraduationDate
            ? new Date(`${body.expectedGraduationDate}T00:00:00.000Z`)
            : body.expectedGraduationDate === null
              ? null
              : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        school: true,
        major: true,
        expectedGraduationDate: true,
        leetCodeUserName: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating account data:', error);
    return NextResponse.json({ error: 'Failed to update account data.' }, { status: 500 });
  }
}

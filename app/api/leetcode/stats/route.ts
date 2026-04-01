import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db';
import { getUserIdForRequest } from '@/app/lib/api-user-helper';

type LeetCodeStats = {
  solved: number;
  easy: number;
  medium: number;
  hard: number;
  username: string | null;
};

const EMPTY_STATS: LeetCodeStats = {
  solved: 0,
  easy: 0,
  medium: 0,
  hard: 0,
  username: null,
};

const LEETCODE_QUERY = `
  query userProfileUserQuestionProgressV2($userSlug: String!) {
    matchedUser(username: $userSlug) {
      username
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
    }
  }
`;

export async function GET(request: NextRequest) {
  try {
    const { userId, error } = await getUserIdForRequest(request);
    if (error || !userId) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { leetCodeUserName: true },
    });

    const username = user?.leetCodeUserName?.trim() || null;
    if (!username) {
      return NextResponse.json({ ...EMPTY_STATS, username: null, hasUsername: false });
    }

    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: LEETCODE_QUERY,
        variables: { userSlug: username },
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ ...EMPTY_STATS, username, hasUsername: true, unavailable: true });
    }

    const payload = await response.json();
    const rows: Array<{ difficulty: string; count: number }> =
      payload?.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum ?? [];

    const stats: LeetCodeStats = { ...EMPTY_STATS, username };
    for (const row of rows) {
      const key = String(row.difficulty || '').toLowerCase();
      const count = Number(row.count) || 0;
      if (key === 'all') stats.solved = count;
      if (key === 'easy') stats.easy = count;
      if (key === 'medium') stats.medium = count;
      if (key === 'hard') stats.hard = count;
    }

    return NextResponse.json({ ...stats, hasUsername: true, unavailable: false });
  } catch (error) {
    console.error('Error fetching LeetCode stats:', error);
    return NextResponse.json({ ...EMPTY_STATS, hasUsername: false, unavailable: true }, { status: 500 });
  }
}

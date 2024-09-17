'use server';

import { NextResponse } from 'next/server';
import { db } from '@vercel/postgres';

const client = await db.connect();

export async function GET() {
  console.log('Fetching applications...');
  try {
    const result = await client.sql`
      SELECT application_id, company, first_round_or_coding_challenge, final_round, offer
      FROM applications
      ORDER BY company ASC
    `;
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to fetch applications.' }, { status: 500 });
  }
}
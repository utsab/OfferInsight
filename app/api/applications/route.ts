'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/db'; // Import the prisma client

export async function GET() {
  console.log('Fetching applications...');
  try {
    const applications = await prisma.applications.findMany({
      orderBy: {
        id: 'asc',
      },
    });
    return NextResponse.json(applications);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to fetch applications.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { company, firstRound, finalRound, offer } = await request.json();
    const newApplication = await prisma.applications.create({
      data: {
        company,
        firstRound,
        finalRound,
        offer,
      },
    });
    return NextResponse.json(newApplication);
  } catch (error) {
    console.error('Error adding new application:', error);
    return NextResponse.json({ error: 'Failed to add new application.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    const updatedApplication = await prisma.applications.update({
      where: { id },
      data,
    });
    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json({ error: 'Failed to update application.' }, { status: 500 });
  }
}
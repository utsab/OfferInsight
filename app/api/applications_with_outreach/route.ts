'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/db'; // Import the prisma client

export async function GET() {
  console.log('Fetching applications with outreach...');
  try {
    const applicationsWithOutreach = await prisma.applications_with_Outreach.findMany({
      orderBy: {
        id: 'asc',
      },
    });
    return NextResponse.json(applicationsWithOutreach);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to fetch applications.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { company, hiringManager, msgToManager, recruiter, firstRound, finalRound, offer } = await request.json();
    const newApplicationWithOutreach = await prisma.applications_with_Outreach.create({
      data: {
        company,
        hiringManager,
        msgToManager,
        recruiter,
        firstRound,
        finalRound,
        offer,
      },
    });
    return NextResponse.json(newApplicationWithOutreach);
  } catch (error) {
    console.error('Error adding new application:', error);
    return NextResponse.json({ error: 'Failed to add new application.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    const updatedApplicationWithOutreach = await prisma.applications_with_Outreach.update({
      where: { id },
      data,
    });
    return NextResponse.json(updatedApplicationWithOutreach);
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json({ error: 'Failed to update application.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.applications_with_Outreach.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    return NextResponse.json({ error: 'Failed to delete application.' }, { status: 500 });
  }
}
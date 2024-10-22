'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/db'; // Import the prisma client

export async function GET() {
  console.log('Fetching LinkedIn outreach entries...');
  try {
    const linkedInOutreach = await prisma.linkedin_Outreach.findMany({
      orderBy: {
        id: 'asc',
      },
    });
    return NextResponse.json(linkedInOutreach);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to fetch LinkedIn outreach entries.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, company, message, result } = await request.json();
    const newLinkedInOutreach = await prisma.linkedin_Outreach.create({
      data: {
        name,
        company,
        message,
        result,
      },
    });
    return NextResponse.json(newLinkedInOutreach);
  } catch (error) {
    console.error('Error adding new LinkedIn outreach entry:', error);
    return NextResponse.json({ error: 'Failed to add new LinkedIn outreach entry.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    const updatedLinkedInOutreach = await prisma.linkedin_Outreach.update({
      where: { id },
      data,
    });
    return NextResponse.json(updatedLinkedInOutreach);
  } catch (error) {
    console.error('Error updating LinkedIn outreach entry:', error);
    return NextResponse.json({ error: 'Failed to update LinkedIn outreach entry.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.linkedin_Outreach.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'LinkedIn outreach entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting LinkedIn outreach entry:', error);
    return NextResponse.json({ error: 'Failed to delete LinkedIn outreach entry.' }, { status: 500 });
  }
}
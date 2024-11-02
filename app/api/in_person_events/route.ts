'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/db'; // Import the prisma client

export async function GET() {
  console.log('Fetching In Person Events entries...');
  try {
    const inPersonEvents = await prisma.in_Person_Events.findMany({
      orderBy: {
        id: 'asc',
      },
    });
    return NextResponse.json(inPersonEvents);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to fetch In Person Events entries.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { event, date, numPeopleSpokenTo, numLinkedInRequests } = await request.json();
    const newInPersonEvents = await prisma.in_Person_Events.create({
      data: {
        event,
        date,
        numPeopleSpokenTo,
        numLinkedInRequests,
      },
    });
    return NextResponse.json(newInPersonEvents);
  } catch (error) {
    console.error('Error adding new In Person Events entry:', error);
    return NextResponse.json({ error: 'Failed to add new In Person Events entry.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, numPeopleSpokenTo, numLinkedInRequests, ...data } = await request.json();

    // Ensure numPeopleSpokenTo and numLinkedInRequests are integers
    const updatedData = {
      ...data,
      numPeopleSpokenTo: parseInt(numPeopleSpokenTo, 10),
      numLinkedInRequests: parseInt(numLinkedInRequests, 10),
    };

    const updatedInPersonEvents = await prisma.in_Person_Events.update({
      where: { id },
      data: updatedData,
    });
    return NextResponse.json(updatedInPersonEvents);
  } catch (error) {
    console.error('Error updating In Person Events entry:', error);
    return NextResponse.json({ error: 'Failed to update In Person Events entry.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.in_Person_Events.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'In Person Events entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting In Person Events entry:', error);
    return NextResponse.json({ error: 'Failed to delete In Person Events entry.' }, { status: 500 });
  }
}
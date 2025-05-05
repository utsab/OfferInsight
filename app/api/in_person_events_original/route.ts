'use server';

import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/db'; // Import the prisma client

export async function GET() {
  console.log('Fetching In Person Events entries...');
  try {
    const session = await auth();
        if (!session?.user?.email) {
          return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }
      
    const inPersonEvents = await prisma.in_Person_Events.findMany({
      where: {
        user: {
          email: session.user.email
        }
      },
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
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { event, date, numPeopleSpokenTo, numLinkedInRequests } = await request.json();
    const newInPersonEvents = await prisma.in_Person_Events.create({
      data: {
        event,
        date,
        numPeopleSpokenTo,
        numLinkedInRequests,
        user: {
          connect: {
            email: session.user.email,
          },
        },
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
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id, numPeopleSpokenTo, numLinkedInRequests, ...data } = await request.json();

    const existing_in_Person_Events = await prisma.in_Person_Events.findFirst({
      where: {
        id,
        user: {
          email: session.user.email
        }
      }
    });

    if (!existing_in_Person_Events) {
      return NextResponse.json({ error: 'In Person Event not found or unauthorized' }, { status: 403 });
    }

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
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await request.json();

    const existing_in_Person_Events = await prisma.in_Person_Events.findFirst({
      where: {
        id,
        user: {
          email: session.user.email
        }
      }
    });

    if (!existing_in_Person_Events) {
      return NextResponse.json({ error: 'In Person Event not found or unauthorized' }, { status: 403 });
    }

    await prisma.in_Person_Events.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'In Person Events entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting In Person Events entry:', error);
    return NextResponse.json({ error: 'Failed to delete In Person Events entry.' }, { status: 500 });
  }
}
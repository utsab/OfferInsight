'use server';
import { auth } from '@/auth';



import { NextResponse } from 'next/server';
import { prisma } from '@/db'; // Import the prisma client

export async function GET() {
  console.log('Fetching applications...');
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const applications = await prisma.applications.findMany({
      where: {
        user: {
          email: session.user.email
        }
      },
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
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log("In POST:  user email", session.user.email); 

    const { company, firstRound, finalRound, offer } = await request.json();
    const newApplication = await prisma.applications.create({
      data: {
        company,
        firstRound,
        finalRound,
        offer,
        user: {
          connect: {
            email: session.user.email
          }
        }
      },
    });
    return NextResponse.json(newApplication);
  } catch (error) {
    console.log("Error adding new application:", error.stack)
    return NextResponse.json({ error: 'Failed to add new application.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id, ...data } = await request.json();

    // First check if the application belongs to the user
    const existingApplication = await prisma.applications.findFirst({
      where: {
        id,
        user: {
          email: session.user.email
        }
      }
    });

    if (!existingApplication) {
      return NextResponse.json({ error: 'Application not found or unauthorized' }, { status: 403 });
    }

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

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await request.json();

    // Check if the application belongs to the user
    const existingApplication = await prisma.applications.findFirst({
      where: {
        id,
        user: {
          email: session.user.email
        }
      }
    });

    if (!existingApplication) {
      return NextResponse.json({ error: 'Application not found or unauthorized' }, { status: 403 });
    }

    await prisma.applications.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    return NextResponse.json({ error: 'Failed to delete application.' }, { status: 500 });
  }
}
'use server';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/db'; // Import the prisma client

export async function GET() {
  console.log('Fetching applications with outreach...');
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const applicationsWithOutreach = await prisma.applications_with_Outreach.findMany({
      where: {
        user: {
          email: session.user.email
        }
      },
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
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

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
        user: {
          connect: {
            email: session.user.email,
          },
        },
      },
    });
    return NextResponse.json(newApplicationWithOutreach);
  } catch (error) {
    console.error('Error adding new application with outreach:', error);
    return NextResponse.json({ error: 'Failed to add new application with outreach.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id, ...data } = await request.json();

    const existingApplication_with_Outreach = await prisma.applications_with_Outreach.findFirst({
      where: {
        id,
        user: {
          email: session.user.email
        }
      }
    });

    if (!existingApplication_with_Outreach) {
      return NextResponse.json({ error: 'Application not found or unauthorized' }, { status: 403 });
    }

    const updatedApplicationWithOutreach = await prisma.applications_with_Outreach.update({
      where: { id },
      data,
    });
    return NextResponse.json(updatedApplicationWithOutreach);
  } catch (error) {
    console.error('Error updating application with outreach:', error);
    return NextResponse.json({ error: 'Failed to update application with outreach.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await request.json();

    const existingApplication_with_Outreach = await prisma.applications_with_Outreach.findFirst({
      where: {
        id,
        user: {
          email: session.user.email
        }
      }
    });

    if (!existingApplication_with_Outreach) {
      return NextResponse.json({ error: 'Application not found or unauthorized' }, { status: 403 });
    }
    
    await prisma.applications_with_Outreach.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Application with outreach deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    return NextResponse.json({ error: 'Failed to delete application with outreach.' }, { status: 500 });
  }
}
/**
 * Migration script to update application and LinkedIn outreach status values
 * 
 * This script updates existing status values from the old format to the new format:
 * 
 * Applications:
 * - 'applying' -> 'apply'
 * - 'messagingHiringManager' -> 'messageHiringManager'
 * - 'messagingRecruiter' -> 'messageRecruiter'
 * - 'followingUp' -> 'followUp'
 * - 'interviewing' -> 'interview'
 * 
 * LinkedIn Outreach (Coffee Chats):
 * - 'sendingOutreachRequest' -> 'prospects' (new starting column)
 * - 'sendOutreachRequest' -> 'sendFirstMessage' (renamed column)
 * - 'acceptingRequest' -> 'requestAccepted'
 * - 'followingUp' -> 'followUp'
 * - 'linkedinOutreach' -> 'coffeeChat'
 * - 'askingForReferral' -> 'askForReferral'
 * 
 * In Person Events:
 * - 'scheduling' -> 'plan'
 * - 'attending' -> 'attended'
 * - 'sendingLinkedInRequests' -> 'sendLinkedInRequest'
 * - 'followingUp' -> 'followUp'
 * 
 * LeetCode:
 * - 'planning' -> 'plan'
 * - 'solving' -> 'solved'
 * - 'reflecting' -> 'reflect'
 * 
 * Run with: npx tsx scripts/migrate-application-statuses.ts
 */

import { prisma } from '../db';

const applicationStatusMappings: Record<string, string> = {
  'applying': 'apply',
  'messagingHiringManager': 'messageHiringManager',
  'messagingRecruiter': 'messageRecruiter',
  'followingUp': 'followUp',
  'interviewing': 'interview',
};

const linkedinOutreachStatusMappings: Record<string, string> = {
  'sendingOutreachRequest': 'prospects', // Old status -> new starting column
  'sendOutreachRequest': 'sendFirstMessage', // Previous new status -> renamed
  'acceptingRequest': 'requestAccepted',
  'followingUp': 'followUp',
  'linkedinOutreach': 'coffeeChat',
  'askingForReferral': 'askForReferral',
};

const inPersonEventStatusMappings: Record<string, string> = {
  'scheduling': 'plan',
  'attending': 'attended',
  'sendingLinkedInRequests': 'sendLinkedInRequest',
  'followingUp': 'followUp',
};

const leetCodeStatusMappings: Record<string, string> = {
  'planning': 'plan',
  'solving': 'solved',
  'reflecting': 'reflect',
};

async function migrateApplicationStatuses() {
  console.log('Starting migration of application statuses...\n');

  try {
    // Get all applications
    const applications = await prisma.applications_With_Outreach.findMany({
      select: {
        id: true,
        status: true,
        company: true,
      },
    });

    console.log(`Found ${applications.length} applications to check.\n`);

    let updatedCount = 0;
    const updates: Array<{ id: number; oldStatus: string; newStatus: string; company: string }> = [];

    // Check each application and prepare updates
    for (const app of applications) {
      const oldStatus = app.status;
      const newStatus = applicationStatusMappings[oldStatus];

      if (newStatus && oldStatus !== newStatus) {
        updates.push({
          id: app.id,
          oldStatus,
          newStatus,
          company: app.company || 'Unknown',
        });
      }
    }

    console.log(`Found ${updates.length} applications that need status updates:\n`);
    updates.forEach(update => {
      console.log(`  - ID ${update.id} (${update.company}): "${update.oldStatus}" -> "${update.newStatus}"`);
    });

    if (updates.length > 0) {
      // Perform updates
      console.log('\nUpdating application statuses...\n');
      for (const update of updates) {
        await prisma.applications_With_Outreach.update({
          where: { id: update.id },
          data: { status: update.newStatus },
        });
        updatedCount++;
        console.log(`✓ Updated application ${update.id} (${update.company})`);
      }
      console.log(`\n✅ Application migration completed successfully!`);
      console.log(`   Updated ${updatedCount} application(s).\n`);
    } else {
      console.log('No application updates needed. All statuses are already up to date.\n');
    }
  } catch (error) {
    console.error('\n❌ Error during application migration:', error);
    throw error;
  }
}

async function migrateLinkedinOutreachStatuses() {
  console.log('Starting migration of LinkedIn outreach statuses...\n');

  try {
    // Get all LinkedIn outreach entries
    const linkedinOutreachEntries = await prisma.linkedin_Outreach.findMany({
      select: {
        id: true,
        status: true,
        name: true,
        company: true,
      },
    });

    console.log(`Found ${linkedinOutreachEntries.length} LinkedIn outreach entries to check.\n`);

    let updatedCount = 0;
    const updates: Array<{ id: number; oldStatus: string; newStatus: string; name: string; company: string }> = [];

    // Check each entry and prepare updates
    for (const entry of linkedinOutreachEntries) {
      const oldStatus = entry.status;
      const newStatus = linkedinOutreachStatusMappings[oldStatus];

      if (newStatus && oldStatus !== newStatus) {
        updates.push({
          id: entry.id,
          oldStatus,
          newStatus,
          name: entry.name || 'Unknown',
          company: entry.company || 'Unknown',
        });
      }
    }

    console.log(`Found ${updates.length} LinkedIn outreach entries that need status updates:\n`);
    updates.forEach(update => {
      console.log(`  - ID ${update.id} (${update.name} @ ${update.company}): "${update.oldStatus}" -> "${update.newStatus}"`);
    });

    if (updates.length > 0) {
      // Perform updates
      console.log('\nUpdating LinkedIn outreach statuses...\n');
      for (const update of updates) {
        await prisma.linkedin_Outreach.update({
          where: { id: update.id },
          data: { status: update.newStatus },
        });
        updatedCount++;
        console.log(`✓ Updated LinkedIn outreach ${update.id} (${update.name} @ ${update.company})`);
      }
      console.log(`\n✅ LinkedIn outreach migration completed successfully!`);
      console.log(`   Updated ${updatedCount} LinkedIn outreach entry/entries.\n`);
    } else {
      console.log('No LinkedIn outreach updates needed. All statuses are already up to date.\n');
    }
  } catch (error) {
    console.error('\n❌ Error during LinkedIn outreach migration:', error);
    throw error;
  }
}

async function migrateInPersonEventStatuses() {
  console.log('Starting migration of in-person event statuses...\n');

  try {
    // Get all in-person events
    const events = await prisma.in_Person_Events.findMany({
      select: {
        id: true,
        status: true,
        event: true,
      },
    });

    console.log(`Found ${events.length} in-person events to check.\n`);

    let updatedCount = 0;
    const updates: Array<{ id: number; oldStatus: string; newStatus: string; event: string }> = [];

    // Check each event and prepare updates
    for (const event of events) {
      const oldStatus = event.status;
      const newStatus = inPersonEventStatusMappings[oldStatus];

      if (newStatus && oldStatus !== newStatus) {
        updates.push({
          id: event.id,
          oldStatus,
          newStatus,
          event: event.event || 'Unknown',
        });
      }
    }

    console.log(`Found ${updates.length} in-person events that need status updates:\n`);
    updates.forEach(update => {
      console.log(`  - ID ${update.id} (${update.event}): "${update.oldStatus}" -> "${update.newStatus}"`);
    });

    if (updates.length > 0) {
      // Perform updates
      console.log('\nUpdating in-person event statuses...\n');
      for (const update of updates) {
        await prisma.in_Person_Events.update({
          where: { id: update.id },
          data: { status: update.newStatus },
        });
        updatedCount++;
        console.log(`✓ Updated in-person event ${update.id} (${update.event})`);
      }
      console.log(`\n✅ In-person event migration completed successfully!`);
      console.log(`   Updated ${updatedCount} in-person event(s).\n`);
    } else {
      console.log('No in-person event updates needed. All statuses are already up to date.\n');
    }
  } catch (error) {
    console.error('\n❌ Error during in-person event migration:', error);
    throw error;
  }
}

async function migrateLeetCodeStatuses() {
  console.log('Starting migration of LeetCode statuses...\n');

  try {
    // Get all LeetCode entries
    const leetCodeEntries = await prisma.leetcode_Practice.findMany({
      select: {
        id: true,
        status: true,
        problem: true,
      },
    });

    console.log(`Found ${leetCodeEntries.length} LeetCode entries to check.\n`);

    let updatedCount = 0;
    const updates: Array<{ id: number; oldStatus: string; newStatus: string; problem: string | null }> = [];

    // Check each entry and prepare updates
    for (const entry of leetCodeEntries) {
      const oldStatus = entry.status;
      const newStatus = leetCodeStatusMappings[oldStatus];

      if (newStatus && oldStatus !== newStatus) {
        updates.push({
          id: entry.id,
          oldStatus,
          newStatus,
          problem: entry.problem || 'Unknown',
        });
      }
    }

    console.log(`Found ${updates.length} LeetCode entries that need status updates:\n`);
    updates.forEach(update => {
      console.log(`  - ID ${update.id} (${update.problem}): "${update.oldStatus}" -> "${update.newStatus}"`);
    });

    if (updates.length > 0) {
      // Perform updates
      console.log('\nUpdating LeetCode statuses...\n');
      for (const update of updates) {
        await prisma.leetcode_Practice.update({
          where: { id: update.id },
          data: { status: update.newStatus },
        });
        updatedCount++;
        console.log(`✓ Updated LeetCode entry ${update.id} (${update.problem})`);
      }
      console.log(`\n✅ LeetCode migration completed successfully!`);
      console.log(`   Updated ${updatedCount} LeetCode entry/entries.\n`);
    } else {
      console.log('No LeetCode updates needed. All statuses are already up to date.\n');
    }
  } catch (error) {
    console.error('\n❌ Error during LeetCode migration:', error);
    throw error;
  }
}

async function migrateAllStatuses() {
  try {
    await migrateApplicationStatuses();
    await migrateLinkedinOutreachStatuses();
    await migrateInPersonEventStatuses();
    await migrateLeetCodeStatuses();
    console.log('✅ All migrations completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run all migrations
migrateAllStatuses()
  .then(() => {
    console.log('\nMigration script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nMigration failed:', error);
    process.exit(1);
  });

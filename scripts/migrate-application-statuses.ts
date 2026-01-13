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
 * - 'sendingOutreachRequest' -> 'sendOutreachRequest'
 * - 'acceptingRequest' -> 'requestAccepted'
 * - 'followingUp' -> 'followUp'
 * - 'linkedinOutreach' -> 'coffeeChat'
 * - 'askingForReferral' -> 'askForReferral'
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
  'sendingOutreachRequest': 'sendOutreachRequest',
  'acceptingRequest': 'requestAccepted',
  'followingUp': 'followUp',
  'linkedinOutreach': 'coffeeChat',
  'askingForReferral': 'askForReferral',
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

async function migrateAllStatuses() {
  try {
    await migrateApplicationStatuses();
    await migrateLinkedinOutreachStatuses();
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

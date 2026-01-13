/**
 * Migration script to update application status values
 * 
 * This script updates existing application status values from the old format to the new format:
 * - 'applying' -> 'apply'
 * - 'messagingHiringManager' -> 'messageHiringManager'
 * - 'messagingRecruiter' -> 'messageRecruiter'
 * - 'followingUp' -> 'followUp'
 * - 'interviewing' -> 'interview'
 * 
 * Run with: npx tsx scripts/migrate-application-statuses.ts
 */

import { prisma } from '../db';

const statusMappings: Record<string, string> = {
  'applying': 'apply',
  'messagingHiringManager': 'messageHiringManager',
  'messagingRecruiter': 'messageRecruiter',
  'followingUp': 'followUp',
  'interviewing': 'interview',
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
      const newStatus = statusMappings[oldStatus];

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

    if (updates.length === 0) {
      console.log('\nNo updates needed. All statuses are already up to date.');
      return;
    }

    // Perform updates
    console.log('\nUpdating statuses...\n');
    for (const update of updates) {
      await prisma.applications_With_Outreach.update({
        where: { id: update.id },
        data: { status: update.newStatus },
      });
      updatedCount++;
      console.log(`✓ Updated application ${update.id} (${update.company})`);
    }

    console.log(`\n✅ Migration completed successfully!`);
    console.log(`   Updated ${updatedCount} application(s).`);
  } catch (error) {
    console.error('\n❌ Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateApplicationStatuses()
  .then(() => {
    console.log('\nMigration script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nMigration failed:', error);
    process.exit(1);
  });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Load environment variables
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter }) as any;

// Import partnerships data
const partnershipsData = require('../partnerships/partnerships.json');

async function main() {
  console.log('Seeding partnerships...');

  for (const partnership of partnershipsData.partnerships) {
    await prisma.partnership.upsert({
      where: { id: partnership.id },
      update: {
        name: partnership.name,
        linkedIn: partnership.linkedIn,
        company: partnership.company,
        role: partnership.role,
        // Don't update activeUserCount or maxUsers on upsert
      },
      create: {
        id: partnership.id,
        name: partnership.name,
        linkedIn: partnership.linkedIn,
        company: partnership.company,
        role: partnership.role,
        activeUserCount: 0,
        maxUsers: 5,
        isActive: true,
      },
    });
    console.log(`Upserted partnership: ${partnership.name}`);
  }

  console.log('Seeding instructor...');

  await prisma.instructor.upsert({
    where: { username: 'instructor00' },
    update: {
      role: 'ADMIN',
    },
    create: {
      username: 'instructor00',
      password: '$2b$10$YLzaAHx27cnUWdtIikojoup/pGBOJhhUPWwKluIxnMeLsoIoyugny',
      role: 'ADMIN',
    },
  });

  await prisma.instructor.upsert({
    where: { username: 'instructor01' },
    update: {
      role: 'READ_ONLY',
      password: '$2b$10$0kKXIjhPz4NeH/s82vVSgeq8bIWdMplriDZXpLfykMf0hGUA14HoO',
    },
    create: {
      username: 'instructor01',
      password: '$2b$10$0kKXIjhPz4NeH/s82vVSgeq8bIWdMplriDZXpLfykMf0hGUA14HoO',
      role: 'READ_ONLY',
    },
  });

  console.log('Seeded instructor: instructor00');
  console.log('Seeded instructor: instructor01 (read-only)');
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
    await prisma.$disconnect();
  });

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
      // Don't update if instructor already exists
    },
    create: {
      username: 'instructor00',
      password: '$2b$10$YLzaAHx27cnUWdtIikojoup/pGBOJhhUPWwKluIxnMeLsoIoyugny',
    },
  });

  console.log('Seeded instructor: instructor00');
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

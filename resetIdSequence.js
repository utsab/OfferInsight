const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetIdSequence() {
  const startValue = 5; // Set the starting value for the sequence

  await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Applications_id_seq" RESTART WITH ${startValue}`)

  console.log(`ID sequence reset to start at ${startValue}`);
}

resetIdSequence()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
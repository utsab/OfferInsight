import bcrypt from 'bcrypt';
import { db } from '@vercel/postgres';
import { applications, users } from '../lib/placeholder-data';

const client = await db.connect();

async function seedUsers() {
  await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await client.sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      university TEXT,
      graduation_date DATE,
      job_type TEXT,
      linkedin TEXT,
      link_to_resume TEXT,
      user_type TEXT DEFAULT 'seeker' NOT NULL
    );
  `;
  console.log('About to insert...');
  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      // VALUES (${user.id}, ${user.first_name}, ${user.last_name}, ${user.email}, ${hashedPassword}, ${user.university}, ${user.graduation_date}, ${user.job_type}, ${user.linkedin}, ${user.link_to_resume}, ${user.user_type})
      return client.sql`
        INSERT INTO users (id, first_name, last_name, email, password, university, graduation_date, job_type, linkedin, link_to_resume, user_type)
        VALUES (${user.id}, ${user.first_name}, ${user.last_name}, ${user.email}, ${hashedPassword}, ${user.university}, ${user.graduation_date}, ${user.job_type}, ${user.linkedin}, ${user.link_to_resume}, ${user.user_type})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );
  console.log('Finished insert');
  return insertedUsers;
  // return [];
}

async function seedApplications() {
  await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await client.sql`
    CREATE TABLE IF NOT EXISTS applications (
      application_id SERIAL PRIMARY KEY,
      company VARCHAR(255) NOT NULL,
      first_round_or_coding_challenge BOOLEAN NOT NULL Default FALSE,
      final_round BOOLEAN NOT NULL Default FALSE,
      offer BOOLEAN NOT NULL Default FALSE
    );
  `;
  const insertedApplications = await Promise.all(
    applications.map(
      (application) => client.sql`
        INSERT INTO applications (company, first_round_or_coding_challenge, final_round, offer)
        VALUES (${application.company}, ${application.first_round_or_coding_challenge}, ${application.final_round}, ${application.offer});
      `,
    ),
  );
  return insertedApplications;
}

export async function GET() {
  console.log('Seeding database...');
  try {
    await client.sql`BEGIN`;
    await seedUsers();
    await seedApplications();
    await client.sql`COMMIT`;

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    await client.sql`ROLLBACK`;
    return Response.json({ error }, { status: 500 });
  }
}

// This file contains placeholder data that you'll be replacing with real data in the Data Fetching chapter:
// https://nextjs.org/learn/dashboard-app/fetching-data
const users = [
  {
    id: '410544b2-4001-4271-9855-fec4b6a6442a',
    first_name: 'John',
    last_name: 'Smith',
    email: 'user1@nextmail.com',
    password: '123456',
    university: 'University of California',
    graduation_date: '2022-06-01',
    job_type: 'Full-time',
    linkedin: 'https://www.linkedin.com/in/john-smith',
    link_to_resume: 'https://www.resumelink.com/john-smith',
    user_type: 'seeker',
  },
  {
    id: '410544b2-4001-4271-9855-fec4b6a6442b',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'user2@nextmail.com',
    password: '123456',
    university: 'University of California',
    graduation_date: '2022-06-01',
    job_type: 'Full-time',
    linkedin: 'https://www.linkedin.com/in/jane-smith',
    link_to_resume: 'https://www.resumelink.com/jane-smith',
    user_type: 'seeker',
  },
];

const applications = [
  {
    company: 'Acme Inc.',
    first_round_or_coding_challenge: true,
    final_round: false,
    offer: false,
  },
  {
    company: 'Anon Inc.',
    first_round_or_coding_challenge: false,
    final_round: true,
    offer: false,
  },
];

export { users, applications };

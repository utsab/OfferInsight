"use client"

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '../../server';
import { on } from 'events';

export default function Page1() {
  const [school, setSchool] = useState('');
  const [major, setMajor] = useState('');
  const [graduationMonth, setGraduationMonth] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function authenticate() {
      await checkAuth();
      setLoading(false);
    }
    authenticate();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/users/onboarding1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        school,
        major,
        expectedGraduationDate: `${graduationYear}-${graduationMonth}-01`,
      }),
    });

    if (response.ok) {
      // Handle successful submission
      console.log('User information updated successfully');
      router.push('/onboarding/page2'); // Redirect to Page 2
    } else {
      // Handle error
      console.error('Failed to update user information');
    }
  };

  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 41 }, (_, i) => currentYear - 20 + i);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h1>Onboarding Page 1</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="school">School</label>
          <input
            type="text"
            id="school"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="major">Major</label>
          <input
            type="text"
            id="major"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="graduationMonth">Expected Month of Graduation</label>
          <select
            id="graduationMonth"
            value={graduationMonth}
            onChange={(e) => setGraduationMonth(e.target.value)}
            required
          >
            <option value="" disabled>Select Month</option>
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="graduationYear">Expected Year of Graduation</label>
          <select
            id="graduationYear"
            value={graduationYear}
            onChange={(e) => setGraduationYear(e.target.value)}
            required
          >
            <option value="" disabled>Select Year</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <button type="submit">Submit</button>
      </form>
      <Link href="/onboarding/page2">
        Go to Page 2
      </Link>
    </div>
  );
}
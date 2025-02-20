"use client"

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '../../server';

export default function Page2() {
  const [monthsToSecureInternship, setMonthsToSecureInternship] = useState('');
  const [wantToImprove1, setWantToImprove1] = useState('');
  const [wantToImprove2, setWantToImprove2] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState('');
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
    const response = await fetch('/api/users/onboarding2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        monthsToSecureInternship,
        wantToImprove1,
        wantToImprove2,
        confidenceLevel,
      }),
    });

    if (response.ok) {
      // Handle successful submission
      console.log('User information updated successfully');
      router.push('/onboarding/page3'); // Redirect to Page 3
    } else {
      // Handle error
      console.error('Failed to update user information');
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h1>Onboarding Page 2</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Months to Secure Internship</label>
          <div>
            {['1-3', '4-6', '7-9', '10-12', '12+'].map((option, index) => (
              <span key={option}>
                <button
                  type="button"
                  onClick={() => setMonthsToSecureInternship(option)}
                  className={`p-2 ${monthsToSecureInternship === option ? 'bg-blue-100' : ''}`}
                >
                  {option}
                </button>
                {index < 4 && ' | '}
              </span>
            ))}
          </div>
        </div>
        <div>
          <label>Want to Improve 1</label>
          <div>
            {['Interview Prep', 'Technical Skills', 'LinkedIn'].map((option, index) => (
              <span key={option}>
                <button
                  type="button"
                  onClick={() => setWantToImprove1(option)}
                  className={`p-2 ${wantToImprove1 === option ? 'bg-blue-100' : ''}`}
                >
                  {option}
                </button>
                {index < 2 && ' | '}
              </span>
            ))}
          </div>
        </div>
        <div>
          <label>Want to Improve 2</label>
          <div>
            {['Resume', 'Technical', 'LinkedIn', 'Networking'].map((option, index) => (
              <span key={option}>
                <button
                  type="button"
                  onClick={() => setWantToImprove2(option)}
                  className={`p-2 ${wantToImprove2 === option ? 'bg-blue-100' : ''}`}
                >
                  {option}
                </button>
                {index < 3 && ' | '}
              </span>
            ))}
          </div>
        </div>
        <div>
          <label>Confidence Level</label>
          <div>
            {['Confident', 'Just ok', 'A little worried'].map((option, index) => (
              <span key={option}>
                <button
                  type="button"
                  onClick={() => setConfidenceLevel(option)}
                  className={`p-2 ${confidenceLevel === option ? 'bg-blue-100' : ''}`}
                >
                  {option}
                </button>
                {index < 2 && ' | '}
              </span>
            ))}
          </div>
        </div>
        <button type="submit">Submit</button>
      </form>
      <Link href="/onboarding/page3">
        Go to Page 3
      </Link>
      <Link href="/onboarding/page1">
        Back to Page 1
      </Link>
    </div>
  );
}
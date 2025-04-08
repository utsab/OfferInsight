"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '../../server';
import '../shared-onboarding.css';
import './page.css';

export default function Page3() {
  const [commitment, setCommitment] = useState('');
  const [applicationsPerWeek, setApplicationsPerWeek] = useState('');
  const [appsWithOutreachPerWeek, setAppsWithOutreachPerWeek] = useState('');
  const [infoInterviewOutreachPerWeek, setInfoInterviewOutreachPerWeek] = useState('');
  const [inPersonEventsPerWeek, setInPersonEventsPerWeek] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function authenticate() {
      const session = await checkAuth();
      if (session?.user?.email) {
        // Fetch user data from the database
        const response = await fetch('/api/users/onboarding2');
        if (response.ok) {
          const userData = await response.json();
          if (userData.commitment) setCommitment(userData.commitment);
          if (userData.applications_per_week) setApplicationsPerWeek(userData.applications_per_week);
          if (userData.apps_with_outreach_per_week) setAppsWithOutreachPerWeek(userData.apps_with_outreach_per_week);
          if (userData.info_interview_outreach_per_week) setInfoInterviewOutreachPerWeek(userData.info_interview_outreach_per_week);
          if (userData.in_person_events_per_week) setInPersonEventsPerWeek(userData.in_person_events_per_week);
        }
      }
      setLoading(false);
    }
    authenticate();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const response = await fetch('/api/users/onboarding3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        commitment,
        applications_per_week: applicationsPerWeek,
        apps_with_outreach_per_week: appsWithOutreachPerWeek,
        info_interview_outreach_per_week: infoInterviewOutreachPerWeek,
        in_person_events_per_week: inPersonEventsPerWeek
      }),
    });

    if (response.ok) {
      // Handle successful submission
      console.log('User plan updated successfully');
      router.push('/onboarding/page4'); // Redirect to Page 4
    } else {
      // Handle error
      console.error('Failed to update user plan');
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="onboarding-page3">
      <div className="onboarding-container">
        <div className="onboarding-content-wrapper">
          <div className="onboarding-main-content">
            <div className="onboarding-header">
              <h1 className="welcome-text">Let's review your plan!</h1>
              <p className="subtitle">Finalize your goals below.</p>
            </div>
            
            <form className="onboarding-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">How much time are you willing to commit per week?</label>
                <div className="options-container">
                  {['6+ Hours', '9+ Hours', '12+ Hours', '25+ Hours'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setCommitment(option)}
                      className={`btn-option ${commitment === option ? 'btn-option-selected' : ''}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">How many applications you'll submit?</label>
                <div className="options-container">
                  {['1 Weekly', '2 Weekly', '4 Weekly'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setApplicationsPerWeek(option)}
                      className={`btn-option ${applicationsPerWeek === option ? 'btn-option-selected' : ''}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">How many applications with outreach you'll submit?</label>
                <div className="options-container">
                  {['1 Weekly', '2 Weekly'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setAppsWithOutreachPerWeek(option)}
                      className={`btn-option ${appsWithOutreachPerWeek === option ? 'btn-option-selected' : ''}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Informational Interviews per week?</label>
                <div className="options-container">
                  {['6 Weekly', '9 Weekly', '13 Weekly', '26 Weekly'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setInfoInterviewOutreachPerWeek(option)}
                      className={`btn-option ${infoInterviewOutreachPerWeek === option ? 'btn-option-selected' : ''}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">How many in-person events you'll attend?</label>
                <div className="options-container">
                  {['1 Weekly', '2 Weekly'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setInPersonEventsPerWeek(option)}
                      className={`btn-option ${inPersonEventsPerWeek === option ? 'btn-option-selected' : ''}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Metrics and Estimated Date Section */}
              <div className="metrics-date-section">
                <div className="metrics-container">
                  <div className="metric-box">
                    <h4>Interviews</h4>
                    <div className="metric-value">{5}</div>
                  </div>
                  <div className="metric-box">
                    <h4>Job Offers</h4>
                    <div className="metric-value">{1}</div>
                  </div>
                </div>
                <div className="estimated-date-container">
                  <h4 className="estimated-date-label">Estimated Internship Offer Date:</h4>
                  <p className="estimated-date-value">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              <button type="submit" className="btn-primary">Finalize Goals</button>
            </form>
          </div>
        </div>

        <div className="progress-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot active"></div>
          <div className="dot"></div>
        </div>
      </div>
    </div>
  );
}
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '../../server';
import '../shared-onboarding.css';
import './page.css';

// Helper functions for data conversion
function parseCommitmentToInt(commitment: string): number {
  switch (commitment) {
    case '6 - 8': return 7;
    case '9 - 11': return 10;
    case '12 - 19': return 15;
    case '20 - 25': return 22;
    default: return 0;
  }
}

function parseRangeToInt(range: string): number {
  const parts = range.split(' - ');
  if (parts.length === 2) {
    const min = parseInt(parts[0], 10);
    const max = parseInt(parts[1], 10);
    return Math.round((min + max) / 2);
  }
  return 0;
}

function parseEventsToInt(events: string): number {
  switch (events) {
    case '0': return 0;
    case '1': return 1; // 1/4 per week
    case '2': return 2;
    case '4': return 4;
    case '8': return 8;
    default: return 0;
  }
}

function intToCommitmentString(value: number): string {
  if (value <= 8) return '6 - 8';
  if (value <= 11) return '9 - 11';
  if (value <= 19) return '12 - 19';
  return '20 - 25';
}

function intToRangeString(value: number, type: string): string {
  if (type === 'applications' || type === 'outreach') {
    if (value <= 2) return '1 - 2';
    if (value <= 5) return '3 - 5';
    if (value <= 10) return '6 - 10';
    return '11 - 20';
  } else if (type === 'info') {
    if (value <= 5) return '1 - 5';
    if (value <= 10) return '6 - 10';
    if (value <= 20) return '11 - 20';
    return '20 - 30';
  }
  return '';
}

function intToEventsString(value: number): string {
  return value.toString();
}

// Data layer hook
function usePage3Data() {
  const [commitment, setCommitment] = useState('');
  const [applicationsPerWeek, setApplicationsPerWeek] = useState('');
  const [appsWithOutreachPerWeek, setAppsWithOutreachPerWeek] = useState('');
  const [infoInterviewOutreachPerWeek, setInfoInterviewOutreachPerWeek] = useState('');
  const [inPersonEventsPerMonth, setInPersonEventsPerMonth] = useState('');
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
          // Convert integer values from DB to string representations for UI
          if (userData.commitment !== null && userData.commitment !== undefined) {
            setCommitment(intToCommitmentString(userData.commitment));
          }
          if (userData.applications_per_week !== null && userData.applications_per_week !== undefined) {
            setApplicationsPerWeek(intToRangeString(userData.applications_per_week, 'applications'));
          }
          if (userData.apps_with_outreach_per_week !== null && userData.apps_with_outreach_per_week !== undefined) {
            setAppsWithOutreachPerWeek(intToRangeString(userData.apps_with_outreach_per_week, 'outreach'));
          }
          if (userData.info_interview_outreach_per_week !== null && userData.info_interview_outreach_per_week !== undefined) {
            setInfoInterviewOutreachPerWeek(intToRangeString(userData.info_interview_outreach_per_week, 'info'));
          }
          if (userData.in_person_events_per_month !== null && userData.in_person_events_per_month !== undefined) {
            setInPersonEventsPerMonth(intToEventsString(userData.in_person_events_per_month));
          }
        }
      }
      setLoading(false);
    }
    authenticate();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert string values to integers for the API call
    const commitmentValue = parseCommitmentToInt(commitment);
    const applicationsValue = parseRangeToInt(applicationsPerWeek);
    const outreachValue = parseRangeToInt(appsWithOutreachPerWeek);
    const infoInterviewValue = parseRangeToInt(infoInterviewOutreachPerWeek);
    const inPersonValue = parseEventsToInt(inPersonEventsPerMonth);
    
    const response = await fetch('/api/users/onboarding3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        commitment: commitmentValue,
        applications_per_week: applicationsValue,
        apps_with_outreach_per_week: outreachValue,
        info_interview_outreach_per_week: infoInterviewValue,
        in_person_events_per_month: inPersonValue
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

  return {
    commitment,
    setCommitment,
    applicationsPerWeek,
    setApplicationsPerWeek,
    appsWithOutreachPerWeek,
    setAppsWithOutreachPerWeek,
    infoInterviewOutreachPerWeek,
    setInfoInterviewOutreachPerWeek,
    inPersonEventsPerMonth,
    setInPersonEventsPerMonth,
    loading,
    handleSubmit
  };
}

// Main component
export default function Page3() {
  const {
    commitment,
    setCommitment,
    applicationsPerWeek,
    setApplicationsPerWeek,
    appsWithOutreachPerWeek,
    setAppsWithOutreachPerWeek,
    infoInterviewOutreachPerWeek,
    setInfoInterviewOutreachPerWeek,
    inPersonEventsPerMonth,
    setInPersonEventsPerMonth,
    loading,
    handleSubmit
  } = usePage3Data();

  if (loading) {
    return <p>Loading...</p>;
  }

  console.log("Recalculating estimated date...: ", "applicationsPerWeek: ", applicationsPerWeek, "appsWithOutreachPerWeek: ", appsWithOutreachPerWeek, "infoInterviewOutreachPerWeek: ", infoInterviewOutreachPerWeek, "inPersonEventsPerMonth: ", inPersonEventsPerMonth)

  // Presentation layer
  return (
    <div className="onboarding-page3">
      <div className="onboarding-container">
        <div className="onboarding-content-wrapper">
          <div className="onboarding-main-content">
            <div className="onboarding-header">
              <h1 className="welcome-text">Let's fine-tune your plan!</h1>
            </div>
            
            <form className="onboarding-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">How many hours are you willing to commit per week?</label>
                <div className="options-container">
                  {['6 - 8', '9 - 11', '12 - 19', '20 - 25'].map((option) => (
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
                <label className="form-label">How many applications you'll submit per week?</label>
                <div className="options-container">
                  {['1 - 2', '3 - 5', '6 - 10', '11 - 20'].map((option) => (
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
                <label className="form-label">How many applications will you follow up with additional outreach? <br /><i>Reach out to <u>one</u> recruiter and <u>one</u> hiring manager per application</i></label>
                <div className="options-container">
                  {['1 - 2', '3 - 5', '6 - 10', '11 - 20'].map((option) => (
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
                <label className="form-label">How many people will you reach out to for <br/> Informational Interviews per week?</label>
                <div className="options-container">
                  {['1 - 5', '6 - 10', '11 - 20', '20 - 30'].map((option) => (
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
                <label className="form-label">How many in-person events you'll attend <b>per month</b>?</label>
                <div className="options-container">
                  {['0', '1', '2', '4', '8'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setInPersonEventsPerMonth(option)}
                      className={`btn-option ${inPersonEventsPerMonth === option ? 'btn-option-selected' : ''}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="estimated-date-container">
                  <h4 className="estimated-date-label">Estimated Internship Offer Date:</h4>
                  <p className="estimated-date-value">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
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
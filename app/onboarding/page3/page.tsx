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
    case '1': return 1;
    case '2': return 2;
    case '4': return 4;
    case '8': return 8;
    default: return 0;
  }
}

function parseCareerFairsToInt(careerFairs: string): number {
  switch (careerFairs) {
    case '0': return 0;
    case '1': return 1;
    case '2': return 2;
    case '3': return 3;
    case '4': return 4;
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

function intToCareerFairsString(value: number): string {
  return value.toString();
}

// Data layer hook
function usePage3Data() {
  const [commitment, setCommitment] = useState('');
  const [appsWithOutreachPerWeek, setAppsWithOutreachPerWeek] = useState('');
  const [infoInterviewOutreachPerWeek, setInfoInterviewOutreachPerWeek] = useState('');
  const [inPersonEventsPerMonth, setInPersonEventsPerMonth] = useState('');
  const [careerFairsPerYear, setCareerFairsPerYear] = useState('');
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
          if (userData.apps_with_outreach_per_week !== null && userData.apps_with_outreach_per_week !== undefined) {
            setAppsWithOutreachPerWeek(intToRangeString(userData.apps_with_outreach_per_week, 'outreach'));
          }
          if (userData.info_interview_outreach_per_week !== null && userData.info_interview_outreach_per_week !== undefined) {
            setInfoInterviewOutreachPerWeek(intToRangeString(userData.info_interview_outreach_per_week, 'info'));
          }
          if (userData.in_person_events_per_month !== null && userData.in_person_events_per_month !== undefined) {
            setInPersonEventsPerMonth(intToEventsString(userData.in_person_events_per_month));
          }
          if (userData.career_fairs_quota !== null && userData.career_fairs_quota !== undefined) {
            setCareerFairsPerYear(intToCareerFairsString(userData.career_fairs_quota));
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
    const outreachValue = parseRangeToInt(appsWithOutreachPerWeek);
    const infoInterviewValue = parseRangeToInt(infoInterviewOutreachPerWeek);
    const inPersonValue = parseEventsToInt(inPersonEventsPerMonth);
    const careerFairsValue = parseCareerFairsToInt(careerFairsPerYear);
    
    const response = await fetch('/api/users/onboarding3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        commitment: commitmentValue,
        apps_with_outreach_per_week: outreachValue,
        info_interview_outreach_per_week: infoInterviewValue,
        in_person_events_per_month: inPersonValue,
        career_fairs_quota: careerFairsValue
      }),
    });

    if (response.ok) {
      // Handle successful submission
      console.log('User plan updated successfully');
      router.push('/dashboard'); // Redirect to Dashboard
    } else {
      // Handle error
      console.error('Failed to update user plan');
    }
  };

  return {
    commitment,
    setCommitment,
    appsWithOutreachPerWeek,
    setAppsWithOutreachPerWeek,
    infoInterviewOutreachPerWeek,
    setInfoInterviewOutreachPerWeek,
    inPersonEventsPerMonth,
    setInPersonEventsPerMonth,
    careerFairsPerYear,
    setCareerFairsPerYear,
    loading,
    handleSubmit
  };
}


function calculateEstimatedOfferDate(appsWithOutreachPerWeek: number, infoInterviewOutreachPerWeek: number, inPersonEventsPerMonth: number) {
  
  
  console.log("appsWithOutreachPerWeek: ", appsWithOutreachPerWeek, "infoInterviewOutreachPerWeek: ", infoInterviewOutreachPerWeek, "inPersonEventsPerMonth: ", inPersonEventsPerMonth)
  
  // Hardcode the ROI percentages for each habit 

  let offersPerAppWithOutreach = 0.0025;
  let offersPerInfoInterviewAttempt = 0.00075;
  let offersPerInPersonEvent = 0.0075;

  let bonusPoints = 0;

  if (infoInterviewOutreachPerWeek === 1) {
    bonusPoints += 1;
  } else if (infoInterviewOutreachPerWeek === 6) {
    bonusPoints += 6;
  } else if (infoInterviewOutreachPerWeek === 11) {
    bonusPoints += 11;
  } else if (infoInterviewOutreachPerWeek === 20) {
    bonusPoints += 20;
  }
  

  if (inPersonEventsPerMonth === 1) {
    bonusPoints += 10; 
  } else if (inPersonEventsPerMonth === 2) {
    bonusPoints += 20; 
  } else if (inPersonEventsPerMonth === 4) {
    bonusPoints += 40; 
  } else if (inPersonEventsPerMonth === 8) {
    bonusPoints += 80; 
  }

  const a = 2.0;
  const b = 0.01;
  const x = bonusPoints; // Using bonusPoints as the x value
  let multiplier = 3 - a * Math.exp(-b * x);

  console.log("************************************************")
  console.log("bonusPoints: ", bonusPoints, "multiplier: ", multiplier)
  console.log("************************************************")

  offersPerAppWithOutreach *= multiplier;
  offersPerInfoInterviewAttempt *= multiplier;
  offersPerInPersonEvent *= multiplier;



  // Calculate the total number of job offers per week 

  const totalOffersPerWeek = (appsWithOutreachPerWeek * offersPerAppWithOutreach) + (infoInterviewOutreachPerWeek * offersPerInfoInterviewAttempt) + (inPersonEventsPerMonth * offersPerInPersonEvent);

  // Calculate the total number of weeks

  const totalWeeks = 3 + (1 / totalOffersPerWeek);


  // Calculate the estimated offer date 
  // Use a fixed reference date to avoid hydration mismatches
  const referenceDate = new Date('2024-01-01T00:00:00.000Z');
  const estimatedOfferDate = new Date(referenceDate.getTime() + totalWeeks * 7 * 24 * 60 * 60 * 1000);

  // Return the estimated offer date 

  return estimatedOfferDate;

}


// Main component
export default function Page3() {
  const {
    commitment,
    setCommitment,
    appsWithOutreachPerWeek,
    setAppsWithOutreachPerWeek,
    infoInterviewOutreachPerWeek,
    setInfoInterviewOutreachPerWeek,
    inPersonEventsPerMonth,
    setInPersonEventsPerMonth,
    careerFairsPerYear,
    setCareerFairsPerYear,
    loading,
    handleSubmit
  } = usePage3Data();

  if (loading) {
    return <p>Loading...</p>;
  }

  //console.log("Recalculating estimated date...: ", "applicationsPerWeek: ", applicationsPerWeek, "appsWithOutreachPerWeek: ", appsWithOutreachPerWeek, "infoInterviewOutreachPerWeek: ", infoInterviewOutreachPerWeek, "inPersonEventsPerMonth: ", inPersonEventsPerMonth)

  const estimatedOfferDate = calculateEstimatedOfferDate(
    parseInt(appsWithOutreachPerWeek), 
    parseInt(infoInterviewOutreachPerWeek), 
    parseInt(inPersonEventsPerMonth)
  );
  
  
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
                <label className="form-label">How many applications you'll submit per week? <br /><i>Each application should include outreach to <u>one</u> recruiter and <u>one</u> hiring manager</i></label>
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
                <label className="form-label">How many networking events you'll attend <b>per month</b>? <br/><i>This includes meetups, company events, workshops, etc.</i></label>
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
              
              <div className="form-group">
                <label className="form-label">How many career fairs you'll attend <b>per year</b>?</label>
                <div className="options-container">
                  {['0', '1', '2', '3', '4'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setCareerFairsPerYear(option)}
                      className={`btn-option ${careerFairsPerYear === option ? 'btn-option-selected' : ''}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="estimated-date-container">
                  <h4 className="estimated-date-label">Estimated Internship Offer Date:</h4>
                  <p className="estimated-date-value">{estimatedOfferDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            

              <button type="submit" className="btn-primary">Finalize Goals</button>
            </form>
          </div>
        </div>

        <div className="progress-dots">
          <div className="dot completed"></div>
          <div className="dot completed"></div>
          <div className="dot active"></div>
        </div>
      </div>
    </div>
  );
}
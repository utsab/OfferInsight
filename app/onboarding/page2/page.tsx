"use client"

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '../../server';
import '../shared-onboarding.css';
import './page.css';

export default function Page2() {
  const [monthsToSecureInternship, setMonthsToSecureInternship] = useState('');
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
          if (userData.monthsToSecureInternship) {
            setMonthsToSecureInternship(userData.monthsToSecureInternship);
          }
        }
      }
      setLoading(false);
    }
    authenticate();
  }, []);

  // Function to handle option selection
  const handleOptionSelect = (option: string) => {
    setMonthsToSecureInternship(option);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/users/onboarding2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        monthsToSecureInternship
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


  /* 
  * This plan was based on the calculations in this spreadsheet: https://docs.google.com/spreadsheets/d/1ti_ZVpi6VEqdAKkfRyWQNerpxSswTjvQF53w4JUahws/edit?gid=1637986855#gid=1637986855
  */
  const generatePlan = () => {
    const plan = {
      timeline: monthsToSecureInternship,
      commitment: '?',
      applications: '?',
      apps_with_outreach: '?',
      info_interview_outreach: '?',
      in_person_events: '?',
    };


    if (monthsToSecureInternship === '1-3') {
      plan.commitment = '25+ Hours';
      plan.applications = '4 Weekly';
      plan.apps_with_outreach = '2 Weekly';
      plan.info_interview_outreach = '26 Weekly';
      plan.in_person_events = '2 Weekly';
    } else if (monthsToSecureInternship === '4-6') {
      plan.commitment = '12+ Hours';
      plan.applications = '2 Weekly';
      plan.apps_with_outreach = '1 Weekly';
      plan.info_interview_outreach = '13 Weekly';
      plan.in_person_events = '1 Weekly';
    } else if (monthsToSecureInternship === '7-9') {
      plan.commitment = '9+ Hours';
      plan.applications = '1 Weekly';
      plan.apps_with_outreach = '1 Weekly';
      plan.info_interview_outreach = '9 Weekly';
      plan.in_person_events = '1 Weekly';
    } else if (monthsToSecureInternship === '10-12') {
      plan.commitment = '6+ Hours';
      plan.applications = '1 Weekly';
      plan.apps_with_outreach = '1 Weekly';
      plan.info_interview_outreach = '6 Weekly';
      plan.in_person_events = '1 Weekly';
    } 

    return plan;
  }


  if (loading) {
    return <p>Loading...</p>;
  }


  const plan = generatePlan();



  return (
    <div className="onboarding-page2">
    <div className="onboarding-container">
      <div className="onboarding-content-wrapper">
        <div className="onboarding-main-content">
          <div className="onboarding-header">
            <h1 className="welcome-text">Cool, now let's set goals</h1>
          </div>
          <form className="onboarding-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">How many months do you have to secure an internship?</label>
              <div className="options-container">
                {['1-3', '4-6', '7-9', '10-12'].map((option, index) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleOptionSelect(option)}
                    className={`btn-option ${monthsToSecureInternship === option ? 'btn-option-selected' : ''}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
           
            <button type="submit" className="btn-primary">Continue</button>
          </form>
        </div>
        
        <div className={`action-plan-sidebar ${monthsToSecureInternship ? 'sidebar-active' : 'sidebar-inactive'}`}>
          <div className="sidebar-logo">
            <img src="/images/logo-only.png" alt="OpenResumeBook" />
            <span>OpenResumeBook</span>
          </div>
          
          <h2 className="calculator-heading">Success Calculator</h2>
          
          <div className="sidebar-section">
            <h3>Timeline</h3>
            <div className="sidebar-item">
              <span>Secure internship within</span>
              <span className="value-pill">
                {(monthsToSecureInternship || '?') + ' Months'}
              </span>
            </div>
          </div>
          
          <div className="sidebar-section">
            <h3>Commitment</h3>
            <div className="sidebar-item">
              <span>Weekly Commitment</span>
              <span className="value"> {plan.commitment} </span>
            </div>
          </div>
          
          <div className="sidebar-section">
            <h3>Actions</h3>
            <div className="sidebar-item">
              <span>Applications</span>
              <span className="value"> {plan.applications} </span>
            </div>
            <div className="sidebar-item">
              <span>Applications with Outreach</span>
              <span className="value"> {plan.apps_with_outreach} </span>
            </div>
            <div className="sidebar-item">
              <span>Informational Interview Outreach</span>
              <span className="value"> {plan.info_interview_outreach} </span>
            </div>
            <div className="sidebar-item">
              <span>In-person Events</span>
              <span className="value"> {plan.in_person_events} </span>
            </div>
          </div>
          
          <div className="metrics-container">
            <div className="metric-box">
              <h4>Interviews</h4>
              <div className="metric-value">{monthsToSecureInternship ? 15 : '?'}</div>
            </div>
            <div className="metric-box">
              <h4>Job Offers</h4>
              <div className="metric-value">{monthsToSecureInternship ? 1 : '?'}</div>
            </div>
          </div>
          
          
        </div>
      </div>

      <div className="progress-dots">
        <div className="dot"></div>
        <div className="dot active"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>
    </div>
    </div>
  );
}
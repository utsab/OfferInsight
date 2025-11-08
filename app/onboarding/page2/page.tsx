"use client"

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '../../server';
import '../shared-onboarding.css';
import './page.css';
import { auth } from 'auth';
import { redirect } from 'next/navigation';

export default function Page2() {
  const [monthsToSecureInternship, setMonthsToSecureInternship] = useState<number | null>(null);
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
    // Convert display value to numeric data value
    let numericMonths: number;
    switch (option) {
      case '1-3': numericMonths = 3; break;
      case '4-6': numericMonths = 6; break;
      case '7-9': numericMonths = 9; break;
      case '10-12': numericMonths = 12; break;
      default: numericMonths = 0;
    }
    setMonthsToSecureInternship(numericMonths);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate the plan based on the selected months
    const plan = generatePlan();
    
    const response = await fetch('/api/users/onboarding2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        monthsToSecureInternship,
        commitment: plan.commitment,
        appsWithOutreachPerWeek: plan.appsWithOutreachPerWeek,
        linkedinOutreachPerWeek: plan.linkedinOutreachPerWeek,
        inPersonEventsPerMonth: plan.inPersonEventsPerMonth,
        careerFairsPerYear: plan.careerFairsPerYear
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
      timeline_display: getTimelineDisplay(monthsToSecureInternship),
      commitment: 0,
      commitment_display: '?',
      appsWithOutreachPerWeek: 0,
      appsWithOutreachPerWeekDisplay: '?',
      linkedinOutreachPerWeek: 0,
      linkedinOutreachPerWeekDisplay: '?',
      inPersonEventsPerMonth: 0,
      inPersonEventsPerMonthDisplay: '?',
      careerFairsPerYear: 0,
      careerFairsPerYearDisplay: '?',
    };

    if (monthsToSecureInternship === 3) {
      plan.commitment = 23;
      plan.commitment_display = '23 Hours';
      plan.appsWithOutreachPerWeek = 3;
      plan.appsWithOutreachPerWeekDisplay = '3 Weekly';
      plan.linkedinOutreachPerWeek = 21;
      plan.linkedinOutreachPerWeekDisplay = '21 Monthly';
      plan.inPersonEventsPerMonth = 8;
      plan.inPersonEventsPerMonthDisplay = '8 Monthly';
      plan.careerFairsPerYear = 3;
      plan.careerFairsPerYearDisplay = '3 Yearly';
    } else if (monthsToSecureInternship === 6) {
      plan.commitment = 11;
      plan.commitment_display = '11 Hours';
      plan.appsWithOutreachPerWeek = 2;
      plan.appsWithOutreachPerWeekDisplay = '2 Weekly';
      plan.linkedinOutreachPerWeek = 10;
      plan.linkedinOutreachPerWeekDisplay = '10 Monthly';
      plan.inPersonEventsPerMonth = 4;
      plan.inPersonEventsPerMonthDisplay = '4 Monthly';
      plan.careerFairsPerYear = 2;
      plan.careerFairsPerYearDisplay = '2 Yearly';
    } else if (monthsToSecureInternship === 9) {
      plan.commitment = 8;
      plan.commitment_display = '8 Hours';
      plan.appsWithOutreachPerWeek = 1;
      plan.appsWithOutreachPerWeekDisplay = '1 Weekly';
      plan.linkedinOutreachPerWeek = 7;
      plan.linkedinOutreachPerWeekDisplay = '7 Monthly';
      plan.inPersonEventsPerMonth = 2;
      plan.inPersonEventsPerMonthDisplay = '2 Monthly';
      plan.careerFairsPerYear = 1;
      plan.careerFairsPerYearDisplay = '1 Yearly';
    } else if (monthsToSecureInternship === 12) {
      plan.commitment = 6;
      plan.commitment_display = '6 Hours';
      plan.appsWithOutreachPerWeek = 1;
      plan.appsWithOutreachPerWeekDisplay = '1 Weekly';
      plan.linkedinOutreachPerWeek = 5;
      plan.linkedinOutreachPerWeekDisplay = '5 Monthly';
      plan.inPersonEventsPerMonth = 2;
      plan.inPersonEventsPerMonthDisplay = '2 Monthly';
      plan.careerFairsPerYear = 1;
      plan.careerFairsPerYearDisplay = '1 Yearly';
    } 

    return plan;
  }

  // Helper function to convert numeric value to display string
  const getTimelineDisplay = (months: number | null): string => {
    switch (months) {
      case 3: return '1-3';
      case 6: return '4-6';
      case 9: return '7-9';
      case 12: return '10-12';
      default: return '?';
    }
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
                    className={`btn-option ${getTimelineDisplay(monthsToSecureInternship) === option ? 'btn-option-selected' : ''}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
           
            <button type="submit" className="btn-primary">Continue</button>
          </form>

          <div className="progress-dots">
            <div className="dot completed"></div>
            <div className="dot active"></div>
            <div className="dot"></div>
          </div>
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
                {(plan.timeline_display || '?') + ' Months'}
              </span>
            </div>
          </div>
          
          <div className="sidebar-section">
            <h3>Commitment</h3>
            <div className="sidebar-item">
              <span>Weekly Commitment</span>
              <span className="value"> {plan.commitment_display} </span>
            </div>
          </div> 
          
          <div className="sidebar-section">
            <h3>Actions</h3>
            <div className="sidebar-item">
              <span>Applications with Outreach</span>
              <span className="value"> {plan.appsWithOutreachPerWeekDisplay} </span>
            </div>
            <div className="sidebar-item">
              <span>Informational Interview Outreach</span>
              <span className="value"> {plan.linkedinOutreachPerWeekDisplay} </span>
            </div>
            <div className="sidebar-item">
              <span>In-person Events</span>
              <span className="value"> {plan.inPersonEventsPerMonthDisplay} </span>
            </div>
            <div className="sidebar-item">
              <span>Career Fairs</span>
              <span className="value"> {plan.careerFairsPerYearDisplay} </span>
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

     
    </div>
    </div>
  );
}
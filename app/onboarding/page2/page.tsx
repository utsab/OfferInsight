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
      await checkAuth();
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

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="onboarding-container onboarding-page2">
      <div className="onboarding-content-wrapper">
        <div className="onboarding-main-content">
          <div className="onboarding-header">
            <h1 className="welcome-text">Cool, now let's set goals</h1>
          </div>
          <form className="onboarding-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">How many months do you have to secure an internship?</label>
              <div className="options-container">
                {['1-3', '4-6', '7-9', '10-12', '12+'].map((option, index) => (
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
        
        <div className="action-plan-sidebar">
          <div className="sidebar-logo">
            <img src="/logo-icon.png" alt="OpenResumeBook" />
            <span>OpenResumeBook</span>
          </div>
          
          <h2>Success Calculator</h2>
          
          <div className="sidebar-section">
            <h3>Timeline</h3>
            <div className="sidebar-item">
              <span>Secure internship within</span>
              <span className="value-pill">
                {(monthsToSecureInternship || '9-12') + ' Months'}
              </span>
            </div>
          </div>
          
          <div className="sidebar-section">
            <h3>Commitment</h3>
            <div className="sidebar-item">
              <span>Weekly Commitment</span>
              <span className="value">2+ Hours</span>
            </div>
          </div>
          
          <div className="sidebar-section">
            <h3>Actions</h3>
            <div className="sidebar-item">
              <span>Applications</span>
              <span className="value">15 Weekly</span>
            </div>
            <div className="sidebar-item">
              <span>LinkedIn Outreach</span>
              <span className="value">5 Weekly</span>
            </div>
            <div className="sidebar-item">
              <span>Meetup / Networking Events</span>
              <span className="value">5+ Monthly</span>
            </div>
          </div>
          
          <div className="metrics-container">
            <div className="metric-box">
              <h4>Interviews</h4>
              <div className="metric-value">5</div>
            </div>
            <div className="metric-box">
              <h4>Job Offers</h4>
              <div className="metric-value">1</div>
            </div>
          </div>
          
          <div className="sidebar-footer">
            <div>© OpenResumeBook</div>
            <div className="email">
              <span>help@resumebook.com</span>
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
  );
}
"use client"

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '../../server';
import '../shared-onboarding.css';
import './page.css';

export default function Page1() {
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [major, setMajor] = useState('');
  const [graduationMonth, setGraduationMonth] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [profileImage, setProfileImage] = useState('/profile-placeholder.jpg'); // Default placeholder image
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function authenticate() {
      const session = await checkAuth(); // Assuming checkAuth returns session data
      if (session?.user?.image) {
        setProfileImage(session.user.image); // Set the profile image from session
      }
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
        name,
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
    return <div className="onboarding-container">Loading...</div>;
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-header">
        <img
          src={profileImage} // Use the profile image from session
          alt="Profile"
          className="profile-image"
        />
        <h1 className="welcome-text">Welcome!</h1>
        <p className="subtitle">Let's quickly complete your professional profile.</p>
      </div>

      <form className="onboarding-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name" className="form-label required">
            Full Name
          </label>
          <div className="icon-input">
            <span className="icon">👤</span>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="form-input"
              placeholder="John Doe"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="school" className="form-label required">
            School or University
          </label>
          <div className="icon-input">
            <span className="icon">🏫</span>
            <input
              type="text"
              id="school"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              required
              className="form-input"
              placeholder="University of California, Los Angeles"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="major" className="form-label required">
            Major
          </label>
          <div className="icon-input">
            <span className="icon">📚</span>
            <input
              type="text"
              id="major"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              required
              className="form-input"
              placeholder="Computer Science"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="graduationDate" className="form-label required">
            Expected Graduation Date
          </label>
          <div className="date-inputs">
            <div>
              <select
                id="graduationYear"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                required
                className="form-select"
              >
                <option value="" disabled>Year</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                id="graduationMonth"
                value={graduationMonth}
                onChange={(e) => setGraduationMonth(e.target.value)}
                required
                className="form-select"
              >
                <option value="" disabled>Month</option>
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <button type="submit" className="btn-primary">Continue</button>
      </form>
      
      <div className="progress-dots">
        <div className="dot active"></div>
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>
    </div>
  );
}
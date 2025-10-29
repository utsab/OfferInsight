"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth } from '../../server';
import './page.css';

export default function Page1V2() {
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [major, setMajor] = useState('');
  const [graduationMonth, setGraduationMonth] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function authenticate() {
      const session = await checkAuth();
      setLoading(false);
    }
    authenticate();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const response = await fetch('/api/users/onboarding1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        school,
        major,
        expectedGraduationDate: `${graduationYear}-${graduationMonth.padStart(2, '0')}-01`,
      }),
    });

    if (response.ok) {
      console.log('User information updated successfully');
      router.push('/onboarding/page2-v2');
    } else {
      console.error('Failed to update user information');
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (confirm('Are you sure you want to skip? This information helps us personalize your experience.')) {
      router.push('/onboarding/page2-v2');
    }
  };

  // Generate years from current year - 30 to current year + 10
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 41 }, (_, i) => currentYear - 30 + i);
  
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
    { value: '12', label: 'December' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-midnight-blue to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-midnight-blue to-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-12 w-[600px] shadow-2xl">
        <div className="text-center mb-10">
          {/* <div className="flex items-center justify-center space-x-3 mb-4">
            <i className="fas fa-chart-line text-electric-blue text-3xl"></i>
            <h1 className="text-2xl font-bold text-white">OfferInsight</h1>
          </div> */}
          <h2 className="text-4xl font-bold text-white mb-3">Welcome Aboard!</h2>
          <p className="text-gray-300 text-lg">Let's set up your profile</p>
          <div className="flex justify-center mt-6">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-electric-blue rounded-full"></div>
              <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
              <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-group">
            <label className="block text-white font-semibold mb-3 text-lg">
              <i className="fas fa-user text-electric-blue mr-2"></i>
              Full Name
            </label>
            <input 
              type="text" 
              name="fullName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-5 py-4 text-white placeholder-gray-400 text-lg focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue focus:ring-opacity-50 transition-all" 
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label className="block text-white font-semibold mb-3 text-lg">
              <i className="fas fa-university text-electric-blue mr-2"></i>
              School / University
            </label>
            <input 
              type="text" 
              name="school"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-5 py-4 text-white placeholder-gray-400 text-lg focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue focus:ring-opacity-50 transition-all" 
              placeholder="e.g., Stanford University, MIT, UC Berkeley"
              required
            />
          </div>

          <div className="form-group">
            <label className="block text-white font-semibold mb-3 text-lg">
              <i className="fas fa-graduation-cap text-electric-blue mr-2"></i>
              Major / Field of Study
            </label>
            <input 
              type="text" 
              name="major"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-5 py-4 text-white placeholder-gray-400 text-lg focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue focus:ring-opacity-50 transition-all" 
              placeholder="e.g., Computer Science, Business Administration"
              required
            />
          </div>

          <div className="form-group">
            <label className="block text-white font-semibold mb-3 text-lg">
              <i className="fas fa-calendar-alt text-electric-blue mr-2"></i>
              Expected Graduation Date
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Month</label>
                <select 
                  name="graduationMonth"
                  value={graduationMonth}
                  onChange={(e) => setGraduationMonth(e.target.value)}
                  className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-3 text-white focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue focus:ring-opacity-50 transition-all"
                  required
                >
                  <option value="">Select month</option>
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">Year</label>
                <select 
                  name="graduationYear"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-3 text-white focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue focus:ring-opacity-50 transition-all"
                  required
                >
                  <option value="">Select year</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-electric-blue hover:bg-blue-600 text-white py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-electric-blue focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Processing...
                </>
              ) : (
                <>
                  Continue to Timeline Setup
                  <i className="fas fa-arrow-right ml-2"></i>
                </>
              )}
            </button>
            
            {/* <div className="text-center mt-4">
              <button 
                type="button" 
                onClick={handleSkip}
                className="text-gray-400 hover:text-white text-sm underline transition-colors"
              >
                Skip for now
              </button>
            </div> */}
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-light-steel-blue">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Step 1 of 3</span>
            {/* <span className="flex items-center">
              <i className="fas fa-shield-alt text-electric-blue mr-1"></i>
              Your data is secure
            </span> */}
          </div>
        </div>
      </div>
    </div>
  );
}

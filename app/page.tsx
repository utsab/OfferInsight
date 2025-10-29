'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Page() {
  const [currentStep, setCurrentStep] = useState<'homepage' | 'onboarding-step1' | 'onboarding-step2' | 'onboarding-step3' | 'dashboard'>('homepage');
  const [selectedTimeline, setSelectedTimeline] = useState<string>('');
  const [onboardingProgress, setOnboardingProgress] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const showStep = (stepId: 'homepage' | 'onboarding-step1' | 'onboarding-step2' | 'onboarding-step3' | 'dashboard') => {
    setCurrentStep(stepId as any);
  };

  const handleTimelineSelect = (months: string) => {
    setSelectedTimeline(months);
  };

  // Fetch user's onboarding progress on component mount
  useEffect(() => {
    const fetchOnboardingProgress = async () => {
      try {
        const response = await fetch('/api/users/onboarding2');
        if (response.ok) {
          const user = await response.json();
          setOnboardingProgress(user.onboarding_progress);
        }
      } catch (error) {
        console.error('Failed to fetch onboarding progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOnboardingProgress();
  }, []);

  const handleGetStarted = () => {
    if (loading) return;
    
    // Redirect based on onboarding progress
    switch (onboardingProgress) {
      case 0:
        window.location.href = '/onboarding/page1-v2';
        break;
      case 1:
        window.location.href = '/onboarding/page2-v2';
        break;
      case 2:
        window.location.href = '/onboarding/page3-v2';
        break;
      case 3:
        window.location.href = '/dashboard';
        break;
      default:
        // If no progress or error, start from the beginning
        window.location.href = '/onboarding/page1-v2';
    }
  };


  const handleOnboarding1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to the actual page1-v2
    window.location.href = '/onboarding/page1-v2';
  };

  const handleOnboarding2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTimeline !== '') {
      showStep('onboarding-step3');
    }
  };

  const handleOnboarding3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to the actual dashboard page
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-midnight-blue to-gray-900">
      {/* Homepage */}
      {currentStep === 'homepage' && (
        <>
          <section className="h-[600px] flex items-center justify-center">
            <div className="max-w-4xl mx-auto text-center px-8">
              <h2 className="text-5xl font-bold mb-6 text-white leading-tight">
                Track Your Job Search.<br />
                <span className="text-electric-blue">Predict Your Success.</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                OfferInsight tracks your job-seeking habits and provides data-driven insights to project when you'll receive your first job offer. Master the four key habits that lead to success.
              </p>
              <button 
                onClick={handleGetStarted}
                disabled={loading}
                className="bg-electric-blue hover:bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Get Started'}
              </button>
            </div>
          </section>

          <section className="py-20 px-8">
            <div className="max-w-6xl mx-auto">
              <h3 className="text-3xl font-bold text-center mb-16 text-white">Four Habits to Success</h3>
              <div className="grid grid-cols-4 gap-8">
                <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-8 text-center">
                  <i className="fas fa-file-alt text-white text-4xl mb-4"></i>
                  <h4 className="text-lg font-bold mb-3 text-white">High Quality Applications</h4>
                  <p className="text-gray-300 text-sm">Track and optimize your job application process for maximum impact.</p>
                </div>
                <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-8 text-center">
                  <i className="fas fa-comments text-white text-4xl mb-4"></i>
                  <h4 className="text-lg font-bold mb-3 text-white">Informational Interviews</h4>
                  <p className="text-gray-300 text-sm">Build meaningful connections through strategic networking conversations.</p>
                </div>
                <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-8 text-center">
                  <i className="fas fa-users text-white text-4xl mb-4"></i>
                  <h4 className="text-lg font-bold mb-3 text-white">In-Person Events</h4>
                  <p className="text-gray-300 text-sm">Attend career fairs, meetups, and networking events to expand your reach.</p>
                </div>
                <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-8 text-center">
                  <i className="fas fa-code text-white text-4xl mb-4"></i>
                  <h4 className="text-lg font-bold mb-3 text-white">LeetCode Practice</h4>
                  <p className="text-gray-300 text-sm">Sharpen your technical skills with consistent coding practice.</p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}


      {/* Onboarding Step 1 */}
      {currentStep === 'onboarding-step1' && (
        <div className="min-h-screen bg-gradient-to-br from-midnight-blue to-gray-900 flex items-center justify-center">
          <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-10 w-[500px]">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Welcome to OfferInsight</h2>
              <p className="text-gray-300">Let's get to know you better</p>
            </div>
            <form onSubmit={handleOnboarding1Submit}>
              <div className="mb-6">
                <label className="block text-white font-semibold mb-2">Full Name</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-3 text-white placeholder-gray-400" 
                  placeholder="Enter your full name"
                />
              </div>
              <div className="mb-6">
                <label className="block text-white font-semibold mb-2">School</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-3 text-white placeholder-gray-400" 
                  placeholder="Enter your school name"
                />
              </div>
              <div className="mb-6">
                <label className="block text-white font-semibold mb-2">Major</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-3 text-white placeholder-gray-400" 
                  placeholder="Enter your major"
                />
              </div>
              <div className="mb-8">
                <label className="block text-white font-semibold mb-2">Year of Graduation</label>
                <select className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-3 text-white">
                  <option>2024</option>
                  <option>2025</option>
                  <option>2026</option>
                  <option>2027</option>
                </select>
      </div>
              <button 
                type="submit" 
                className="w-full bg-electric-blue hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Onboarding Step 2 */}
      {currentStep === 'onboarding-step2' && (
        <div className="min-h-screen bg-gradient-to-br from-midnight-blue to-gray-900 flex items-center justify-center">
          <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-10 w-[500px]">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Timeline Planning</h2>
              <p className="text-gray-300">This helps us create your personalized roadmap</p>
            </div>
            <form onSubmit={handleOnboarding2Submit}>
              <div className="mb-8">
                <label className="block text-white font-semibold mb-4">How many months do you have to secure an internship or job?</label>
                <div className="grid grid-cols-3 gap-4">
                  {['3', '6', '9', '12', '18', '0'].map((months) => (
                    <button 
                      key={months}
                      type="button" 
                      onClick={() => handleTimelineSelect(months)}
                      className={`timeline-btn border border-light-steel-blue rounded-lg py-4 text-white font-semibold transition-colors ${
                        selectedTimeline === months 
                          ? 'bg-electric-blue' 
                          : 'bg-gray-700 hover:bg-electric-blue'
                      }`}
                    >
                      {months === '0' ? 'Not Sure' : `${months} Months`}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full bg-electric-blue hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Onboarding Step 3 */}
      {currentStep === 'onboarding-step3' && (
        <div className="min-h-screen bg-gradient-to-br from-midnight-blue to-gray-900 flex items-center justify-center">
          <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-10 w-[600px]">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Fine-tune Your Plan</h2>
              <p className="text-gray-300">Customize your weekly goals for each habit</p>
            </div>
            <form onSubmit={handleOnboarding3Submit}>
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-700 border border-light-steel-blue rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3 flex items-center">
                    <i className="fas fa-file-alt text-electric-blue mr-2"></i>
                    Applications per Week
                  </h4>
                  <input 
                    type="number" 
                    className="w-full bg-gray-600 border border-light-steel-blue rounded px-3 py-2 text-white" 
                    defaultValue="5" 
                    min="1"
                  />
                </div>
                <div className="bg-gray-700 border border-light-steel-blue rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3 flex items-center">
                    <i className="fas fa-comments text-electric-blue mr-2"></i>
                    Interviews per Week
                  </h4>
                  <input 
                    type="number" 
                    className="w-full bg-gray-600 border border-light-steel-blue rounded px-3 py-2 text-white" 
                    defaultValue="2" 
                    min="0"
                  />
                </div>
                <div className="bg-gray-700 border border-light-steel-blue rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3 flex items-center">
                    <i className="fas fa-users text-electric-blue mr-2"></i>
                    Events per Month
                  </h4>
                  <input 
                    type="number" 
                    className="w-full bg-gray-600 border border-light-steel-blue rounded px-3 py-2 text-white" 
                    defaultValue="3" 
                    min="0"
                  />
                </div>
                <div className="bg-gray-700 border border-light-steel-blue rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3 flex items-center">
                    <i className="fas fa-code text-electric-blue mr-2"></i>
                    LeetCode per Week
                  </h4>
                  <input 
                    type="number" 
                    className="w-full bg-gray-600 border border-light-steel-blue rounded px-3 py-2 text-white" 
                    defaultValue="10" 
                    min="0"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full bg-electric-blue hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Start Tracking
              </button>
            </form>
          </div>
        </div>
      )}

      </div>
  );
}

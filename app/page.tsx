'use client';

import { useState, useEffect } from 'react';
import { FileText, MessageCircle, Users, Code } from 'lucide-react';
import { handleSignIn } from '@/components/auth-actions';

export default function Page() {
  const [onboardingProgress, setOnboardingProgress] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Fetch user's onboarding progress on component mount
  useEffect(() => {
    const fetchOnboardingProgress = async () => {
      try {
        const response = await fetch('/api/users/onboarding2');
        if (response.ok) {
          const user = await response.json();
          setOnboardingProgress(user.onboardingProgress);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Failed to fetch onboarding progress:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    fetchOnboardingProgress();
  }, []);

  const handleGoToDashboard = async () => {
    if (loading) return;
    
    // If user is not authenticated, trigger sign-in flow
    if (!isAuthenticated) {
      await handleSignIn();
      return;
    }
    
    // Redirect based on onboarding progress
    switch (onboardingProgress) {
      case 0:
        window.location.href = '/onboarding/page1';
        break;
      case 1:
        window.location.href = '/onboarding/page2';
        break;
      case 2:
        window.location.href = '/onboarding/page3';
        break;
      case 3:
        window.location.href = '/dashboard';
        break;
      default:
        // If no progress or error, start from the beginning
        window.location.href = '/onboarding/page1';
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-midnight-blue to-gray-900">
      <section className="min-h-[400px] sm:h-[600px] flex items-center justify-center py-12 sm:py-0">
            <div className="max-w-4xl mx-auto text-center px-4 sm:px-8">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-white leading-tight">
                Track Your Job Search.<br />
                <span className="text-electric-blue">Predict Your Success.</span>
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-2">
                OSRB helps you track your job search journey and build a comprehensive resume based on your applications, networking, and skill development. Master the four key habits that lead to success.
              </p>
              <button 
                onClick={handleGoToDashboard}
                disabled={loading}
                className="bg-electric-blue hover:bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Go to Dashboard'}
              </button>
            </div>
          </section>

          <section className="py-12 sm:py-20 px-4 sm:px-8">
            <div className="max-w-[1600px] mx-auto">
              <h3 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-16 text-white">Four Habits to Success</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-6 sm:p-8 text-center">
                  <FileText className="text-white text-3xl sm:text-4xl mb-3 sm:mb-4 mx-auto" />
                  <h4 className="text-base sm:text-lg font-bold mb-2 sm:mb-3 text-white">High Quality Applications</h4>
                  <p className="text-gray-300 text-sm">Track and optimize your job application process for maximum impact.</p>
                </div>
                <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-6 sm:p-8 text-center">
                  <MessageCircle className="text-white text-3xl sm:text-4xl mb-3 sm:mb-4 mx-auto" />
                  <h4 className="text-base sm:text-lg font-bold mb-2 sm:mb-3 text-white">Informational Interviews</h4>
                  <p className="text-gray-300 text-sm">Build meaningful connections through strategic networking conversations.</p>
                </div>
                <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-6 sm:p-8 text-center">
                  <Users className="text-white text-3xl sm:text-4xl mb-3 sm:mb-4 mx-auto" />
                  <h4 className="text-base sm:text-lg font-bold mb-2 sm:mb-3 text-white">In-Person Events</h4>
                  <p className="text-gray-300 text-sm">Attend career fairs, meetups, and networking events to expand your reach.</p>
                </div>
                <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-6 sm:p-8 text-center">
                  <Code className="text-white text-3xl sm:text-4xl mb-3 sm:mb-4 mx-auto" />
                  <h4 className="text-base sm:text-lg font-bold mb-2 sm:mb-3 text-white">LeetCode Practice</h4>
                  <p className="text-gray-300 text-sm">Sharpen your technical skills with consistent coding practice.</p>
                </div>
              </div>
            </div>
          </section>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Page() {
  const [currentStep, setCurrentStep] = useState<'homepage' | 'onboarding-step1' | 'onboarding-step2' | 'onboarding-step3' | 'dashboard'>('homepage');
  const [selectedTimeline, setSelectedTimeline] = useState<string>('');

  const showStep = (stepId: 'homepage' | 'onboarding-step1' | 'onboarding-step2' | 'onboarding-step3' | 'dashboard') => {
    setCurrentStep(stepId as any);
  };

  const handleTimelineSelect = (months: string) => {
    setSelectedTimeline(months);
  };


  const handleOnboarding1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    showStep('onboarding-step2');
  };

  const handleOnboarding2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTimeline !== '') {
      showStep('onboarding-step3');
    }
  };

  const handleOnboarding3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    showStep('dashboard');
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
                onClick={() => showStep('onboarding-step1')}
                className="bg-electric-blue hover:bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors"
              >
                Get Started
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

      {/* Dashboard */}
      {currentStep === 'dashboard' && (
        <div className="min-h-screen bg-gray-900">
          <header className="bg-gray-800 border-b border-light-steel-blue">
            <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <i className="fas fa-chart-line text-electric-blue text-xl"></i>
                <h1 className="text-xl font-bold text-white">OfferInsight</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-300">Welcome back, John</span>
                <img 
                  src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" 
                  className="w-8 h-8 rounded-full"
                  alt="User avatar"
                />
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="bg-gradient-to-r from-electric-blue to-blue-600 rounded-lg p-8 mb-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-2">Projected Offer Date</h2>
              <p className="text-5xl font-bold text-white">March 15, 2024</p>
              <p className="text-blue-100 mt-2">Based on your current progress and habits</p>
            </div>

            <div className="grid grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Applications</h3>
                  <i className="fas fa-file-alt text-electric-blue"></i>
                </div>
                <div className="text-3xl font-bold text-white mb-2">23</div>
                <div className="text-sm text-gray-400">This month</div>
              </div>
              <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Interviews</h3>
                  <i className="fas fa-comments text-electric-blue"></i>
                </div>
                <div className="text-3xl font-bold text-white mb-2">8</div>
                <div className="text-sm text-gray-400">This month</div>
              </div>
              <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Events</h3>
                  <i className="fas fa-users text-electric-blue"></i>
                </div>
                <div className="text-3xl font-bold text-white mb-2">4</div>
                <div className="text-sm text-gray-400">This month</div>
              </div>
              <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">LeetCode</h3>
                  <i className="fas fa-code text-electric-blue"></i>
                </div>
                <div className="text-3xl font-bold text-white mb-2">47</div>
                <div className="text-sm text-gray-400">This month</div>
              </div>
            </div>

            <div className="bg-gray-800 border border-light-steel-blue rounded-lg">
              <div className="flex border-b border-light-steel-blue">
                <button className="flex-1 py-4 px-6 text-center font-semibold border-r border-light-steel-blue bg-electric-blue text-white">
                  <i className="fas fa-file-alt mr-2"></i>Applications
                </button>
                <button className="flex-1 py-4 px-6 text-center font-semibold border-r border-light-steel-blue text-gray-400 hover:text-white">
                  <i className="fas fa-comments mr-2"></i>Interviews
                </button>
                <button className="flex-1 py-4 px-6 text-center font-semibold border-r border-light-steel-blue text-gray-400 hover:text-white">
                  <i className="fas fa-users mr-2"></i>Events
                </button>
                <button className="flex-1 py-4 px-6 text-center font-semibold text-gray-400 hover:text-white">
                  <i className="fas fa-code mr-2"></i>LeetCode
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-4 flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                      To Do
                    </h4>
                    <div className="space-y-3">
                      <div className="bg-gray-600 border border-light-steel-blue rounded p-3">
                        <div className="text-white font-medium mb-1">Google Software Engineer</div>
                        <div className="text-gray-400 text-sm">Application deadline: Dec 15</div>
                      </div>
                      <div className="bg-gray-600 border border-light-steel-blue rounded p-3">
                        <div className="text-white font-medium mb-1">Microsoft Product Manager</div>
                        <div className="text-gray-400 text-sm">Application deadline: Dec 20</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-4 flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      In Progress
                    </h4>
                    <div className="space-y-3">
                      <div className="bg-gray-600 border border-light-steel-blue rounded p-3">
                        <div className="text-white font-medium mb-1">Meta Data Scientist</div>
                        <div className="text-gray-400 text-sm">Resume customization</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-4 flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      Completed
                    </h4>
                    <div className="space-y-3">
                      <div className="bg-gray-600 border border-light-steel-blue rounded p-3">
                        <div className="text-white font-medium mb-1">Amazon SDE Intern</div>
                        <div className="text-gray-400 text-sm">Submitted Dec 10</div>
                      </div>
                      <div className="bg-gray-600 border border-light-steel-blue rounded p-3">
                        <div className="text-white font-medium mb-1">Netflix Engineering</div>
                        <div className="text-gray-400 text-sm">Submitted Dec 8</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
  );
}

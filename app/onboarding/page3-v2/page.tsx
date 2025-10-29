'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Page3V2() {
  const router = useRouter();

  // Goals (sliders)
  const [appsPerWeek, setAppsPerWeek] = useState<number>(5);
  const [interviewsPerWeek, setInterviewsPerWeek] = useState<number>(2);
  const [eventsPerMonth, setEventsPerMonth] = useState<number>(3);
  const [fairsPerYear, setFairsPerYear] = useState<number>(1);

  // Projection calculations (adapted from original page3, with fairs instead of LeetCode)
  const { successRate, timeToOffer, weeklyHours } = useMemo(() => {
    const totalScore = appsPerWeek * 2 + interviewsPerWeek * 3 + eventsPerMonth * 1.5 + fairsPerYear * 1.0;
    const sr = Math.min(95, Math.max(45, 45 + totalScore * 1.2));
    const tto = Math.max(2.5, 6.5 - totalScore * 0.15);
    const wh = appsPerWeek * 1.5 + interviewsPerWeek * 2 + eventsPerMonth * 0.5 + fairsPerYear * 0.75;
    return { successRate: Math.round(sr), timeToOffer: Number(tto.toFixed(1)), weeklyHours: Math.round(wh) };
  }, [appsPerWeek, interviewsPerWeek, eventsPerMonth, fairsPerYear]);

  const handleBack = () => router.back();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('userGoals', JSON.stringify({
        applications: appsPerWeek,
        interviews: interviewsPerWeek,
        events: eventsPerMonth,
        fairs: fairsPerYear,
      }));
    } catch {}
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-midnight-blue to-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-10 w-[700px] max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-4">
            <i className="fas fa-chart-line text-electric-blue text-3xl mr-3"></i>
            <h1 className="text-2xl font-bold text-white">OfferInsight</h1>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Fine-tune Your Action Plan</h2>
          <p className="text-gray-300 text-lg">Customize your weekly and monthly goals for each habit to maximize your success</p>
          <div className="flex items-center justify-center mt-4">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-electric-blue rounded-full"></div>
              <div className="w-3 h-3 bg-electric-blue rounded-full"></div>
              <div className="w-3 h-3 bg-electric-blue rounded-full"></div>
            </div>
            <span className="text-gray-400 ml-3 text-sm">Step 3 of 3</span>
          </div>
        </div>

        {/* Plan recommendation */}
        <div className="bg-gradient-to-r from-electric-blue/20 to-blue-600/20 border border-electric-blue/30 rounded-lg p-6 mb-8">
          <div className="flex items-center mb-3">
            <i className="fas fa-lightbulb text-electric-blue text-xl mr-3"></i>
            <h3 className="text-white font-bold text-lg">Recommended Plan Based on Your Timeline</h3>
          </div>
          <p className="text-gray-300 mb-4">Based on your timeline, here's our data-driven recommendation to maximize your chances of success:</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="text-electric-blue font-semibold">Success Rate: {successRate}%</div>
              <div className="text-gray-300 text-sm">With this plan</div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="text-electric-blue font-semibold">Avg. Time to Offer: {timeToOffer} months</div>
              <div className="text-gray-300 text-sm">Based on similar profiles</div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Applications */}
            <div className="bg-gray-700 border border-light-steel-blue rounded-lg p-6 hover:border-electric-blue/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-bold text-lg flex items-center">
                  <i className="fas fa-file-alt text-electric-blue mr-3"></i>
                  High Quality Applications
                </h4>
                <div className="text-electric-blue text-sm font-semibold">WEEKLY</div>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">Target per week:</span>
                  <span className="text-white font-bold text-xl">{appsPerWeek}</span>
                </div>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  min={1}
                  max={15}
                  value={appsPerWeek}
                  onChange={(e) => setAppsPerWeek(Number(e.target.value))}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1</span>
                  <span>15</span>
                </div>
              </div>
              <div className="text-gray-400 text-sm">
                <i className="fas fa-info-circle mr-1"></i>
                Focus on quality over quantity for better results
              </div>
            </div>

            {/* Interviews */}
            <div className="bg-gray-700 border border-light-steel-blue rounded-lg p-6 hover:border-electric-blue/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-bold text-lg flex items-center">
                  <i className="fas fa-comments text-electric-blue mr-3"></i>
                  Informational Interviews
                </h4>
                <div className="text-electric-blue text-sm font-semibold">WEEKLY</div>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">Target per week:</span>
                  <span className="text-white font-bold text-xl">{interviewsPerWeek}</span>
                </div>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  min={0}
                  max={8}
                  value={interviewsPerWeek}
                  onChange={(e) => setInterviewsPerWeek(Number(e.target.value))}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0</span>
                  <span>8</span>
                </div>
              </div>
              <div className="text-gray-400 text-sm">
                <i className="fas fa-info-circle mr-1"></i>
                Build meaningful connections in your industry
              </div>
            </div>

            {/* Events */}
            <div className="bg-gray-700 border border-light-steel-blue rounded-lg p-6 hover:border-electric-blue/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-bold text-lg flex items-center">
                  <i className="fas fa-users text-electric-blue mr-3"></i>
                  In-Person Events
                </h4>
                <div className="text-electric-blue text-sm font-semibold">MONTHLY</div>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">Target per month:</span>
                  <span className="text-white font-bold text-xl">{eventsPerMonth}</span>
                </div>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  min={0}
                  max={10}
                  value={eventsPerMonth}
                  onChange={(e) => setEventsPerMonth(Number(e.target.value))}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0</span>
                  <span>10</span>
                </div>
              </div>
              <div className="text-gray-400 text-sm">
                <i className="fas fa-info-circle mr-1"></i>
                Career fairs, meetups, and networking events
              </div>
            </div>

            {/* Career Fairs (replaces LeetCode) */}
            <div className="bg-gray-700 border border-light-steel-blue rounded-lg p-6 hover:border-electric-blue/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-bold text-lg flex items-center">
                  <i className="fas fa-building-columns text-electric-blue mr-3"></i>
                  Career Fairs
                </h4>
                <div className="text-electric-blue text-sm font-semibold">YEARLY</div>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">Total per year:</span>
                  <span className="text-white font-bold text-xl">{fairsPerYear}</span>
                </div>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  min={0}
                  max={8}
                  value={fairsPerYear}
                  onChange={(e) => setFairsPerYear(Number(e.target.value))}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0</span>
                  <span>8</span>
                </div>
              </div>
              <div className="text-gray-400 text-sm">
                <i className="fas fa-info-circle mr-1"></i>
                Large events to meet many employers in one place
              </div>
            </div>
          </div>

          {/* Projections */}
          <div className="bg-gray-700/30 border border-light-steel-blue rounded-lg p-6 mb-8">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center">
              <i className="fas fa-target text-electric-blue mr-3"></i>
              Projected Outcome with Your Custom Plan
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-electric-blue mb-1">{successRate}%</div>
                <div className="text-gray-300 text-sm">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-electric-blue mb-1">{timeToOffer}</div>
                <div className="text-gray-300 text-sm">Months to Offer</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-electric-blue mb-1">{weeklyHours}</div>
                <div className="text-gray-300 text-sm">Hours per Week</div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-4">
            <button type="button" onClick={handleBack} className="flex-1 bg-gray-700 hover:bg-gray-600 border border-light-steel-blue text-white py-4 rounded-lg font-semibold transition-colors">
              <i className="fas fa-arrow-left mr-2"></i>
              Back
            </button>
            <button type="submit" className="flex-2 bg-electric-blue hover:bg-blue-600 text-white py-4 px-8 rounded-lg font-bold text-lg transition-colors">
              <i className="fas fa-rocket mr-2"></i>
              Start Tracking My Progress
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



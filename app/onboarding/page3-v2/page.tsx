'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lightbulb, Clock, FileText, Info, Coffee, Users, Building2, CalendarCheck, ArrowLeft, Rocket } from 'lucide-react';

export default function Page3V2() {
  const router = useRouter();

  // Goals (sliders)
  const [appsPerWeek, setAppsPerWeek] = useState<number>(5);
  const [interviewsPerMonth, setInterviewsPerMonth] = useState<number>(2);
  const [eventsPerMonth, setEventsPerMonth] = useState<number>(3);
  const [fairsPerYear, setFairsPerYear] = useState<number>(1);
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(12);

  // Initialize values from server (based on selections saved in page2-v2)
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const res = await fetch('/api/users/onboarding2');
        if (!res.ok) return;
        const user = await res.json();
        if (typeof user.apps_with_outreach_per_week === 'number') {
          setAppsPerWeek(user.apps_with_outreach_per_week);
        }
        if (typeof user.info_interview_outreach_per_month === 'number') {
          setInterviewsPerMonth(user.info_interview_outreach_per_month);
        }
        if (typeof user.in_person_events_per_month === 'number') {
          setEventsPerMonth(user.in_person_events_per_month);
        }
        if (typeof user.career_fairs_quota === 'number') {
          setFairsPerYear(user.career_fairs_quota);
        }
        if (typeof user.commitment === 'number') {
          setHoursPerWeek(user.commitment);
        }
      } catch (e) {
        console.error('Failed to load initial onboarding values:', e);
      }
    };
    fetchInitial();
  }, []);

  // Projection calculations (adapted from original page3, with fairs instead of LeetCode)
  const { successRate, timeToOffer, weeklyHours, projectedOfferDate } = useMemo(() => {
    const totalScore =
      appsPerWeek * 2 +
      interviewsPerMonth * 3 +
      eventsPerMonth * 1.5 +
      fairsPerYear * 1.0 +
      hoursPerWeek * 1.0;
    const sr = Math.min(95, Math.max(45, 45 + totalScore * 1.2));
    // Time to offer in months (float)
    const tto = Math.max(2.5, 6.5 - totalScore * 0.15);
    const wh = hoursPerWeek;
    // Compute a more responsive projected date by adding days based on fractional months
    const base = new Date();
    const daysToAdd = Math.round(tto * 30); // approximate month length
    const projDate = new Date(base.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    return { successRate: Math.round(sr), timeToOffer: Number(tto.toFixed(1)), weeklyHours: Math.round(wh), projectedOfferDate: projDate };
  }, [appsPerWeek, interviewsPerMonth, eventsPerMonth, fairsPerYear, hoursPerWeek]);

  const handleBack = () => router.back();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const response = await fetch('/api/users/onboarding3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        commitment: weeklyHours,
        apps_with_outreach_per_week: appsPerWeek,
        info_interview_outreach_per_month: interviewsPerMonth,
        in_person_events_per_month: eventsPerMonth,
        career_fairs_quota: fairsPerYear,
        projected_offer_date: projectedOfferDate.toISOString()
      }),
    });

    if (response.ok) {
      console.log('User plan updated successfully');
      router.push('/dashboard');
    } else {
      console.error('Failed to update user plan');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-midnight-blue to-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-10 w-[700px] max-w-4xl">
        {/* Header (condensed) */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white">Fine-tune Your Action Plan</h2>
          <div className="flex items-center justify-center mt-3">
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
            <Lightbulb className="text-electric-blue text-xl mr-3" />
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
            {/* Hours per Week (wide and short) */}
            <div className="col-span-2 bg-gray-700 border border-light-steel-blue rounded-lg p-4 hover:border-electric-blue/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-bold text-lg flex items-center">
                  <Clock className="text-electric-blue mr-3" />
                  Hours per Week
                </h4>
                <div className="text-electric-blue text-sm font-semibold">0 - 40</div>
              </div>
              <div className="mb-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">Weekly commitment:</span>
                  <span className="text-white font-bold text-xl">{hoursPerWeek}</span>
                </div>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  min={0}
                  max={40}
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0</span>
                  <span>40</span>
                </div>
              </div>
            </div>
            {/* Applications */}
            <div className="bg-gray-700 border border-light-steel-blue rounded-lg p-6 hover:border-electric-blue/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-bold text-lg flex items-center">
                  <FileText className="text-electric-blue mr-3" />
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
              <div className="text-gray-400 text-sm flex items-center">
                <Info className="mr-1" />
                Focus on quality over quantity for better results
              </div>
            </div>

            {/* Coffee Chats */}
            <div className="bg-gray-700 border border-light-steel-blue rounded-lg p-6 hover:border-electric-blue/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-bold text-lg flex items-center">
                  <Coffee className="text-electric-blue mr-3" />
                  Coffee Chats
                </h4>
                <div className="text-electric-blue text-sm font-semibold">MONTHLY</div>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">Target per month:</span>
                  <span className="text-white font-bold text-xl">{interviewsPerMonth}</span>
                </div>
                <input
                  type="range"
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  min={0}
                  max={8}
                  value={interviewsPerMonth}
                  onChange={(e) => setInterviewsPerMonth(Number(e.target.value))}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0</span>
                  <span>8</span>
                </div>
              </div>
              <div className="text-gray-400 text-sm flex items-center">
                <Info className="mr-1" />
                Build meaningful connections in your industry
              </div>
            </div>

            {/* Events */}
            <div className="bg-gray-700 border border-light-steel-blue rounded-lg p-6 hover:border-electric-blue/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-bold text-lg flex items-center">
                  <Users className="text-electric-blue mr-3" />
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
              <div className="text-gray-400 text-sm flex items-center">
                <Info className="mr-1" />
                Career fairs, meetups, and networking events
              </div>
            </div>

            {/* Career Fairs (replaces LeetCode) */}
            <div className="bg-gray-700 border border-light-steel-blue rounded-lg p-6 hover:border-electric-blue/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-bold text-lg flex items-center">
                  <Building2 className="text-electric-blue mr-3" />
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
              <div className="text-gray-400 text-sm flex items-center">
                <Info className="mr-1" />
                Large events to meet many employers in one place
              </div>
            </div>
          </div>

          {/* Projected Offer Date (reverted to original lighter style) */}
          <div className="bg-gray-700/30 border border-light-steel-blue rounded-lg p-6 mb-8">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center">
              <CalendarCheck className="text-electric-blue mr-3" />
              Projected Offer Date
            </h3>
            <div className="flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-electric-blue text-center">
                {projectedOfferDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-4">
            <button type="button" onClick={handleBack} className="flex-1 bg-gray-700 hover:bg-gray-600 border border-light-steel-blue text-white py-4 rounded-lg font-semibold transition-colors flex items-center justify-center">
              <ArrowLeft className="mr-2" />
              Back
            </button>
            <button type="submit" className="flex-2 bg-electric-blue hover:bg-blue-600 text-white py-4 px-8 rounded-lg font-bold text-lg transition-colors flex items-center justify-center">
              <Rocket className="mr-2" />
              Start Tracking My Progress
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



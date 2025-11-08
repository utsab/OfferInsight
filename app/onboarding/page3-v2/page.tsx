'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Info, Coffee, Users, Building2, ArrowLeft, Rocket, Target } from 'lucide-react';

function calculateEstimatedOfferDate(
  appsWithOutreachPerWeek: number,
  linkedinOutreachPerWeek: number,
  inPersonEventsPerMonth: number,
  careerFairsPerYear: number
) {
  let offersPerAppWithOutreach = 0.0025;
  let offersPerLinkedinOutreachAttempt = 0.00075;
  let offersPerInPersonEvent = 0.0075;
  let offersPerCareerFair = 0.1;

  let bonusPoints = 0;

  if (linkedinOutreachPerWeek >= 20) {
    bonusPoints += 20;
  } else if (linkedinOutreachPerWeek >= 12) {
    bonusPoints += 11;
  } else if (linkedinOutreachPerWeek >= 6) {
    bonusPoints += 6;
  } else if (linkedinOutreachPerWeek >= 1) {
    bonusPoints += 1;
  }

  if (inPersonEventsPerMonth >= 8) {
    bonusPoints += 80;
  } else if (inPersonEventsPerMonth >= 4) {
    bonusPoints += 40;
  } else if (inPersonEventsPerMonth >= 2) {
    bonusPoints += 20;
  } else if (inPersonEventsPerMonth >= 1) {
    bonusPoints += 10;
  }

  if (careerFairsPerYear >= 4) {
    bonusPoints += 80;
  } else if (careerFairsPerYear >= 3) {
    bonusPoints += 40;
  } else if (careerFairsPerYear >= 2) {
    bonusPoints += 20;
  } else if (careerFairsPerYear >= 1) {
    bonusPoints += 10;
  }

  const a = 2.0;
  const b = 0.01;
  const multiplier = 3 - a * Math.exp(-b * bonusPoints);

  offersPerAppWithOutreach *= multiplier;
  offersPerLinkedinOutreachAttempt *= multiplier;
  offersPerInPersonEvent *= multiplier;
  offersPerCareerFair *= multiplier;

  const totalOffersPerWeek =
    appsWithOutreachPerWeek * offersPerAppWithOutreach +
    linkedinOutreachPerWeek * offersPerLinkedinOutreachAttempt +
    inPersonEventsPerMonth * offersPerInPersonEvent +
    (careerFairsPerYear / 52) * offersPerCareerFair;

  if (!Number.isFinite(totalOffersPerWeek) || totalOffersPerWeek <= 0) {
    return new Date(); //to do: handle error case more gracefully
  }

  const totalWeeks = 3 + 1 / totalOffersPerWeek;
  const referenceDate = new Date(); //to do: handle case where user comes back to this page at a later date to edit their plan, we may want to use a earlier reference date
  return new Date(referenceDate.getTime() + totalWeeks * 7 * 24 * 60 * 60 * 1000);
}

function calculateWeeklyHours(appsPerWeek: number, interviewsPerWeek: number, eventsPerMonth: number, fairsPerYear: number) {
  let hoursPerAppWithOutreach = 1;
  let hoursPerLinkedinOutreachAttempt = 0.5;
  let hoursPerInPersonEvent = 4/4.33;
  let hoursPerCareerFair = 10/26; //We are assuming that the average projected offer date is 6 months into the future, so they only have 26 weeks to attends the target number of career fairs

  return Math.round(appsPerWeek * hoursPerAppWithOutreach + interviewsPerWeek * hoursPerLinkedinOutreachAttempt + eventsPerMonth * hoursPerInPersonEvent + fairsPerYear * hoursPerCareerFair);
}

export default function Page3V2() {
  const router = useRouter();

  // Goals (sliders)
  const [appsPerWeek, setAppsPerWeek] = useState<number>(5);
  const [interviewsPerWeek, setInterviewsPerWeek] = useState<number>(2);
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
        if (typeof user.appsWithOutreachPerWeek === 'number') {
          setAppsPerWeek(user.appsWithOutreachPerWeek);
        }
        if (typeof user.linkedinOutreachPerWeek === 'number') {
          setInterviewsPerWeek(user.linkedinOutreachPerWeek);
        }
        if (typeof user.inPersonEventsPerMonth === 'number') {
          setEventsPerMonth(user.inPersonEventsPerMonth);
        }
        if (typeof user.careerFairsPerYear === 'number') {
          setFairsPerYear(user.careerFairsPerYear);
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
  const projectedOfferDate = useMemo(
    () =>
      calculateEstimatedOfferDate(
        appsPerWeek,
        interviewsPerWeek,
        eventsPerMonth,
        fairsPerYear
      ),
    [appsPerWeek, interviewsPerWeek, eventsPerMonth, fairsPerYear]
  );

  const weeklyHours = Math.round(hoursPerWeek);

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
        appsWithOutreachPerWeek: appsPerWeek,
        linkedinOutreachPerWeek: interviewsPerWeek,
        inPersonEventsPerMonth: eventsPerMonth,
        careerFairsPerYear: fairsPerYear,
        projectedOfferDate: projectedOfferDate.toISOString()
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

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-6 mb-8">
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

          {/* Projected Outcome */}
          <div className="bg-gray-700/30 border border-light-steel-blue rounded-lg p-6 mb-8">
            <h3 className="text-white font-bold text-lg mb-6 flex items-center justify-center">
              <Target className="text-electric-blue mr-3" />
              Projected Outcome with Your Custom Plan
            </h3>
            <div className="flex flex-col items-center justify-center gap-6 md:flex-row md:gap-12">
              <div className="text-center bg-gray-800/50 rounded-lg p-6 min-w-[180px]">
                <div className="text-3xl font-bold text-electric-blue mb-2">
                  {projectedOfferDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div className="text-gray-300 text-sm font-medium">Projected Offer Date</div>
              </div>
              <div className="text-center bg-gray-800/50 rounded-lg p-6 min-w-[180px]">
                <div className="text-3xl font-bold text-electric-blue mb-2">{calculateWeeklyHours(appsPerWeek, interviewsPerWeek, eventsPerMonth, fairsPerYear)}</div>
                <div className="text-gray-300 text-sm font-medium">Hours per Week</div>
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



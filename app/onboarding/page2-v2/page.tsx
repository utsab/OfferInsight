'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

type TimelineKey = '3' | '6' | '9' | '12';

const CALCULATOR_DATA: Record<TimelineKey, {
  range: string;
  commitment: string;
  apps: string;
  interviewsOutreach: string;
  events: string;
  fairs: string;
  interviews: number;
  offers: number;
}> = {
  '3': { range: '1-3 Months', commitment: '15 Hours', apps: '5 Weekly', interviewsOutreach: '15 Monthly', events: '4 Monthly', fairs: '1 Yearly', interviews: 25, offers: 2 },
  '6': { range: '4-6 Months', commitment: '10 Hours', apps: '3 Weekly', interviewsOutreach: '10 Monthly', events: '3 Monthly', fairs: '1 Yearly', interviews: 20, offers: 1 },
  '9': { range: '7-9 Months', commitment: '8 Hours', apps: '1 Weekly', interviewsOutreach: '7 Monthly', events: '2 Monthly', fairs: '1 Yearly', interviews: 15, offers: 1 },
  '12': { range: '10-12 Months', commitment: '5 Hours', apps: '1 Weekly', interviewsOutreach: '5 Monthly', events: '1 Monthly', fairs: '1 Yearly', interviews: 10, offers: 1 },
};

export default function Page2V2() {
  const router = useRouter();
  const [selectedTimeline, setSelectedTimeline] = useState<TimelineKey | null>(null);

  const calculator = useMemo(() => {
    if (!selectedTimeline) return null;
    return CALCULATOR_DATA[selectedTimeline];
  }, [selectedTimeline]);

  const handleOptionClick = (value: TimelineKey) => {
    setSelectedTimeline(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTimeline) return;
    
    // Generate the plan based on the selected timeline
    const plan = calculator!;
    
    const response = await fetch('/api/users/onboarding2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        monthsToSecureInternship: parseInt(selectedTimeline),
        commitment: parseInt(plan.commitment),
        apps_with_outreach_per_week: parseInt(plan.apps.split(' ')[0]),
        info_interview_outreach_per_month: parseInt(plan.interviewsOutreach.split(' ')[0]),
        in_person_events_per_month: parseInt(plan.events.split(' ')[0]),
        career_fairs_quota: parseInt(plan.fairs.split(' ')[0])
      }),
    });

    if (response.ok) {
      console.log('User information updated successfully');
      router.push('/onboarding/page3-v2');
    } else {
      console.error('Failed to update user information');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-midnight-blue to-gray-900 flex items-center justify-center p-8">
      <div className="bg-gray-800 border border-light-steel-blue rounded-lg w-auto flex overflow-visible h-[720px]">
        {/* Main content */}
        <div className="flex-grow p-12 flex flex-col justify-between items-center">
          <div>
            <div className="mb-12 text-center">
              <h2 className="text-4xl font-bold text-white mb-8">Cool, now let's set goals</h2>
              <p className="text-gray-300 text-lg">How many months do you have to secure an internship?</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-10">
                <div className="flex justify-center space-x-4 mb-10">
                  <button
                    type="button"
                    onClick={() => handleOptionClick('3')}
                    className={`timeline-option border-2 rounded-lg py-3 px-6 text-white font-semibold transition-all duration-200 ${
                      selectedTimeline === '3'
                        ? 'bg-electric-blue border-electric-blue'
                        : 'border-light-steel-blue hover:border-electric-blue'
                    }`}
                    data-months="3"
                    data-range="1-3 Months"
                  >
                    1-3
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOptionClick('6')}
                    className={`timeline-option border-2 rounded-lg py-3 px-6 text-white font-semibold transition-all duration-200 ${
                      selectedTimeline === '6'
                        ? 'bg-electric-blue border-electric-blue'
                        : 'border-light-steel-blue hover:border-electric-blue'
                    }`}
                    data-months="6"
                    data-range="4-6 Months"
                  >
                    4-6
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOptionClick('9')}
                    className={`timeline-option border-2 rounded-lg py-3 px-6 text-white font-semibold transition-all duration-200 ${
                      selectedTimeline === '9'
                        ? 'bg-electric-blue border-electric-blue'
                        : 'border-light-steel-blue hover:border-electric-blue'
                    }`}
                    data-months="9"
                    data-range="7-9 Months"
                  >
                    7-9
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOptionClick('12')}
                    className={`timeline-option border-2 rounded-lg py-3 px-6 text-white font-semibold transition-all duration-200 ${
                      selectedTimeline === '12'
                        ? 'bg-electric-blue border-electric-blue'
                        : 'border-light-steel-blue hover:border-electric-blue'
                    }`}
                    data-months="12"
                    data-range="10-12 Months"
                  >
                    10-12
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="bg-electric-blue hover:bg-blue-600 text-white px-12 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full max-w-xs text-lg mx-auto block"
                  disabled={!selectedTimeline}
                >
                  Continue
                </button>
              </div>
            </form>
          </div>

          <div className="flex items-center space-x-2 mt-12">
            <div className="h-1.5 w-16 bg-gray-600 rounded-full"></div>
            <div className="h-1.5 w-16 bg-electric-blue rounded-full"></div>
            <div className="h-1.5 w-16 bg-gray-600 rounded-full"></div>
          </div>
        </div>

        {/* Success Calculator */}
        <div className="w-max flex-shrink-0 bg-electric-blue p-10 text-white flex flex-col">
          <h3 className="text-2xl font-bold mb-10">Success Calculator</h3>

          <div className="space-y-8 flex-grow">
            <div>
              <p className="text-sm font-semibold text-blue-200 mb-2">TIMELINE</p>
              <div className="flex justify-start items-center whitespace-nowrap gap-6">
                <p className="text-lg">Secure internship within</p>
                <span className="ml-auto text-right bg-blue-800 text-white text-sm font-semibold px-4 py-1.5 rounded-full">
                  {calculator ? calculator.range : '-'}
                </span>
              </div>
            </div>

            <div className="border-t border-blue-500 opacity-50"></div>

            <div>
              <p className="text-sm font-semibold text-blue-200 mb-2">COMMITMENT</p>
              <div className="flex justify-start items-center whitespace-nowrap gap-6">
                <p className="text-lg">Weekly Commitment</p>
                <span className="ml-auto text-right text-lg font-bold">{calculator ? calculator.commitment : '-'}</span>
              </div>
            </div>

            <div className="border-t border-blue-500 opacity-50"></div>

            <div>
              <p className="text-sm font-semibold text-blue-200 mb-4">ACTIONS</p>
              <div className="space-y-3">
                <div className="flex justify-start items-center text-lg whitespace-nowrap gap-6">
                  <p>Applications with Outreach</p>
                  <span className="ml-auto text-right font-bold">{calculator ? calculator.apps : '-'}</span>
                </div>
                <div className="flex justify-start items-center text-lg whitespace-nowrap gap-6">
                  <p>Coffee Chat Outreach</p>
                  <span className="ml-auto text-right font-bold">{calculator ? calculator.interviewsOutreach : '-'}</span>
                </div>
                <div className="flex justify-start items-center text-lg whitespace-nowrap gap-6">
                  <p>In-person Events</p>
                  <span className="ml-auto text-right font-bold">{calculator ? calculator.events : '-'}</span>
                </div>
                <div className="flex justify-start items-center text-lg whitespace-nowrap gap-6">
                  <p>Career Fairs</p>
                  <span className="ml-auto text-right font-bold">{calculator ? calculator.fairs : '-'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-blue-800/50 border border-blue-500 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-200">Interviews</p>
              <p className="text-4xl font-bold">{calculator ? calculator.interviews : '-'}</p>
            </div>
            <div className="bg-blue-800/50 border border-blue-500 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-200">Job Offers</p>
              <p className="text-4xl font-bold">{calculator ? calculator.offers : '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Target, Clock, FileText, Coffee, Users, Building2 } from 'lucide-react';

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
  '3': { range: '1-3 Months', commitment: '15 Hours', apps: '5 Weekly', interviewsOutreach: '15 Monthly', events: '4 Monthly', fairs: '1 Yearly', interviews: 10, offers: 1 },
  '6': { range: '4-6 Months', commitment: '10 Hours', apps: '3 Weekly', interviewsOutreach: '10 Monthly', events: '3 Monthly', fairs: '1 Yearly', interviews: 15, offers: 1 },
  '9': { range: '7-9 Months', commitment: '8 Hours', apps: '1 Weekly', interviewsOutreach: '7 Monthly', events: '2 Monthly', fairs: '1 Yearly', interviews: 20, offers: 1 },
  '12': { range: '10-12 Months', commitment: '5 Hours', apps: '1 Weekly', interviewsOutreach: '5 Monthly', events: '1 Monthly', fairs: '1 Yearly', interviews: 25, offers: 1 },
};

export default function Page2() {
  const router = useRouter();
  const [selectedTimeline, setSelectedTimeline] = useState<TimelineKey | null>(null);

  const calculator = useMemo(() => {
    if (!selectedTimeline) return null;
    return CALCULATOR_DATA[selectedTimeline];
  }, [selectedTimeline]);

  const handleOptionClick = (value: TimelineKey) => {
    setSelectedTimeline(value);
  };

  const handleBack = () => router.back();

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
        appsWithOutreachPerWeek: parseInt(plan.apps.split(' ')[0]),
        linkedinOutreachPerWeek: parseInt(plan.interviewsOutreach.split(' ')[0]),
        inPersonEventsPerMonth: parseInt(plan.events.split(' ')[0]),
        careerFairsPerYear: parseInt(plan.fairs.split(' ')[0])
      }),
    });

    if (response.ok) {
      console.log('User information updated successfully');
      router.push('/onboarding/page3');
    } else {
      console.error('Failed to update user information');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-midnight-blue to-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-10 w-[700px] max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white">Cool, now let's set goals</h2>
          <p className="text-gray-300 mt-2">How many months do you have to secure an internship?</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Timeline Selection */}
          <div className="mb-8">
            <div className="flex justify-center space-x-4">
              <button
                type="button"
                onClick={() => handleOptionClick('3')}
                className={`border-2 rounded-lg py-4 px-8 text-white font-semibold transition-all ${
                  selectedTimeline === '3'
                    ? 'bg-electric-blue border-electric-blue'
                    : 'bg-gray-700 border-light-steel-blue hover:border-electric-blue'
                }`}
              >
                1-3 Months
              </button>
              <button
                type="button"
                onClick={() => handleOptionClick('6')}
                className={`border-2 rounded-lg py-4 px-8 text-white font-semibold transition-all ${
                  selectedTimeline === '6'
                    ? 'bg-electric-blue border-electric-blue'
                    : 'bg-gray-700 border-light-steel-blue hover:border-electric-blue'
                }`}
              >
                4-6 Months
              </button>
              <button
                type="button"
                onClick={() => handleOptionClick('9')}
                className={`border-2 rounded-lg py-4 px-8 text-white font-semibold transition-all ${
                  selectedTimeline === '9'
                    ? 'bg-electric-blue border-electric-blue'
                    : 'bg-gray-700 border-light-steel-blue hover:border-electric-blue'
                }`}
              >
                7-9 Months
              </button>
              <button
                type="button"
                onClick={() => handleOptionClick('12')}
                className={`border-2 rounded-lg py-4 px-8 text-white font-semibold transition-all ${
                  selectedTimeline === '12'
                    ? 'bg-electric-blue border-electric-blue'
                    : 'bg-gray-700 border-light-steel-blue hover:border-electric-blue'
                }`}
              >
                10-12 Months
              </button>
            </div>
          </div>

          {/* Success Calculator Preview */}
          <div className="bg-gray-700/30 border border-light-steel-blue rounded-lg p-6 mb-8">
            <h3 className="text-white font-bold text-lg mb-6 flex items-center justify-center">
              <Target className="text-electric-blue mr-3" />
              Your Action Plan Preview
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-300 mb-1">Timeline</div>
                <div className="text-xl font-bold text-electric-blue">{calculator?.range || '-'}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-300 mb-1 flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  Weekly Commitment
                </div>
                <div className="text-xl font-bold text-electric-blue">{calculator?.commitment || '-'}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-300 mb-1 flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Applications
                </div>
                <div className="text-xl font-bold text-electric-blue">{calculator?.apps || '-'}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-300 mb-1 flex items-center">
                  <Coffee className="mr-2 h-4 w-4" />
                  LinkedIn Outreach
                </div>
                <div className="text-xl font-bold text-electric-blue">{calculator?.interviewsOutreach || '-'}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-300 mb-1 flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  In-Person Events
                </div>
                <div className="text-xl font-bold text-electric-blue">{calculator?.events || '-'}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-300 mb-1 flex items-center">
                  <Building2 className="mr-2 h-4 w-4" />
                  Career Fairs
                </div>
                <div className="text-xl font-bold text-electric-blue">{calculator?.fairs || '-'}</div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-4">
            <button 
              type="button" 
              onClick={handleBack} 
              className="flex-1 bg-gray-700 hover:bg-gray-600 border border-light-steel-blue text-white py-4 rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="mr-2" />
              Back
            </button>
            <button
              type="submit"
              className="flex-2 bg-electric-blue hover:bg-blue-600 text-white py-4 px-8 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={!selectedTimeline}
            >
              Continue
            </button>
          </div>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-center mt-6">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-electric-blue rounded-full"></div>
              <div className="w-3 h-3 bg-electric-blue rounded-full"></div>
              <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
            </div>
            <span className="text-gray-400 ml-3 text-sm">Step 2 of 3</span>
          </div>
        </form>
      </div>
    </div>
  );
}



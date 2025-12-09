import { Gauge, FileText, MessageCircle, Users, Code, CalendarCheck } from 'lucide-react';
import Link from 'next/link';

type OverviewTabProps = {
  targetOfferDateText: string;
  projectedOfferDateText: string;
  applicationsMetrics: {
    count: number;
    goal: number;
    percentage: number;
    statusText: string;
    statusTextColor: string;
    statusDotClass: string;
    statusBarClass: string;
  };
  applicationsAllTimeCount: number;
  linkedinOutreachMetrics: {
    count: number;
    goal: number;
    percentage: number;
    statusText: string;
    statusTextColor: string;
    statusDotClass: string;
    statusBarClass: string;
  };
  linkedinOutreachAllTimeCount: number;
  eventsMetrics: {
    count: number;
    totalCount: number;
    goal: number;
    percentage: number;
    statusText: string;
    statusTextColor: string;
    statusDotClass: string;
    statusBarClass: string;
  };
  eventsAllTimeCount: number;
  leetMetrics: {
    count: number;
    goal: number;
    percentage: number;
    statusText: string;
    statusTextColor: string;
    statusDotClass: string;
    statusBarClass: string;
  };
  leetAllTimeCount: number;
  handleHabitCardClick: (cardId: string) => void;
};

export default function OverviewTab({
  targetOfferDateText,
  projectedOfferDateText,
  applicationsMetrics,
  applicationsAllTimeCount,
  linkedinOutreachMetrics,
  linkedinOutreachAllTimeCount,
  eventsMetrics,
  eventsAllTimeCount,
  leetMetrics,
  leetAllTimeCount,
  handleHabitCardClick,
}: OverviewTabProps) {
  return (
    <div>
      {/* Target Offer Date (question-box styling) */}
      <section className="bg-gray-700 border border-light-steel-blue rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white font-bold text-lg flex items-center">
            <CalendarCheck className="text-electric-blue mr-3" />
            Offer Date Forecast
          </h2>
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:gap-8">
          <div className="flex-1 rounded-lg bg-gray-800/60 border border-electric-blue/20 p-4 text-center">
            <div className="text-sm uppercase tracking-widest text-gray-400 mb-2">Target Offer Date</div>
            <div className="text-4xl md:text-5xl font-bold text-electric-blue">{targetOfferDateText}</div>
          </div>
          <div className="flex-1 rounded-lg bg-gray-800/60 border border-purple-400/30 p-4 text-center">
            <div className="text-sm uppercase tracking-widest text-gray-400 mb-2">Projected Offer Date</div>
            <div className="text-4xl md:text-5xl font-bold text-purple-300">{projectedOfferDateText}</div>
            <div className="text-xs text-gray-400 mt-2">Based on previous month's habits</div>
          </div>
        </div>
        <div className="mt-2 text-left">
          <Link href="/onboarding/page3" className="text-sm text-gray-300 hover:text-white underline underline-offset-2">
            Fine-tune your plan
          </Link>
        </div>
      </section>

      {/* Habit Overview Section */}
      <section>
        <h3 className="text-2xl font-bold text-white mb-6">Habit Overview</h3>
        <div className="grid grid-cols-4 gap-6">
          <div 
            onClick={() => handleHabitCardClick('applications')}
            className="bg-gray-800 border border-light-steel-blue rounded-lg p-6 hover:border-electric-blue transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FileText className="text-electric-blue text-xl" />
                <h4 className="text-white font-semibold">Applications</h4>
              </div>
              <div className={`w-3 h-3 ${applicationsMetrics.statusDotClass} rounded-full`}></div>
            </div>
            <div className="flex items-end justify-between mb-1">
              <div>
                <div className="text-3xl font-bold text-white">{applicationsMetrics.count}</div>
                <div className="text-sm text-gray-400">This month</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-300">{applicationsAllTimeCount}</div>
                <div className="text-xs text-gray-500">All Time</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm mt-3">
              <span className="text-gray-400">Goal: {applicationsMetrics.goal || '—'}</span>
              {applicationsMetrics.goal > 0 && (
                <span className={applicationsMetrics.statusTextColor}>{applicationsMetrics.statusText}</span>
              )}
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
              <div 
                className={`${applicationsMetrics.statusBarClass} h-2 rounded-full`} 
                style={{width: `${applicationsMetrics.percentage}%`}}
              ></div>
            </div>
          </div>

          <div 
            onClick={() => handleHabitCardClick('interviews')}
            className="bg-gray-800 border border-light-steel-blue rounded-lg p-6 hover:border-electric-blue transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <MessageCircle className="text-electric-blue text-xl" />
                <h4 className="text-white font-semibold">Coffee Chats</h4>
              </div>
              <div className={`w-3 h-3 ${linkedinOutreachMetrics.statusDotClass} rounded-full`}></div>
            </div>
            <div className="flex items-end justify-between mb-1">
              <div>
                <div className="text-3xl font-bold text-white">{linkedinOutreachMetrics.count}</div>
                <div className="text-sm text-gray-400">This month</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-300">{linkedinOutreachAllTimeCount}</div>
                <div className="text-xs text-gray-500">All Time</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm mt-3">
              <span className="text-gray-400">Goal: {linkedinOutreachMetrics.goal || '—'}</span>
              {linkedinOutreachMetrics.goal > 0 && (
                <span className={linkedinOutreachMetrics.statusTextColor}>{linkedinOutreachMetrics.statusText}</span>
              )}
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
              <div 
                className={`${linkedinOutreachMetrics.statusBarClass} h-2 rounded-full`} 
                style={{width: `${linkedinOutreachMetrics.percentage}%`}}
              ></div>
            </div>
          </div>

          <div 
            onClick={() => handleHabitCardClick('events')}
            className="bg-gray-800 border border-light-steel-blue rounded-lg p-6 hover:border-electric-blue transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Users className="text-electric-blue text-xl" />
                <h4 className="text-white font-semibold">Events</h4>
              </div>
              <div className={`w-3 h-3 ${eventsMetrics.statusDotClass} rounded-full`}></div>
            </div>
            <div className="flex items-end justify-between mb-1">
              <div>
                <div className="text-3xl font-bold text-white">{eventsMetrics.totalCount ?? eventsMetrics.count}</div>
                <div className="text-sm text-gray-400">This month</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-300">{eventsAllTimeCount}</div>
                <div className="text-xs text-gray-500">All Time</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm mt-3">
              <span className="text-gray-400">Goal: {eventsMetrics.goal || '—'}</span>
              {eventsMetrics.goal > 0 && (
                <span className={eventsMetrics.statusTextColor}>{eventsMetrics.statusText}</span>
              )}
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
              <div 
                className={`${eventsMetrics.statusBarClass} h-2 rounded-full`} 
                style={{width: `${eventsMetrics.percentage}%`}}
              ></div>
            </div>
          </div>

          <div 
            onClick={() => handleHabitCardClick('leetcode')}
            className="bg-gray-800 border border-light-steel-blue rounded-lg p-6 hover:border-electric-blue transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Code className="text-electric-blue text-xl" />
                <h4 className="text-white font-semibold">LeetCode</h4>
              </div>
              <div className={`w-3 h-3 ${leetMetrics.statusDotClass} rounded-full`}></div>
            </div>
            <div className="flex items-end justify-between mb-1">
              <div>
                <div className="text-3xl font-bold text-white">{leetMetrics.count}</div>
                <div className="text-sm text-gray-400">This month</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-300">{leetAllTimeCount}</div>
                <div className="text-xs text-gray-500">All Time</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm mt-3">
              <span className="text-gray-400">Goal: {leetMetrics.goal}</span>
              <span className={leetMetrics.statusTextColor}>{leetMetrics.statusText}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
              <div 
                className={`${leetMetrics.statusBarClass} h-2 rounded-full`} 
                style={{width: `${leetMetrics.percentage}%`}}
              ></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


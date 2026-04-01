import { FileText, MessageCircle, Users, GitBranch } from 'lucide-react';

type OverviewTabProps = {
  openSourceSnapshot: {
    activePartnershipName: string;
    completedCriteria: number;
    totalCriteria: number;
    monthDoneCount: number;
    inProgressCount: number;
    weekDoneCount: number;
    issuesCompleted: number;
    completedPartnerships: number;
  };
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
  handleHabitCardClick: (cardId: string) => void;
};

export default function OverviewTab({
  openSourceSnapshot,
  applicationsMetrics,
  applicationsAllTimeCount,
  linkedinOutreachMetrics,
  linkedinOutreachAllTimeCount,
  eventsMetrics,
  eventsAllTimeCount,
  handleHabitCardClick,
}: OverviewTabProps) {
  return (
    <div>
      {/* Open Source Snapshot */}
      <section className="bg-gray-700 border border-light-steel-blue rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white font-bold text-lg flex items-center">
            <GitBranch className="text-electric-blue mr-3" />
            Open Source Snapshot
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="space-y-3">
            <div className="rounded-lg bg-gray-800/60 border border-electric-blue/20 p-3 min-h-[112px] flex flex-col justify-between">
              <div className="text-xs uppercase tracking-widest text-gray-400 mb-1">Active Partnership</div>
              <div className="text-xl md:text-2xl font-bold text-electric-blue">{openSourceSnapshot.activePartnershipName}</div>
              <div className="text-xs text-gray-400 mt-1">
                {openSourceSnapshot.weekDoneCount > 0 ? 'Active this week' : 'No done activity this week'}
              </div>
            </div>
            <div className="rounded-lg bg-gray-800/60 border border-light-steel-blue p-3 min-h-[112px] flex flex-col justify-between">
              <div className="text-xs uppercase tracking-widest text-gray-400 mb-1">Criteria Progress</div>
              <div className="text-3xl font-bold text-white">
                {openSourceSnapshot.completedCriteria}/{openSourceSnapshot.totalCriteria || 0}
              </div>
              <div className="text-xs text-gray-400 mt-1">Completed required criteria units</div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-lg bg-gray-800/60 border border-light-steel-blue p-3 min-h-[112px] flex flex-col justify-between">
              <div className="text-xs text-gray-400">Done This Month</div>
              <div className="text-2xl font-bold text-white">{openSourceSnapshot.monthDoneCount}</div>
            </div>
            <div className="rounded-lg bg-gray-800/60 border border-light-steel-blue p-3 min-h-[112px] flex flex-col justify-between">
              <div className="text-xs text-gray-400">Cards In Progress</div>
              <div className="text-2xl font-bold text-white">{openSourceSnapshot.inProgressCount}</div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-lg bg-gray-800/60 border border-light-steel-blue p-3 min-h-[112px] flex flex-col justify-between">
              <div className="text-xs text-gray-400">Issues Completed (across all partnerships)</div>
              <div className="text-2xl font-bold text-white">{openSourceSnapshot.issuesCompleted}</div>
            </div>
            <div className="rounded-lg bg-gray-800/60 border border-light-steel-blue p-3 min-h-[112px] flex flex-col justify-between">
              <div className="text-xs text-gray-400">Partnerships Completed</div>
              <div className="text-2xl font-bold text-white">{openSourceSnapshot.completedPartnerships}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Habit Overview Section */}
      <section>
        <h3 className="text-2xl font-bold text-white mb-6">Habit Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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

        </div>
      </section>
    </div>
  );
}


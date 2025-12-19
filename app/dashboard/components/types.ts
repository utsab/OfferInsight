// Shared types for dashboard components

export type ApplicationStatus = 'applied' | 'messagedRecruiter' | 'messagedHiringManager' | 'followedUp' | 'interview';
export type ApplicationColumnId = 'applied' | 'messagedRecruiter' | 'messagedHiringManager' | 'followedUp' | 'interview';

export type LinkedinOutreachStatus = 'outreachRequestSent' | 'accepted' | 'followedUp' | 'linkedinOutreach';
export type LinkedinOutreachColumnId = 'outreach' | 'accepted' | 'followedUpLinkedin' | 'linkedinOutreach';

export type InPersonEventStatus = 'scheduled' | 'attended' | 'linkedinRequestsSent' | 'followUp';
export type EventColumnId = 'upcoming' | 'attended' | 'linkedinRequestsSent' | 'followups';

export type LeetStatus = 'planned' | 'solved' | 'reflected';
export type LeetColumnId = 'planned' | 'solved' | 'reflected';

export type BoardTimeFilter = 'createdThisMonth' | 'completedThisMonth' | 'allTime';

export type Application = {
  id: number;
  company: string;
  hiringManager?: string | null;
  msgToManager?: string | null;
  recruiter?: string | null;
  msgToRecruiter?: string | null;
  notes?: string | null;
  status: ApplicationStatus;
  dateCreated: string;
  dateModified?: string | null;
  userId: string;
};

export type LinkedinOutreach = {
  id: number;
  name: string;
  company: string;
  message?: string | null;
  linkedInUrl?: string | null;
  notes?: string | null;
  status: LinkedinOutreachStatus;
  dateCreated: string;
  dateModified?: string | null;
  recievedReferral: boolean;
  userId: string;
};

export type InPersonEvent = {
  id: number;
  event: string;
  date: string;
  location?: string | null;
  url?: string | null;
  notes?: string | null;
  status: InPersonEventStatus;
  numPeopleSpokenTo?: number | null;
  numLinkedInRequests?: number | null;
  careerFair: boolean;
  numOfInterviews?: number | null;
  userId: string;
  dateCreated?: string;
  dateModified?: string | null;
};

export type LeetEntry = {
  id: number;
  problem?: string | null;
  problemType?: string | null;
  difficulty?: string | null;
  url?: string | null;
  reflection?: string | null;
  status: LeetStatus;
  userId: string;
  dateCreated?: string;
  dateModified?: string | null;
};

export const APPLICATION_COMPLETION_COLUMNS: ApplicationColumnId[] = [
  'messagedHiringManager',
  'messagedRecruiter',
  'followedUp',
  'interview',
];

export const LINKEDIN_COMPLETION_COLUMNS: LinkedinOutreachColumnId[] = [
  'outreach',
  'accepted',
  'followedUpLinkedin',
  'linkedinOutreach',
];

export const EVENT_COMPLETION_COLUMNS: EventColumnId[] = ['attended', 'linkedinRequestsSent', 'followups'];
export const LEET_COMPLETION_COLUMNS: LeetColumnId[] = ['reflected'];

export const applicationStatusToColumn: Record<ApplicationStatus, ApplicationColumnId> = {
  applied: 'applied',
  messagedRecruiter: 'messagedRecruiter',
  messagedHiringManager: 'messagedHiringManager',
  followedUp: 'followedUp',
  interview: 'interview',
};

export const applicationColumnToStatus: Record<ApplicationColumnId, ApplicationStatus> = {
  applied: 'applied',
  messagedRecruiter: 'messagedRecruiter',
  messagedHiringManager: 'messagedHiringManager',
  followedUp: 'followedUp',
  interview: 'interview',
};

export const linkedinOutreachStatusToColumn: Record<LinkedinOutreachStatus, LinkedinOutreachColumnId> = {
  outreachRequestSent: 'outreach',
  accepted: 'accepted',
  followedUp: 'followedUpLinkedin',
  linkedinOutreach: 'linkedinOutreach',
};

export const linkedinOutreachColumnToStatus: Record<LinkedinOutreachColumnId, LinkedinOutreachStatus> = {
  outreach: 'outreachRequestSent',
  accepted: 'accepted',
  followedUpLinkedin: 'followedUp',
  linkedinOutreach: 'linkedinOutreach',
};

export const eventStatusToColumn: Record<InPersonEventStatus, EventColumnId> = {
  scheduled: 'upcoming',
  attended: 'attended',
  linkedinRequestsSent: 'linkedinRequestsSent',
  followUp: 'followups',
};

export const eventColumnToStatus: Record<EventColumnId, InPersonEventStatus> = {
  upcoming: 'scheduled',
  attended: 'attended',
  linkedinRequestsSent: 'linkedinRequestsSent',
  followups: 'followUp',
};

export const leetStatusToColumn: Record<LeetStatus, LeetColumnId> = {
  planned: 'planned',
  solved: 'solved',
  reflected: 'reflected',
};

export const leetColumnToStatus: Record<LeetColumnId, LeetStatus> = {
  planned: 'planned',
  solved: 'solved',
  reflected: 'reflected',
};


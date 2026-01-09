// Shared types for dashboard components

export type ApplicationStatus = 'applying' | 'messagingRecruiter' | 'messagingHiringManager' | 'followingUp' | 'interviewing';
export type ApplicationColumnId = 'applying' | 'messagingRecruiter' | 'messagingHiringManager' | 'followingUp' | 'interviewing';

export type LinkedinOutreachStatus = 'sendingOutreachRequest' | 'acceptingRequest' | 'followingUp' | 'linkedinOutreach';
export type LinkedinOutreachColumnId = 'outreach' | 'accepted' | 'followedUpLinkedin' | 'linkedinOutreach';

export type InPersonEventStatus = 'scheduling' | 'attending' | 'sendingLinkedInRequests' | 'followingUp';
export type EventColumnId = 'upcoming' | 'attended' | 'linkedinRequestsSent' | 'followups';

export type LeetStatus = 'planning' | 'solving' | 'reflecting';
export type LeetColumnId = 'planned' | 'solved' | 'reflected';

export type BoardTimeFilter = 'modifiedThisMonth' | 'allTime';

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
  'messagingHiringManager',
  'messagingRecruiter',
  'followingUp',
  'interviewing',
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
  applying: 'applying',
  messagingRecruiter: 'messagingRecruiter',
  messagingHiringManager: 'messagingHiringManager',
  followingUp: 'followingUp',
  interviewing: 'interviewing',
};

export const applicationColumnToStatus: Record<ApplicationColumnId, ApplicationStatus> = {
  applying: 'applying',
  messagingRecruiter: 'messagingRecruiter',
  messagingHiringManager: 'messagingHiringManager',
  followingUp: 'followingUp',
  interviewing: 'interviewing',
};

export const linkedinOutreachStatusToColumn: Record<LinkedinOutreachStatus, LinkedinOutreachColumnId> = {
  sendingOutreachRequest: 'outreach',
  acceptingRequest: 'accepted',
  followingUp: 'followedUpLinkedin',
  linkedinOutreach: 'linkedinOutreach',
};

export const linkedinOutreachColumnToStatus: Record<LinkedinOutreachColumnId, LinkedinOutreachStatus> = {
  outreach: 'sendingOutreachRequest',
  accepted: 'acceptingRequest',
  followedUpLinkedin: 'followingUp',
  linkedinOutreach: 'linkedinOutreach',
};

export const eventStatusToColumn: Record<InPersonEventStatus, EventColumnId> = {
  scheduling: 'upcoming',
  attending: 'attended',
  sendingLinkedInRequests: 'linkedinRequestsSent',
  followingUp: 'followups',
};

export const eventColumnToStatus: Record<EventColumnId, InPersonEventStatus> = {
  upcoming: 'scheduling',
  attended: 'attending',
  linkedinRequestsSent: 'sendingLinkedInRequests',
  followups: 'followingUp',
};

export const leetStatusToColumn: Record<LeetStatus, LeetColumnId> = {
  planning: 'planned',
  solving: 'solved',
  reflecting: 'reflected',
};

export const leetColumnToStatus: Record<LeetColumnId, LeetStatus> = {
  planned: 'planning',
  solved: 'solving',
  reflected: 'reflecting',
};


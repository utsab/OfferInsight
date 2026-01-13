// Shared types for dashboard components

export type ApplicationStatus = 'apply' | 'messageRecruiter' | 'messageHiringManager' | 'followUp' | 'interview';
export type ApplicationColumnId = 'apply' | 'messageRecruiter' | 'messageHiringManager' | 'followUp' | 'interview';

export type LinkedinOutreachStatus = 'sendingOutreachRequest' | 'acceptingRequest' | 'followingUp' | 'linkedinOutreach' | 'askingForReferral';
export type LinkedinOutreachColumnId = 'outreach' | 'accepted' | 'followedUpLinkedin' | 'linkedinOutreach' | 'askingForReferral';

export type InPersonEventStatus = 'scheduling' | 'attending' | 'sendingLinkedInRequests' | 'followingUp';
export type EventColumnId = 'upcoming' | 'attended' | 'linkedinRequestsSent' | 'followups';

export type LeetStatus = 'planning' | 'solving' | 'reflecting';
export type LeetColumnId = 'planned' | 'solved' | 'reflected';

export type BoardTimeFilter = 'modifiedThisMonth' | 'allTime';

export type Application = {
  id: number;
  company: string;
  linkToJobPosting?: string | null;
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
  firstMessage?: string | null;
  secondMessage?: string | null;
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
  nameOfPersonSpokenTo?: string | null;
  sentLinkedInRequest: boolean;
  careerFair: boolean;
  followUpMessage?: string | null;
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
  'messageHiringManager',
  'messageRecruiter',
  'followUp',
  'interview',
];

export const LINKEDIN_COMPLETION_COLUMNS: LinkedinOutreachColumnId[] = [
  'outreach',
  'accepted',
  'followedUpLinkedin',
  'linkedinOutreach',
  'askingForReferral',
];

export const EVENT_COMPLETION_COLUMNS: EventColumnId[] = ['attended', 'linkedinRequestsSent', 'followups'];
export const LEET_COMPLETION_COLUMNS: LeetColumnId[] = ['reflected'];

export const applicationStatusToColumn: Record<ApplicationStatus, ApplicationColumnId> = {
  apply: 'apply',
  messageRecruiter: 'messageRecruiter',
  messageHiringManager: 'messageHiringManager',
  followUp: 'followUp',
  interview: 'interview',
};

export const applicationColumnToStatus: Record<ApplicationColumnId, ApplicationStatus> = {
  apply: 'apply',
  messageRecruiter: 'messageRecruiter',
  messageHiringManager: 'messageHiringManager',
  followUp: 'followUp',
  interview: 'interview',
};

export const linkedinOutreachStatusToColumn: Record<LinkedinOutreachStatus, LinkedinOutreachColumnId> = {
  sendingOutreachRequest: 'outreach',
  acceptingRequest: 'accepted',
  followingUp: 'followedUpLinkedin',
  linkedinOutreach: 'linkedinOutreach',
  askingForReferral: 'askingForReferral',
};

export const linkedinOutreachColumnToStatus: Record<LinkedinOutreachColumnId, LinkedinOutreachStatus> = {
  outreach: 'sendingOutreachRequest',
  accepted: 'acceptingRequest',
  followedUpLinkedin: 'followingUp',
  linkedinOutreach: 'linkedinOutreach',
  askingForReferral: 'askingForReferral',
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


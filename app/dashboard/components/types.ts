// Shared types for dashboard components

export type ApplicationStatus = 'apply' | 'messageRecruiter' | 'messageHiringManager' | 'followUp' | 'interview';
export type ApplicationColumnId = 'apply' | 'messageRecruiter' | 'messageHiringManager' | 'followUp' | 'interview';

export type LinkedinOutreachStatus = 'prospects' | 'sendFirstMessage' | 'requestAccepted' | 'followUp' | 'coffeeChat' | 'askForReferral';
export type LinkedinOutreachColumnId = 'prospects' | 'sendFirstMessage' | 'requestAccepted' | 'followUp' | 'coffeeChat' | 'askForReferral';

export type InPersonEventStatus = 'plan' | 'attended' | 'sendLinkedInRequest' | 'followUp';
export type EventColumnId = 'plan' | 'attended' | 'sendLinkedInRequest' | 'followUp';

export type LeetStatus = 'plan' | 'solved' | 'reflect';
export type LeetColumnId = 'plan' | 'solved' | 'reflect';

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
  'prospects',
  'sendFirstMessage',
  'requestAccepted',
  'followUp',
  'coffeeChat',
  'askForReferral',
];

export const EVENT_COMPLETION_COLUMNS: EventColumnId[] = ['attended', 'sendLinkedInRequest', 'followUp'];
export const LEET_COMPLETION_COLUMNS: LeetColumnId[] = ['reflect'];

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
  prospects: 'prospects',
  sendFirstMessage: 'sendFirstMessage',
  requestAccepted: 'requestAccepted',
  followUp: 'followUp',
  coffeeChat: 'coffeeChat',
  askForReferral: 'askForReferral',
};

export const linkedinOutreachColumnToStatus: Record<LinkedinOutreachColumnId, LinkedinOutreachStatus> = {
  prospects: 'prospects',
  sendFirstMessage: 'sendFirstMessage',
  requestAccepted: 'requestAccepted',
  followUp: 'followUp',
  coffeeChat: 'coffeeChat',
  askForReferral: 'askForReferral',
};

export const eventStatusToColumn: Record<InPersonEventStatus, EventColumnId> = {
  plan: 'plan',
  attended: 'attended',
  sendLinkedInRequest: 'sendLinkedInRequest',
  followUp: 'followUp',
};

export const eventColumnToStatus: Record<EventColumnId, InPersonEventStatus> = {
  plan: 'plan',
  attended: 'attended',
  sendLinkedInRequest: 'sendLinkedInRequest',
  followUp: 'followUp',
};

export const leetStatusToColumn: Record<LeetStatus, LeetColumnId> = {
  plan: 'plan',
  solved: 'solved',
  reflect: 'reflect',
};

export const leetColumnToStatus: Record<LeetColumnId, LeetStatus> = {
  plan: 'plan',
  solved: 'solved',
  reflect: 'reflect',
};


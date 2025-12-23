'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent, type DragOverEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Gauge, FileText, MessageCircle, Users, Code, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import OverviewTab from './components/OverviewTab';
import ApplicationsTab from './components/ApplicationsTab';
import CoffeeChatsTab from './components/CoffeeChatsTab';
import EventsTab from './components/EventsTab';
import LeetCodeTab from './components/LeetCodeTab';
import { getHeadersWithTimezone } from '@/app/lib/api-helpers';

const hourOptions = ['01','02','03','04','05','06','07','08','09','10','11','12'];
const minuteOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

// ===== PROJECTED OFFER DATE FORMULA START =====
// Copied from onboarding page3 so product engineers can tweak independently.
function calculateProjectedOfferDate(
  appsWithOutreachPerWeek: number,
  linkedinOutreachPerWeek: number,
  inPersonEventsPerMonth: number,
  careerFairsPerYear: number,
  referenceDate?: Date
): Date | null {
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
    return null;
  }

  const totalWeeks = 3 + 1 / totalOffersPerWeek;
  const baseDate = referenceDate ?? new Date();
  return new Date(baseDate.getTime() + totalWeeks * 7 * 24 * 60 * 60 * 1000);
}
// ===== PROJECTED OFFER DATE FORMULA END =====

// ===== MOCK DATA FEATURE TOGGLE START =====
// Toggle this flag or comment out the seeding effect below to disable mock data.
const ENABLE_DASHBOARD_MOCKS = false;
// ===== MOCK DATA FEATURE TOGGLE END =====

// ===== DATE FIELD EDITING TOGGLE START =====
// Toggle this flag to enable editing dateCreated and dateModified in create/edit modals for testing and debugging.
// When enabled, date input fields will appear in all modals allowing you to set/change the dateCreated and dateModified values.
// The dates will be properly saved to the database as DateTime when creating or updating records.
const ENABLE_DATE_FIELD_EDITING = false;
// ===== DATE FIELD EDITING TOGGLE END =====

type TimeParts = {
  hour: string;
  minute: string;
  period: 'AM' | 'PM';
};

const toLocalTimeParts = (value: string): TimeParts => {
  try {
    const date = new Date(value);
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return {
      hour: String(hours).padStart(2, '0'),
      minute: minutes,
      period,
    };
  } catch {
    return {
      hour: '',
      minute: '',
      period: 'AM',
    };
  }
};

type ApplicationStatus = 'applied' | 'messagedRecruiter' | 'messagedHiringManager' | 'followedUp' | 'interview';
type ApplicationColumnId = 'applied' | 'messagedRecruiter' | 'messagedHiringManager' | 'followedUp' | 'interview';

type LinkedinOutreachStatus = 'outreachRequestSent' | 'accepted' | 'followedUp' | 'linkedinOutreach';
type LinkedinOutreachColumnId = 'outreach' | 'accepted' | 'followedUpLinkedin' | 'linkedinOutreach';

type InPersonEventStatus = 'scheduled' | 'attended' | 'linkedinRequestsSent' | 'followUp';
type EventColumnId = 'upcoming' | 'attended' | 'linkedinRequestsSent' | 'followups';

type LeetStatus = 'planned' | 'solved' | 'reflected';
type LeetColumnId = 'planned' | 'solved' | 'reflected';

type BoardTimeFilter = 'modifiedThisMonth' | 'allTime';

const APPLICATION_COMPLETION_COLUMNS: ApplicationColumnId[] = [
  'messagedHiringManager',
  'messagedRecruiter',
  'followedUp',
  'interview',
];
const LINKEDIN_COMPLETION_COLUMNS: LinkedinOutreachColumnId[] = [
  'outreach',
  'accepted',
  'followedUpLinkedin',
  'linkedinOutreach',
];
const EVENT_COMPLETION_COLUMNS: EventColumnId[] = ['attended', 'linkedinRequestsSent', 'followups'];
const LEET_COMPLETION_COLUMNS: LeetColumnId[] = ['reflected'];

// Application type definition
type Application = {
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

// Linkedin outreach type definition
type LinkedinOutreach = {
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

type InPersonEvent = {
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

type LeetEntry = {
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

// Map status values to column IDs (moved outside component to prevent re-renders)
const applicationStatusToColumn: Record<ApplicationStatus, ApplicationColumnId> = {
  applied: 'applied',
  messagedRecruiter: 'messagedRecruiter',
  messagedHiringManager: 'messagedHiringManager',
  followedUp: 'followedUp',
  interview: 'interview',
};

const applicationColumnToStatus: Record<ApplicationColumnId, ApplicationStatus> = {
  applied: 'applied',
  messagedRecruiter: 'messagedRecruiter',
  messagedHiringManager: 'messagedHiringManager',
  followedUp: 'followedUp',
  interview: 'interview',
};

// Linkedin outreach status mappings
const linkedinOutreachStatusToColumn: Record<LinkedinOutreachStatus, LinkedinOutreachColumnId> = {
  outreachRequestSent: 'outreach',
  accepted: 'accepted',
  followedUp: 'followedUpLinkedin',
  linkedinOutreach: 'linkedinOutreach',
};

const linkedinOutreachColumnToStatus: Record<LinkedinOutreachColumnId, LinkedinOutreachStatus> = {
  outreach: 'outreachRequestSent',
  accepted: 'accepted',
  followedUpLinkedin: 'followedUp',
  linkedinOutreach: 'linkedinOutreach',
};

const eventStatusToColumn: Record<InPersonEventStatus, EventColumnId> = {
  scheduled: 'upcoming',
  attended: 'attended',
  linkedinRequestsSent: 'linkedinRequestsSent',
  followUp: 'followups',
};

const eventColumnToStatus: Record<EventColumnId, InPersonEventStatus> = {
  upcoming: 'scheduled',
  attended: 'attended',
  linkedinRequestsSent: 'linkedinRequestsSent',
  followups: 'followUp',
};

const leetStatusToColumn: Record<LeetStatus, LeetColumnId> = {
  planned: 'planned',
  solved: 'solved',
  reflected: 'reflected',
};

const leetColumnToStatus: Record<LeetColumnId, LeetStatus> = {
  planned: 'planned',
  solved: 'solved',
  reflected: 'reflected',
};

export default function Page() {
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get('userId');
  const [viewedUserName, setViewedUserName] = useState<string | null>(null);
  const [isInstructor, setIsInstructor] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [targetOfferDate, setTargetOfferDate] = useState<Date | null>(null);

  // dnd-kit: Applications board state

  const [appColumns, setAppColumns] = useState<Record<ApplicationColumnId, Application[]>>({
    applied: [],
    messagedRecruiter: [],
    messagedHiringManager: [],
    followedUp: [],
    interview: [],
  });
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [applicationsFilter, setApplicationsFilter] = useState<BoardTimeFilter>('allTime');
  const isFetchingRef = useRef(false);
  const lastProjectedOfferSyncRef = useRef<string | null>(null);
  const isDraggingAppRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const fetchApplications = useCallback(async () => {
    // --- MOCK DATA BYPASS FOR APPLICATIONS FETCH START ---
    if (ENABLE_DASHBOARD_MOCKS) return;
    // --- MOCK DATA BYPASS FOR APPLICATIONS FETCH END ---
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) return;
    
    try {
      isFetchingRef.current = true;
      setIsLoading(true);
      const url = userIdParam ? `/api/applications_with_outreach?userId=${userIdParam}` : '/api/applications_with_outreach';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch applications');
      const data = await response.json() as Application[];
      
      // Group applications by status
      const grouped: Record<ApplicationColumnId, Application[]> = {
        applied: [],
        messagedRecruiter: [],
        messagedHiringManager: [],
        followedUp: [],
        interview: [],
      };
      
      data.forEach((app: Application) => {
        const column = applicationStatusToColumn[app.status] || 'applied';
        grouped[column].push(app);
      });
      
      setAppColumns(grouped);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Fetch applications from API (needed for both overview metrics and applications tab)
  useEffect(() => {
    // --- MOCK DATA BYPASS FOR APPLICATIONS EFFECT START ---
    if (ENABLE_DASHBOARD_MOCKS) return;
    // --- MOCK DATA BYPASS FOR APPLICATIONS EFFECT END ---
    if ((activeTab === 'applications' || activeTab === 'overview') && !isFetchingRef.current) {
      fetchApplications();
    }
  }, [activeTab, fetchApplications]);

  const getApplicationColumnOfItem = (id: string): ApplicationColumnId | null => {
    const entry = (Object.keys(appColumns) as ApplicationColumnId[]).find(col => 
      appColumns[col].some(c => String(c.id) === id)
    );
    return entry ?? null;
  };

  // Debounced function to update application status (prevents rapid-fire requests when dragging)
  // Server will automatically set dateModified to current date on PATCH
  const debouncedUpdateApplicationStatus = useDebouncedCallback(
    async (id: number, status: ApplicationStatus) => {
      try {
        const url = userIdParam ? `/api/applications_with_outreach?id=${id}&userId=${userIdParam}` : `/api/applications_with_outreach?id=${id}`;
        const response = await fetch(url, {
          method: 'PATCH',
          headers: getHeadersWithTimezone(),
          body: JSON.stringify({ status }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Failed to update status:', {
            httpStatus: response.status,
            statusText: response.statusText,
            errorData,
            id,
            cardStatus: status
          });
          throw new Error(`Failed to update status: ${response.status} - ${errorData.error || errorData.details || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error updating status:', error);
        fetchApplications();
      }
    },
    300 // Wait 300ms after last change before sending request
  );

  const handleApplicationsDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      isDraggingAppRef.current = false;
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    const fromCol = getApplicationColumnOfItem(activeId);
    const toCol = (['applied','messagedRecruiter','messagedHiringManager','followedUp','interview'] as ApplicationColumnId[]).includes(overId as ApplicationColumnId)
      ? (overId as ApplicationColumnId)
      : getApplicationColumnOfItem(overId);
    if (!fromCol || !toCol) {
      setActiveAppId(null);
      isDraggingAppRef.current = false;
      return;
    }

    // Update UI optimistically
    if (fromCol === toCol) {
      const items = appColumns[fromCol];
      const oldIndex = items.findIndex(i => String(i.id) === activeId);
      const newIndex = items.findIndex(i => String(i.id) === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        setActiveAppId(null);
        isDraggingAppRef.current = false;
        return;
      }
      const newItems = arrayMove(items, oldIndex, newIndex);
      setAppColumns(prev => ({ ...prev, [fromCol]: newItems }));
    } else {
      const fromItems = appColumns[fromCol];
      const toItems = appColumns[toCol];
      const movingIndex = fromItems.findIndex(i => String(i.id) === activeId);
      if (movingIndex === -1) {
        setActiveAppId(null);
        isDraggingAppRef.current = false;
        return;
      }
      const movingItem = fromItems[movingIndex];
      const overIndex = toItems.findIndex(i => String(i.id) === overId);
      const insertIndex = overIndex === -1 ? toItems.length : overIndex;
      const newFrom = [...fromItems.slice(0, movingIndex), ...fromItems.slice(movingIndex + 1)];
      const newStatus = applicationColumnToStatus[toCol];
      const updatedItem: Application = {
        ...movingItem,
        status: newStatus,
        // dateModified will be set automatically by the server on PATCH
      };
      const newTo = [...toItems.slice(0, insertIndex), updatedItem, ...toItems.slice(insertIndex)];
      setAppColumns(prev => ({ ...prev, [fromCol]: newFrom, [toCol]: newTo }));
      
      // Update status in database (debounced to prevent rapid-fire requests)
      // Server will automatically set dateModified to current date on PATCH
      debouncedUpdateApplicationStatus(movingItem.id, newStatus);
    }
    setActiveAppId(null);
    isDraggingAppRef.current = false;
  };

  const handleApplicationsDragStart = (event: DragStartEvent) => {
    setActiveAppId(String(event.active.id));
    isDraggingAppRef.current = true;
  };

  const handleApplicationsDragOver = (event: DragOverEvent) => {
    // onDragOver is only for visual feedback via DroppableColumn
    // State updates should only happen in onDragEnd to prevent infinite loops
    // No state updates here - just let the DroppableColumn handle visual feedback
  };

  // dnd-kit: Linkedin outreach board (Linkedin_Outreach)

const [linkedinOutreachColumns, setLinkedinOutreachColumns] = useState<Record<LinkedinOutreachColumnId, LinkedinOutreach[]>>({
  outreach: [],
  accepted: [],
  followedUpLinkedin: [],
  linkedinOutreach: [],
});
  const [activeLinkedinOutreachId, setActiveLinkedinOutreachId] = useState<string | null>(null);
  const [isLinkedinOutreachModalOpen, setIsLinkedinOutreachModalOpen] = useState(false);
  const [editingLinkedinOutreach, setEditingLinkedinOutreach] = useState<LinkedinOutreach | null>(null);
  const [isDeletingLinkedinOutreach, setIsDeletingLinkedinOutreach] = useState<number | null>(null);
  const [isLoadingLinkedinOutreach, setIsLoadingLinkedinOutreach] = useState(true);
  const [linkedinOutreachFilter, setLinkedinOutreachFilter] = useState<BoardTimeFilter>('allTime');
  const isFetchingLinkedinOutreachRef = useRef(false);
  const isDraggingLinkedinOutreachRef = useRef(false);

  const fetchLinkedinOutreach = useCallback(async () => {
    // --- MOCK DATA BYPASS FOR OUTREACH FETCH START ---
    if (ENABLE_DASHBOARD_MOCKS) return;
    // --- MOCK DATA BYPASS FOR OUTREACH FETCH END ---
    if (isFetchingLinkedinOutreachRef.current) return;

    try {
      isFetchingLinkedinOutreachRef.current = true;
      setIsLoadingLinkedinOutreach(true);
      const url = userIdParam ? `/api/linkedin_outreach?userId=${userIdParam}` : '/api/linkedin_outreach';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch LinkedIn outreach entries');
      const data = await response.json() as LinkedinOutreach[];

      const grouped: Record<LinkedinOutreachColumnId, LinkedinOutreach[]> = {
        outreach: [],
        accepted: [],
        followedUpLinkedin: [],
        linkedinOutreach: [],
      };

      (data as LinkedinOutreach[]).forEach(chat => {
        const column = linkedinOutreachStatusToColumn[chat.status] ?? 'outreach';
        grouped[column].push(chat);
      });

      setLinkedinOutreachColumns(grouped);
    } catch (error) {
      console.error('Error fetching LinkedIn outreach entries:', error);
    } finally {
      setIsLoadingLinkedinOutreach(false);
      isFetchingLinkedinOutreachRef.current = false;
    }
  }, [userIdParam]);

  useEffect(() => {
    // --- MOCK DATA BYPASS FOR OUTREACH EFFECT START ---
    if (ENABLE_DASHBOARD_MOCKS) return;
    // --- MOCK DATA BYPASS FOR OUTREACH EFFECT END ---
    if ((activeTab === 'interviews' || activeTab === 'overview') && !isFetchingLinkedinOutreachRef.current) {
      fetchLinkedinOutreach();
    }
  }, [activeTab, fetchLinkedinOutreach]);

  const getLinkedinOutreachColumnOfItem = (id: string): LinkedinOutreachColumnId | null => {
    const entry = (Object.keys(linkedinOutreachColumns) as LinkedinOutreachColumnId[]).find(col =>
      linkedinOutreachColumns[col].some(chat => String(chat.id) === id)
    );
    return entry ?? null;
  };

  // Debounced function to update LinkedIn outreach status (prevents rapid-fire requests when dragging)
  // Server will automatically set dateModified to current date on PATCH
  const debouncedUpdateLinkedinOutreachStatus = useDebouncedCallback(
    async (id: number, status: LinkedinOutreachStatus) => {
      try {
        const url = userIdParam ? `/api/linkedin_outreach?id=${id}&userId=${userIdParam}` : `/api/linkedin_outreach?id=${id}`;
        const response = await fetch(url, {
          method: 'PATCH',
          headers: getHeadersWithTimezone(),
          body: JSON.stringify({ status }),
        });
        if (!response.ok) throw new Error('Failed to update LinkedIn outreach status');
      } catch (error) {
        console.error('Error updating LinkedIn outreach status:', error);
        fetchLinkedinOutreach();
      }
    },
    300 // Wait 300ms after last change before sending request
  );

  const handleLinkedinOutreachDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      isDraggingLinkedinOutreachRef.current = false;
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    const fromCol = getLinkedinOutreachColumnOfItem(activeId);
    const toCol = (['outreach', 'accepted', 'followedUpLinkedin', 'linkedinOutreach'] as LinkedinOutreachColumnId[]).includes(overId as LinkedinOutreachColumnId)
      ? (overId as LinkedinOutreachColumnId)
      : getLinkedinOutreachColumnOfItem(overId);
    if (!fromCol || !toCol) {
      setActiveLinkedinOutreachId(null);
      isDraggingLinkedinOutreachRef.current = false;
      return;
    }

    if (fromCol === toCol) {
      const items = linkedinOutreachColumns[fromCol];
      const oldIndex = items.findIndex(i => String(i.id) === activeId);
      const newIndex = items.findIndex(i => String(i.id) === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        setActiveLinkedinOutreachId(null);
        isDraggingLinkedinOutreachRef.current = false;
        return;
      }
      const newItems = arrayMove(items, oldIndex, newIndex);
      setLinkedinOutreachColumns(prev => ({ ...prev, [fromCol]: newItems }));
    } else {
      const fromItems = linkedinOutreachColumns[fromCol];
      const toItems = linkedinOutreachColumns[toCol];
      const movingIndex = fromItems.findIndex(i => String(i.id) === activeId);
      if (movingIndex === -1) {
        setActiveLinkedinOutreachId(null);
        isDraggingLinkedinOutreachRef.current = false;
        return;
      }
      const movingItem = fromItems[movingIndex];
      const overIndex = toItems.findIndex(i => String(i.id) === overId);
      const insertIndex = overIndex === -1 ? toItems.length : overIndex;
      const newStatus = linkedinOutreachColumnToStatus[toCol];
      const updatedItem: LinkedinOutreach = {
        ...movingItem,
        status: newStatus,
        // dateModified will be set automatically by the server on PATCH
      };
      const newFrom = [...fromItems.slice(0, movingIndex), ...fromItems.slice(movingIndex + 1)];
      const newTo = [...toItems.slice(0, insertIndex), updatedItem, ...toItems.slice(insertIndex)];
      setLinkedinOutreachColumns(prev => ({ ...prev, [fromCol]: newFrom, [toCol]: newTo }));

      // Update status in database (debounced to prevent rapid-fire requests)
      // Server will automatically set dateModified to current date on PATCH
      debouncedUpdateLinkedinOutreachStatus(movingItem.id, newStatus);
    }
    setActiveLinkedinOutreachId(null);
    isDraggingLinkedinOutreachRef.current = false;
  };

  const handleLinkedinOutreachDragStart = (event: DragStartEvent) => {
    setActiveLinkedinOutreachId(String(event.active.id));
    isDraggingLinkedinOutreachRef.current = true;
  };

  const handleLinkedinOutreachDragOver = (event: DragOverEvent) => {
    // onDragOver is only for visual feedback via DroppableColumn
  };

  // dnd-kit: Events board (In-Person Events)
  const [eventColumns, setEventColumns] = useState<Record<EventColumnId, InPersonEvent[]>>({
    upcoming: [],
    attended: [],
    linkedinRequestsSent: [],
    followups: [],
  });
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<InPersonEvent | null>(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState<number | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsFilter, setEventsFilter] = useState<BoardTimeFilter>('allTime');
  const isFetchingEventsRef = useRef(false);
  const isDraggingEventRef = useRef(false);

  const fetchEvents = useCallback(async () => {
    // --- MOCK DATA BYPASS FOR EVENTS FETCH START ---
    if (ENABLE_DASHBOARD_MOCKS) return;
    // --- MOCK DATA BYPASS FOR EVENTS FETCH END ---
    if (isFetchingEventsRef.current) return;

    try {
      isFetchingEventsRef.current = true;
      setIsLoadingEvents(true);
      const url = userIdParam ? `/api/in_person_events?userId=${userIdParam}` : '/api/in_person_events';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch in-person events');
      const data = await response.json() as InPersonEvent[];

      const grouped: Record<EventColumnId, InPersonEvent[]> = {
        upcoming: [],
        attended: [],
        linkedinRequestsSent: [],
        followups: [],
      };

      data.forEach((event: InPersonEvent) => {
        const column = eventStatusToColumn[event.status] ?? 'upcoming';
        grouped[column].push(event);
      });

      setEventColumns(grouped);
    } catch (error) {
      console.error('Error fetching in-person events:', error);
    } finally {
      setIsLoadingEvents(false);
      isFetchingEventsRef.current = false;
    }
  }, [userIdParam]);

  useEffect(() => {
    // --- MOCK DATA BYPASS FOR EVENTS EFFECT START ---
    if (ENABLE_DASHBOARD_MOCKS) return;
    // --- MOCK DATA BYPASS FOR EVENTS EFFECT END ---
    if ((activeTab === 'events' || activeTab === 'overview') && !isFetchingEventsRef.current) {
      fetchEvents();
    }
  }, [activeTab, fetchEvents]);

  const getEventColumnOfItem = (id: string): EventColumnId | null => {
    const entry = (Object.keys(eventColumns) as EventColumnId[]).find(col =>
      eventColumns[col].some(event => String(event.id) === id)
    );
    return entry ?? null;
  };

  // Debounced function to update event status (prevents rapid-fire requests when dragging)
  // Server will automatically set dateModified to current date on PATCH
  const debouncedUpdateEventStatus = useDebouncedCallback(
    async (id: number, status: InPersonEventStatus) => {
      try {
        const url = userIdParam ? `/api/in_person_events?id=${id}&userId=${userIdParam}` : `/api/in_person_events?id=${id}`;
        const response = await fetch(url, {
          method: 'PATCH',
          headers: getHeadersWithTimezone(),
          body: JSON.stringify({ status }),
        });
        if (!response.ok) throw new Error('Failed to update event status');
      } catch (error) {
        console.error('Error updating event status:', error);
        fetchEvents();
      }
    },
    300 // Wait 300ms after last change before sending request
  );

  const handleEventsDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      isDraggingEventRef.current = false;
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    const fromCol = getEventColumnOfItem(activeId);
    const toCol = (['upcoming', 'attended', 'linkedinRequestsSent', 'followups'] as EventColumnId[]).includes(overId as EventColumnId)
      ? (overId as EventColumnId)
      : getEventColumnOfItem(overId);
    if (!fromCol || !toCol) {
      setActiveEventId(null);
      isDraggingEventRef.current = false;
      return;
    }

    if (fromCol === toCol) {
      const items = eventColumns[fromCol];
      const oldIndex = items.findIndex(i => String(i.id) === activeId);
      const newIndex = items.findIndex(i => String(i.id) === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        setActiveEventId(null);
        isDraggingEventRef.current = false;
        return;
      }
      const newItems = arrayMove(items, oldIndex, newIndex);
      setEventColumns(prev => ({ ...prev, [fromCol]: newItems }));
    } else {
      const fromItems = eventColumns[fromCol];
      const toItems = eventColumns[toCol];
      const movingIndex = fromItems.findIndex(i => String(i.id) === activeId);
      if (movingIndex === -1) {
        setActiveEventId(null);
        isDraggingEventRef.current = false;
        return;
      }
      const movingItem = fromItems[movingIndex];
      const overIndex = toItems.findIndex(i => String(i.id) === overId);
      const insertIndex = overIndex === -1 ? toItems.length : overIndex;
      const newFrom = [...fromItems.slice(0, movingIndex), ...fromItems.slice(movingIndex + 1)];
      const newStatus = eventColumnToStatus[toCol] ?? 'scheduled';
      const updatedItem: InPersonEvent = {
        ...movingItem,
        status: newStatus,
        // dateModified will be set automatically by the server on PATCH
      };
      const newTo = [...toItems.slice(0, insertIndex), updatedItem, ...toItems.slice(insertIndex)];
      setEventColumns(prev => ({ ...prev, [fromCol]: newFrom, [toCol]: newTo }));

      // Update status in database (debounced to prevent rapid-fire requests)
      // Server will automatically set dateModified to current date on PATCH
      debouncedUpdateEventStatus(movingItem.id, newStatus);
    }
    setActiveEventId(null);
    isDraggingEventRef.current = false;
  };

  const handleEventsDragStart = (event: DragStartEvent) => {
    setActiveEventId(String(event.active.id));
    isDraggingEventRef.current = true;
  };

  const handleEventsDragOver = (event: DragOverEvent) => {
    // onDragOver is only for visual feedback via DroppableColumn
  };

  // dnd-kit: LeetCode board
  const [leetColumns, setLeetColumns] = useState<Record<LeetColumnId, LeetEntry[]>>({
    planned: [],
    solved: [],
    reflected: [],
  });
  const [activeLeetId, setActiveLeetId] = useState<string | null>(null);
  const [isLeetModalOpen, setIsLeetModalOpen] = useState(false);
  const [editingLeet, setEditingLeet] = useState<LeetEntry | null>(null);
const [isDeletingLeet, setIsDeletingLeet] = useState<number | null>(null);
const [isLoadingLeet, setIsLoadingLeet] = useState(true);
  const [leetFilter, setLeetFilter] = useState<BoardTimeFilter>('allTime');
const isFetchingLeetRef = useRef(false);
  const isDraggingLeetRef = useRef(false);
// ----- MOCK DATA SEED TRACKER START -----
const hasSeededMockDataRef = useRef(false);
// ----- MOCK DATA SEED TRACKER END -----

  const fetchLeetEntries = useCallback(async () => {
    // --- MOCK DATA BYPASS FOR LEET FETCH START ---
    if (ENABLE_DASHBOARD_MOCKS) return;
    // --- MOCK DATA BYPASS FOR LEET FETCH END ---
    if (isFetchingLeetRef.current) return;

    try {
      isFetchingLeetRef.current = true;
      setIsLoadingLeet(true);
      const url = userIdParam ? `/api/leetcode?userId=${userIdParam}` : '/api/leetcode';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch LeetCode entries');
      const data = await response.json();

      const grouped: Record<LeetColumnId, LeetEntry[]> = {
        planned: [],
        solved: [],
        reflected: [],
      };

      (data as LeetEntry[]).forEach(entry => {
        const column = leetStatusToColumn[entry.status] ?? 'planned';
        grouped[column].push(entry);
      });

      setLeetColumns(grouped);
    } catch (error) {
      console.error('Error fetching LeetCode entries:', error);
    } finally {
      setIsLoadingLeet(false);
      isFetchingLeetRef.current = false;
    }
  }, [userIdParam]);

  useEffect(() => {
    // --- MOCK DATA BYPASS FOR LEET EFFECT START ---
    if (ENABLE_DASHBOARD_MOCKS) return;
    // --- MOCK DATA BYPASS FOR LEET EFFECT END ---
    if ((activeTab === 'leetcode' || activeTab === 'overview') && !isFetchingLeetRef.current) {
      fetchLeetEntries();
    }
  }, [activeTab, fetchLeetEntries]);

  const getLeetColumnOfItem = (id: string): LeetColumnId | null => {
    const entry = (Object.keys(leetColumns) as LeetColumnId[]).find(col =>
      leetColumns[col].some(item => String(item.id) === id)
    );
    return entry ?? null;
  };

  // Debounced function to update LeetCode status (prevents rapid-fire requests when dragging)
  // Server will automatically set dateModified to current date on PATCH
  const debouncedUpdateLeetCodeStatus = useDebouncedCallback(
    async (id: number, status: LeetStatus) => {
      try {
        const url = userIdParam ? `/api/leetcode?id=${id}&userId=${userIdParam}` : `/api/leetcode?id=${id}`;
        const response = await fetch(url, {
          method: 'PATCH',
          headers: getHeadersWithTimezone(),
          body: JSON.stringify({ status }),
        });
        if (!response.ok) throw new Error('Failed to update LeetCode status');
      } catch (error) {
        console.error('Error updating LeetCode status:', error);
        fetchLeetEntries();
      }
    },
    300 // Wait 300ms after last change before sending request
  );

  const handleLeetDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      isDraggingLeetRef.current = false;
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    const fromCol = getLeetColumnOfItem(activeId);
    const toCol = (['planned', 'solved', 'reflected'] as LeetColumnId[]).includes(overId as LeetColumnId)
      ? (overId as LeetColumnId)
      : getLeetColumnOfItem(overId);
    if (!fromCol || !toCol) {
      setActiveLeetId(null);
      isDraggingLeetRef.current = false;
      return;
    }

    if (fromCol === toCol) {
      const items = leetColumns[fromCol];
      const oldIndex = items.findIndex(i => String(i.id) === activeId);
      const newIndex = items.findIndex(i => String(i.id) === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        setActiveLeetId(null);
        isDraggingLeetRef.current = false;
        return;
      }
      const newItems = arrayMove(items, oldIndex, newIndex);
      setLeetColumns(prev => ({ ...prev, [fromCol]: newItems }));
    } else {
      const fromItems = leetColumns[fromCol];
      const toItems = leetColumns[toCol];
      const movingIndex = fromItems.findIndex(i => String(i.id) === activeId);
      if (movingIndex === -1) {
        setActiveLeetId(null);
        isDraggingLeetRef.current = false;
        return;
      }
      const movingItem = fromItems[movingIndex];
      const overIndex = toItems.findIndex(i => String(i.id) === overId);
      const insertIndex = overIndex === -1 ? toItems.length : overIndex;
      const newFrom = [...fromItems.slice(0, movingIndex), ...fromItems.slice(movingIndex + 1)];
      const newStatus = leetColumnToStatus[toCol];
      const updatedItem: LeetEntry = {
        ...movingItem,
        status: newStatus,
        // dateModified will be set automatically by the server on PATCH
      };
      const newTo = [...toItems.slice(0, insertIndex), updatedItem, ...toItems.slice(insertIndex)];
      setLeetColumns(prev => ({ ...prev, [fromCol]: newFrom, [toCol]: newTo }));

      // Update status in database (debounced to prevent rapid-fire requests)
      // Server will automatically set dateModified to current date on PATCH
      debouncedUpdateLeetCodeStatus(movingItem.id, newStatus);
    }
    setActiveLeetId(null);
    isDraggingLeetRef.current = false;
  };

  const handleLeetDragStart = (event: DragStartEvent) => {
    setActiveLeetId(String(event.active.id));
    isDraggingLeetRef.current = true;
  };

  const handleLeetDragOver = (event: DragOverEvent) => {
    // onDragOver is only for visual feedback via DroppableColumn
  };

  const [userData, setUserData] = useState<{
    appsWithOutreachPerWeek?: number | null;
    linkedinOutreachPerWeek?: number | null;
    targetOfferDate?: string | null;
    projectedOfferDate?: string | null;
    inPersonEventsPerMonth?: number | null;
    resetStartDate?: string | null;
    careerFairsPerYear?: number | null;
  } | null>(null);

  // <<<<< MOCK DATA SEEDING EFFECT START >>>>>
  useEffect(() => {
    if (!ENABLE_DASHBOARD_MOCKS || hasSeededMockDataRef.current) return;
    hasSeededMockDataRef.current = true;

    const now = new Date();
    const isoWithDelta = ({
      months = 0,
      days = 0,
      hour = 10,
      minute = 0,
    }: {
      months?: number;
      days?: number;
      hour?: number;
      minute?: number;
    }) => {
      const d = new Date(now);
      d.setMonth(d.getMonth() + months);
      if (days !== 0) {
        d.setDate(d.getDate() + days);
      }
      d.setHours(hour, minute, 0, 0);
      return d.toISOString();
    };

    const mockApplications: Record<ApplicationColumnId, Application[]> = {
      applied: [
        {
          id: 1001,
          company: 'Acme Corp',
          notes: 'Submitted via careers site',
          status: 'applied',
          dateCreated: isoWithDelta({ months: -1, days: -3, hour: 9 }),
          userId: 'mock-user',
        },
        {
          id: 1002,
          company: 'Globex',
          recruiter: 'Jordan Smith',
          status: 'applied',
          dateCreated: isoWithDelta({ months: -4, days: -12, hour: 14 }),
          userId: 'mock-user',
        },
      ],
      messagedRecruiter: [
        {
          id: 1003,
          company: 'Initech',
          recruiter: 'Ava Chen',
          msgToRecruiter: 'Followed up with recruiter on LinkedIn.',
          status: 'messagedRecruiter',
          dateCreated: isoWithDelta({ months: -2, days: -6, hour: 11 }),
          userId: 'mock-user',
        },
      ],
      messagedHiringManager: [
        {
          id: 1004,
          company: 'Vandelay Industries',
          hiringManager: 'Art Vandelay',
          msgToManager: 'Sent tailored cover letter and message.',
          status: 'messagedHiringManager',
          dateCreated: isoWithDelta({ months: -5, days: -9, hour: 16 }),
          userId: 'mock-user',
        },
      ],
      followedUp: [
        {
          id: 1005,
          company: 'Stark Industries',
          notes: 'Submitted product sense assignment.',
          status: 'followedUp',
          dateCreated: isoWithDelta({ months: -7, days: -4, hour: 13 }),
          userId: 'mock-user',
        },
      ],
      interview: [
        {
          id: 1006,
          company: 'Wayne Enterprises',
          hiringManager: 'Lucius Fox',
          status: 'interview',
          dateCreated: isoWithDelta({ months: -10, days: -15, hour: 10 }),
          userId: 'mock-user',
        },
      ],
    };

    const mockLinkedinOutreach: Record<LinkedinOutreachColumnId, LinkedinOutreach[]> = {
      outreach: [
        {
          id: 2001,
          name: 'Priya Patel',
          company: 'Globex',
          message: 'Introduced myself and shared interest in the team.',
          status: 'outreachRequestSent',
          dateCreated: isoWithDelta({ months: 0, days: -8, hour: 12 }),
          recievedReferral: false,
          userId: 'mock-user',
        },
      ],
      accepted: [
        {
          id: 2002,
          name: 'Leo Johnson',
          company: 'Initech',
          status: 'accepted',
          dateCreated: isoWithDelta({ months: -3, days: -10, hour: 15 }),
          recievedReferral: false,
          userId: 'mock-user',
        },
      ],
      followedUpLinkedin: [
        {
          id: 2003,
          name: 'Mia Garcia',
          company: 'Acme Corp',
          notes: 'Scheduled time to reconnect in two weeks.',
          status: 'followedUp',
          dateCreated: isoWithDelta({ months: -6, days: -5, hour: 9 }),
          recievedReferral: false,
          userId: 'mock-user',
        },
      ],
      linkedinOutreach: [
        {
          id: 2004,
          name: 'Noah Kim',
          company: 'Wayne Enterprises',
          notes: 'Coffee chat went well — discussed upcoming team initiatives.',
          status: 'linkedinOutreach',
          dateCreated: isoWithDelta({ months: -8, days: -11, hour: 10 }),
          recievedReferral: true,
          userId: 'mock-user',
        },
      ],
    };

    const mockEvents: Record<EventColumnId, InPersonEvent[]> = {
      upcoming: [
        {
          id: 3001,
          event: 'ProductCon',
          date: isoWithDelta({ months: 1, days: 5, hour: 9, minute: 30 }),
          location: 'San Francisco',
          status: 'scheduled',
          careerFair: false,
          userId: 'mock-user',
        },
      ],
      attended: [
        {
          id: 3003,
          event: 'AI Hiring Fair',
          date: isoWithDelta({ months: -5, days: -7, hour: 13 }),
          location: 'Virtual',
          status: 'attended',
          numPeopleSpokenTo: 6,
          numLinkedInRequests: 4,
          careerFair: true,
          userId: 'mock-user',
        },
      ],
      linkedinRequestsSent: [
        {
          id: 3002,
          event: 'Tech Mixer',
          date: isoWithDelta({ months: -2, days: -2, hour: 18 }),
          location: 'Seattle',
          status: 'linkedinRequestsSent',
          numLinkedInRequests: 5,
          careerFair: false,
          userId: 'mock-user',
        },
      ],
      followups: [
        {
          id: 3004,
          event: 'Startup Expo',
          date: isoWithDelta({ months: -9, days: -3, hour: 15 }),
          location: 'Austin',
          notes: 'Need to send thank-you emails.',
          status: 'followUp',
          numPeopleSpokenTo: 3,
          numOfInterviews: 1,
          careerFair: false,
          userId: 'mock-user',
        },
      ],
    };

    const mockLeetEntries: Record<LeetColumnId, LeetEntry[]> = {
      planned: [
        {
          id: 4001,
          problem: 'Binary Tree Zigzag Level Order Traversal',
          problemType: 'Trees, BFS',
          difficulty: 'Medium',
          status: 'planned',
          userId: 'mock-user',
          dateCreated: isoWithDelta({ months: -1, days: -4, hour: 8 }),
        },
      ],
      solved: [
        {
          id: 4002,
          problem: 'Two Sum',
          problemType: 'Hash Map',
          difficulty: 'Easy',
          url: 'https://leetcode.com/problems/two-sum/',
          status: 'solved',
          userId: 'mock-user',
          dateCreated: isoWithDelta({ months: -4, days: -6, hour: 7 }),
        },
      ],
      reflected: [
        {
          id: 4003,
          problem: 'Word Ladder',
          problemType: 'Graphs, BFS',
          difficulty: 'Hard',
          reflection: 'Notice the transformation count hints at BFS on word graph.',
          status: 'reflected',
          userId: 'mock-user',
          dateCreated: isoWithDelta({ months: -9, days: -2, hour: 20 }),
        },
      ],
    };

    const mockTargetOfferDate = new Date(now);
    mockTargetOfferDate.setMonth(mockTargetOfferDate.getMonth() + 3);

    setAppColumns(mockApplications);
    setLinkedinOutreachColumns(mockLinkedinOutreach);
    setEventColumns(mockEvents);
    setLeetColumns(mockLeetEntries);
    setIsLoading(false);
    setIsLoadingLinkedinOutreach(false);
    setIsLoadingEvents(false);
    setIsLoadingLeet(false);
    setActiveTab('overview');
    setTargetOfferDate(mockTargetOfferDate);
    setUserData({
      appsWithOutreachPerWeek: 6,
      linkedinOutreachPerWeek: 8,
      targetOfferDate: mockTargetOfferDate.toISOString(),
      inPersonEventsPerMonth: 3,
      resetStartDate: isoWithDelta({ months: -1, days: -18, hour: 8 }),
    });
  }, []);
  // <<<<< MOCK DATA SEEDING EFFECT END >>>>>

  // Check if viewing as instructor and fetch user name
  useEffect(() => {
    async function checkInstructorAndFetchUserName() {
      if (!userIdParam) {
        setIsInstructor(false);
        setViewedUserName(null);
        return;
      }

      try {
        // Check if current user is an instructor
        const instructorRes = await fetch('/api/instructor');
        if (instructorRes.ok) {
          setIsInstructor(true);
          
          // Fetch the user's name
          const userRes = await fetch(`/api/instructor/students`);
          if (userRes.ok) {
            const data = await userRes.json();
            const user = data.students?.find((u: { id: string }) => u.id === userIdParam);
            if (user) {
              setViewedUserName(user.name);
            }
          }
        } else {
          setIsInstructor(false);
          setViewedUserName(null);
        }
      } catch (error) {
        console.error('Error checking instructor status or fetching user name:', error);
        setIsInstructor(false);
        setViewedUserName(null);
      }
    }

    checkInstructorAndFetchUserName();
  }, [userIdParam]);

  useEffect(() => {
    if (ENABLE_DASHBOARD_MOCKS) return;
    let isMounted = true;
    const maxRetries = 3;
    const retryDelay = 500; // 500ms between retries
    
    const fetchUser = async (attempt: number = 0) => {
      try {
        const url = userIdParam ? `/api/users/onboarding2?userId=${userIdParam}` : '/api/users/onboarding2';
        const res = await fetch(url);
        if (!res.ok) {
          // If user not found and we haven't exceeded retries, retry after a delay
          // This handles race conditions where the user was just created
          if (res.status === 404 && attempt < maxRetries && isMounted) {
            setTimeout(() => {
              if (isMounted) {
                fetchUser(attempt + 1);
              }
            }, retryDelay * (attempt + 1)); // Exponential backoff
            return;
          }
          return;
        }
        const user = await res.json();
        if (isMounted) {
          setUserData(user);
          if (user?.targetOfferDate) {
            const d = new Date(user.targetOfferDate);
            if (!isNaN(d.getTime())) setTargetOfferDate(d);
          }
          // Initialize the sync ref with the stored projectedOfferDate to prevent unnecessary syncing on initial load
          if (user?.projectedOfferDate) {
            const storedDate = new Date(user.projectedOfferDate);
            if (!isNaN(storedDate.getTime())) {
              lastProjectedOfferSyncRef.current = storedDate.toISOString();
            }
          }
        }
      } catch (e) {
        // If error and we haven't exceeded retries, retry after a delay
        if (attempt < maxRetries && isMounted) {
          setTimeout(() => {
            if (isMounted) {
              fetchUser(attempt + 1);
            }
          }, retryDelay * (attempt + 1));
        }
      }
    };
    fetchUser();
    return () => { isMounted = false; };
  }, [userIdParam]);

  const targetOfferDateText = useMemo(() => {
    if (!targetOfferDate) return '—';
    try {
      return targetOfferDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return '—';
    }
  }, [targetOfferDate]);

  // Calculate applications metrics for this month
  const metricsMonth = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    // For testing a specific month, replace the line above with something like:
    // const start = new Date(2024, 0, 1); // January 2024
    return start;
  }, []);

  const metricsMonthEnd = useMemo(() => {
    const end = new Date(metricsMonth);
    end.setMonth(end.getMonth() + 1);
    return end;
  }, [metricsMonth]);

  // Calculate last month's date range for projected offer date
  const lastMonthStart = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return start;
  }, []);

  const lastMonthEnd = useMemo(() => {
    const end = new Date(lastMonthStart);
    end.setMonth(end.getMonth() + 1);
    return end;
  }, [lastMonthStart]);

  const getHabitStatusStyles = useCallback((
    count: number,
    goal: number,
    percentage: number
  ): {
    dotClass: string;
    textClass: string;
    barClass: string;
  } => {
    if (goal > 0 && percentage >= 100) {
      return {
        dotClass: 'bg-purple-500',
        textClass: 'text-purple-400',
        barClass: 'bg-purple-500',
      };
    }
    if (count <= 0) {
      return {
        dotClass: 'bg-red-500',
        textClass: 'text-red-400',
        barClass: 'bg-red-500',
      };
    }
    if (count === 1) {
      return {
        dotClass: 'bg-yellow-500',
        textClass: 'text-yellow-400',
        barClass: 'bg-yellow-500',
      };
    }
    return {
      dotClass: 'bg-green-500',
      textClass: 'text-green-400',
      barClass: 'bg-green-500',
    };
  }, []);

  const applicationsMetrics = useMemo(() => {
    
    // Count applications in columns: messagedHiringManager, messagedRecruiter, followedUp, interview
    // (any column to the right of "applied")
    let count = 0;
    
    APPLICATION_COMPLETION_COLUMNS.forEach(col => {
      appColumns[col].forEach(app => {
        const appDate = new Date(app.dateCreated);
        if (!Number.isNaN(appDate.getTime()) && appDate >= metricsMonth && appDate < metricsMonthEnd) {
          count++;
        }
      });
    });

    // Goal is appsWithOutreachPerWeek * 4 (4 weeks per month)
    const goal = userData?.appsWithOutreachPerWeek ? userData.appsWithOutreachPerWeek * 4 : 0;
    const rawPercentage = goal > 0 ? (count / goal) * 100 : 0;
    const clampedPercentage = Math.min(Math.max(rawPercentage, 0), 100);
    const styles = getHabitStatusStyles(count, goal, clampedPercentage);
    const statusText = `${Math.round(clampedPercentage)}%`;

    return {
      count,
      goal,
      percentage: clampedPercentage,
      statusText,
      statusTextColor: styles.textClass,
      statusDotClass: styles.dotClass,
      statusBarClass: styles.barClass,
    };
  }, [appColumns, userData, metricsMonth, metricsMonthEnd, getHabitStatusStyles]);

  // Calculate linkedin outreach metrics for this month
  const linkedinOutreachMetrics = useMemo(() => {
    // Count all linkedin outreach entries from all 4 columns (outreach, accepted, followedUpLinkedin, linkedinOutreach)
    let count = 0;
    
    LINKEDIN_COMPLETION_COLUMNS.forEach(col => {
      linkedinOutreachColumns[col].forEach(chat => {
        const chatDate = new Date(chat.dateCreated);
        if (!Number.isNaN(chatDate.getTime()) && chatDate >= metricsMonth && chatDate < metricsMonthEnd) {
          count++;
        }
      });
    });

    // Goal is linkedinOutreachPerWeek (converted to monthly) from user's onboarding data
    const goal = userData?.linkedinOutreachPerWeek ? userData.linkedinOutreachPerWeek * 4 : 0;
    const rawPercentage = goal > 0 ? (count / goal) * 100 : 0;
    const clampedPercentage = Math.min(Math.max(rawPercentage, 0), 100);
    const styles = getHabitStatusStyles(count, goal, clampedPercentage);
    const statusText = `${Math.round(clampedPercentage)}%`;

    return {
      count,
      goal,
      percentage: clampedPercentage,
      statusText,
      statusTextColor: styles.textClass,
      statusDotClass: styles.dotClass,
      statusBarClass: styles.barClass,
    };
  }, [linkedinOutreachColumns, userData, metricsMonth, metricsMonthEnd, getHabitStatusStyles]);

  const careerFairsThisYear = useMemo(() => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
    const eligibleStatuses: InPersonEventStatus[] = ['attended', 'linkedinRequestsSent', 'followUp'];
    let count = 0;
    (Object.values(eventColumns) as InPersonEvent[][]).forEach(columnEvents => {
      columnEvents.forEach(event => {
        if (!event.careerFair || !event.date) return;
        if (!eligibleStatuses.includes(event.status)) return;
        const eventDate = new Date(event.date);
        if (Number.isNaN(eventDate.getTime())) return;
        if (eventDate >= yearStart && eventDate < yearEnd) {
          count += 1;
        }
      });
    });
    return count;
  }, [eventColumns]);

  const careerFairPlanGoal = userData?.careerFairsPerYear ?? 0;

  const careerFairProgress = useMemo(() => {
    if (careerFairPlanGoal <= 0) return 1;
    if (!careerFairsThisYear || careerFairsThisYear <= 0) return 0;
    return Math.min(careerFairsThisYear / careerFairPlanGoal, 1);
  }, [careerFairsThisYear, careerFairPlanGoal]);

  const eventsMetrics = useMemo(() => {
    let eventCount = 0;
    let careerFairCount = 0;

    EVENT_COMPLETION_COLUMNS.forEach(col => {
      eventColumns[col].forEach(event => {
        const eventDate = new Date(event.date);
        if (!Number.isNaN(eventDate.getTime()) && eventDate >= metricsMonth && eventDate < metricsMonthEnd) {
          if (event.careerFair) {
            careerFairCount++;
          } else {
            eventCount++;
          }
        }
      });
    });

    const baseGoal = userData?.inPersonEventsPerMonth ?? 0;
    const fairGoalAnnual = careerFairPlanGoal > 0 ? careerFairPlanGoal : 0;
    const combinedGoal = baseGoal + fairGoalAnnual;
    const combinedCount = eventCount + careerFairCount;
    const rawPercentage = combinedGoal > 0 ? (combinedCount / combinedGoal) * 100 : 0;
    const clampedPercentage = Math.min(Math.max(rawPercentage, 0), 100);
    const styles = getHabitStatusStyles(combinedCount, combinedGoal, clampedPercentage);
    const statusText = `${Math.round(clampedPercentage)}%`;

    return {
      count: eventCount,
      totalCount: combinedCount,
      goal: combinedGoal,
      percentage: clampedPercentage,
      statusText,
      statusTextColor: styles.textClass,
      statusDotClass: styles.dotClass,
      statusBarClass: styles.barClass,
    };
  }, [eventColumns, userData, metricsMonth, metricsMonthEnd, getHabitStatusStyles, careerFairPlanGoal]);

  const leetMetrics = useMemo(() => {
    let count = 0;
    leetColumns.reflected.forEach(entry => {
      if (!entry.dateCreated) return;
      const entryDate = new Date(entry.dateCreated);
      if (!Number.isNaN(entryDate.getTime()) && entryDate >= metricsMonth && entryDate < metricsMonthEnd) {
        count += 1;
      }
    });

    const goal = 4;
    const rawPercentage = goal > 0 ? (count / goal) * 100 : 0;
    const clampedPercentage = Math.min(Math.max(rawPercentage, 0), 100);
    const styles = getHabitStatusStyles(count, goal, clampedPercentage);
    const statusText = `${Math.round(clampedPercentage)}%`;

    return {
      count,
      goal,
      percentage: clampedPercentage,
      statusText,
      statusTextColor: styles.textClass,
      statusDotClass: styles.dotClass,
      statusBarClass: styles.barClass,
    };
  }, [leetColumns, metricsMonth, metricsMonthEnd, getHabitStatusStyles]);

  // Calculate all-time counts for each metric
  const applicationsAllTimeCount = useMemo(() => {
    let count = 0;
    APPLICATION_COMPLETION_COLUMNS.forEach(col => {
      count += appColumns[col].length;
    });
    return count;
  }, [appColumns]);

  const linkedinOutreachAllTimeCount = useMemo(() => {
    let count = 0;
    LINKEDIN_COMPLETION_COLUMNS.forEach(col => {
      count += linkedinOutreachColumns[col].length;
    });
    return count;
  }, [linkedinOutreachColumns]);

  const eventsAllTimeCount = useMemo(() => {
    let count = 0;
    EVENT_COMPLETION_COLUMNS.forEach(col => {
      count += eventColumns[col].length;
    });
    return count;
  }, [eventColumns]);

  const leetAllTimeCount = useMemo(() => {
    return LEET_COMPLETION_COLUMNS.reduce((acc, col) => acc + leetColumns[col].length, 0);
  }, [leetColumns]);

  const isWithinCurrentMonth = useCallback(
    (value?: string | null) => {
      if (!value) return false;
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return false;
      return d >= metricsMonth && d < metricsMonthEnd;
    },
    [metricsMonth, metricsMonthEnd]
  );

  const PROJECTED_WEEKS_PER_MONTH = 4;

  // Calculate last month's metrics for projected offer date (using dateModified)
  const lastMonthApplicationsMetrics = useMemo(() => {
    let count = 0;
    APPLICATION_COMPLETION_COLUMNS.forEach(col => {
      appColumns[col].forEach(app => {
        if (!app.dateModified) return;
        const modifiedDate = new Date(app.dateModified);
        if (!Number.isNaN(modifiedDate.getTime()) && modifiedDate >= lastMonthStart && modifiedDate < lastMonthEnd) {
          count++;
        }
      });
    });
    return count;
  }, [appColumns, lastMonthStart, lastMonthEnd]);

  const lastMonthLinkedinOutreachMetrics = useMemo(() => {
    let count = 0;
    LINKEDIN_COMPLETION_COLUMNS.forEach(col => {
      linkedinOutreachColumns[col].forEach(chat => {
        if (!chat.dateModified) return;
        const modifiedDate = new Date(chat.dateModified);
        if (!Number.isNaN(modifiedDate.getTime()) && modifiedDate >= lastMonthStart && modifiedDate < lastMonthEnd) {
          count++;
        }
      });
    });
    return count;
  }, [linkedinOutreachColumns, lastMonthStart, lastMonthEnd]);

  const lastMonthEventsMetrics = useMemo(() => {
    let count = 0;
    EVENT_COMPLETION_COLUMNS.forEach(col => {
      eventColumns[col].forEach(event => {
        if (!event.dateModified) return;
        const modifiedDate = new Date(event.dateModified);
        if (!Number.isNaN(modifiedDate.getTime()) && modifiedDate >= lastMonthStart && modifiedDate < lastMonthEnd) {
          count++;
        }
      });
    });
    return count;
  }, [eventColumns, lastMonthStart, lastMonthEnd]);

  const derivedPlanStartDate = useMemo(() => {
    if (!targetOfferDate || !userData) return null;

    const planApps = userData.appsWithOutreachPerWeek ?? 0;
    const planLinkedin = userData.linkedinOutreachPerWeek ?? 0;
    const planEvents = userData.inPersonEventsPerMonth ?? 0;
    const planFairs = userData.careerFairsPerYear ?? 0;

    const epoch = new Date(0);
    const planDurationDate = calculateProjectedOfferDate(
      planApps,
      planLinkedin,
      planEvents,
      planFairs,
      epoch
    );
    if (!planDurationDate) return null;
    const planDurationMs = planDurationDate.getTime() - epoch.getTime();
    if (!Number.isFinite(planDurationMs) || planDurationMs <= 0) return null;

    return new Date(targetOfferDate.getTime() - planDurationMs);
  }, [
    targetOfferDate,
    userData?.appsWithOutreachPerWeek,
    userData?.linkedinOutreachPerWeek,
    userData?.inPersonEventsPerMonth,
    userData?.careerFairsPerYear,
    userData,
  ]);

  const projectedOfferDate = useMemo(() => {
    // Use last month's metrics instead of current month's
    const appsPerWeekRaw = lastMonthApplicationsMetrics / PROJECTED_WEEKS_PER_MONTH;
    const linkedinPerWeekRaw = lastMonthLinkedinOutreachMetrics / PROJECTED_WEEKS_PER_MONTH;
    const appsPerWeek = Number.isFinite(appsPerWeekRaw) ? appsPerWeekRaw : 0;
    const linkedinPerWeek = Number.isFinite(linkedinPerWeekRaw) ? linkedinPerWeekRaw : 0;
    const eventsPerMonth = Number.isFinite(lastMonthEventsMetrics) ? lastMonthEventsMetrics : 0;
    const careerFairsPerYear = careerFairPlanGoal > 0
      ? careerFairPlanGoal * careerFairProgress
      : careerFairsThisYear;

    const referenceDate = userData?.resetStartDate
      ? new Date(userData.resetStartDate)
      : derivedPlanStartDate ?? undefined;

    return calculateProjectedOfferDate(
      appsPerWeek,
      linkedinPerWeek,
      eventsPerMonth,
      careerFairsPerYear,
      referenceDate
    );
  }, [
    lastMonthApplicationsMetrics,
    lastMonthLinkedinOutreachMetrics,
    lastMonthEventsMetrics,
    careerFairsThisYear,
    careerFairPlanGoal,
    careerFairProgress,
    derivedPlanStartDate,
    userData?.careerFairsPerYear,
    userData?.resetStartDate,
  ]);

  const projectedOfferDateText = useMemo(() => {
    if (!projectedOfferDate) return '—';
    try {
      return projectedOfferDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return '—';
    }
  }, [projectedOfferDate]);

  // Debounced function to sync projected offer date (prevents rapid-fire requests)
  const syncProjectedOfferDate = useDebouncedCallback((date: Date) => {
    const iso = date.toISOString();
    if (lastProjectedOfferSyncRef.current === iso) return;

    const url = userIdParam ? `/api/users/projected-offer?userId=${userIdParam}` : '/api/users/projected-offer';
    fetch(url, {
      method: 'POST',
      headers: getHeadersWithTimezone(),
      body: JSON.stringify({ projectedOfferDate: iso }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to update projected offer date');
        }
        lastProjectedOfferSyncRef.current = iso;
      })
      .catch(error => {
        console.error('Error syncing projected offer date:', error);
      });
  }, 500); // Wait 500ms after last change before sending request

  useEffect(() => {
    if (!projectedOfferDate) return;
    syncProjectedOfferDate(projectedOfferDate);
  }, [projectedOfferDate, syncProjectedOfferDate]);

  const filteredAppColumns = useMemo(() => {
    if (applicationsFilter === 'allTime') return appColumns;
    const filtered: Record<ApplicationColumnId, Application[]> = {
      applied: [],
      messagedRecruiter: [],
      messagedHiringManager: [],
      followedUp: [],
      interview: [],
    };
    (Object.keys(appColumns) as ApplicationColumnId[]).forEach(columnId => {
      if (applicationsFilter === 'modifiedThisMonth') {
        filtered[columnId] = appColumns[columnId].filter(app => isWithinCurrentMonth(app.dateModified));
      }
    });
    return filtered;
  }, [appColumns, applicationsFilter, isWithinCurrentMonth]);

  const filteredLinkedinOutreachColumns = useMemo(() => {
    if (linkedinOutreachFilter === 'allTime') return linkedinOutreachColumns;
    const filtered: Record<LinkedinOutreachColumnId, LinkedinOutreach[]> = {
      outreach: [],
      accepted: [],
      followedUpLinkedin: [],
      linkedinOutreach: [],
    };
    (Object.keys(linkedinOutreachColumns) as LinkedinOutreachColumnId[]).forEach(columnId => {
      if (linkedinOutreachFilter === 'modifiedThisMonth') {
        filtered[columnId] = linkedinOutreachColumns[columnId].filter(entry =>
          isWithinCurrentMonth(entry.dateModified)
        );
      }
    });
    return filtered;
  }, [linkedinOutreachColumns, linkedinOutreachFilter, isWithinCurrentMonth]);

  const filteredEventColumns = useMemo(() => {
    if (eventsFilter === 'allTime') return eventColumns;
    const filtered: Record<EventColumnId, InPersonEvent[]> = {
      upcoming: [],
      attended: [],
      linkedinRequestsSent: [],
      followups: [],
    };
    (Object.keys(eventColumns) as EventColumnId[]).forEach(columnId => {
      if (eventsFilter === 'modifiedThisMonth') {
        filtered[columnId] = eventColumns[columnId].filter(event =>
          isWithinCurrentMonth(event.dateModified)
        );
      }
    });
    return filtered;
  }, [eventColumns, eventsFilter, isWithinCurrentMonth]);

  const filteredLeetColumns = useMemo(() => {
    if (leetFilter === 'allTime') return leetColumns;
    const filtered: Record<LeetColumnId, LeetEntry[]> = {
      planned: [],
      solved: [],
      reflected: [],
    };
    (Object.keys(leetColumns) as LeetColumnId[]).forEach(columnId => {
      if (leetFilter === 'modifiedThisMonth') {
        filtered[columnId] = leetColumns[columnId].filter(entry =>
          isWithinCurrentMonth(entry.dateModified)
        );
      }
    });
    return filtered;
  }, [leetColumns, leetFilter, isWithinCurrentMonth]);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleHabitCardClick = (cardId: string) => {
    setActiveTab(cardId);
  };

  const toLocalDate = (value: string) => {
    try {
      const date = new Date(value);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-gray-900 text-white">
      {/* Instructor View Banner */}
      {isInstructor && userIdParam && viewedUserName && (
        <div className="bg-electric-blue/20 border-b border-electric-blue/50">
          <div className="max-w-7xl mx-auto px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-electric-blue font-semibold">
                  Viewing dashboard as instructor
                </div>
                <div className="text-gray-300">
                  User: <span className="text-white font-medium">{viewedUserName}</span>
                </div>
              </div>
              <Link
                href="/instructor/dashboard"
                className="flex items-center gap-2 text-electric-blue hover:text-blue-400 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Instructor Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Main Navigation Tabs */}
        <section className="mb-8">
          <div className="flex border-b border-light-steel-blue bg-gray-800 rounded-t-lg">
            <button 
              onClick={() => handleTabClick('overview')}
              className={`main-tab-btn flex-1 py-4 px-6 text-center font-semibold border-r border-light-steel-blue transition-colors ${
                activeTab === 'overview' 
                  ? 'bg-electric-blue text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Gauge className="inline mr-2" />Overview
            </button>
            <button 
              onClick={() => handleTabClick('applications')}
              className={`main-tab-btn flex-1 py-4 px-6 text-center font-semibold border-r border-light-steel-blue transition-colors ${
                activeTab === 'applications' 
                  ? 'bg-electric-blue text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <FileText className="inline mr-2" />Applications
            </button>
            <button 
              onClick={() => handleTabClick('interviews')}
              className={`main-tab-btn flex-1 py-4 px-6 text-center font-semibold border-r border-light-steel-blue transition-colors ${
                activeTab === 'interviews' 
                  ? 'bg-electric-blue text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <MessageCircle className="inline mr-2" />Coffee Chats
            </button>
            <button 
              onClick={() => handleTabClick('events')}
              className={`main-tab-btn flex-1 py-4 px-6 text-center font-semibold border-r border-light-steel-blue transition-colors ${
                activeTab === 'events' 
                  ? 'bg-electric-blue text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Users className="inline mr-2" />Events
            </button>
            <button 
              onClick={() => handleTabClick('leetcode')}
              className={`main-tab-btn flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                activeTab === 'leetcode' 
                  ? 'bg-electric-blue text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Code className="inline mr-2" />LeetCode
            </button>
          </div>
        </section>

        {/* Overview Content */}
        {activeTab === 'overview' && (
          <OverviewTab
            targetOfferDateText={targetOfferDateText}
            projectedOfferDateText={projectedOfferDateText}
            applicationsMetrics={applicationsMetrics}
            applicationsAllTimeCount={applicationsAllTimeCount}
            linkedinOutreachMetrics={linkedinOutreachMetrics}
            linkedinOutreachAllTimeCount={linkedinOutreachAllTimeCount}
            eventsMetrics={eventsMetrics}
            eventsAllTimeCount={eventsAllTimeCount}
            leetMetrics={leetMetrics}
            leetAllTimeCount={leetAllTimeCount}
            handleHabitCardClick={handleHabitCardClick}
          />
        )}

        {/* Applications Content */}
        {activeTab === 'applications' && (
          <ApplicationsTab
            filteredAppColumns={filteredAppColumns}
            appColumns={appColumns}
            isLoading={isLoading}
            applicationsFilter={applicationsFilter}
            setApplicationsFilter={setApplicationsFilter}
            setIsModalOpen={setIsModalOpen}
            setEditingApp={setEditingApp}
            sensors={sensors}
            handleApplicationsDragStart={handleApplicationsDragStart}
            handleApplicationsDragOver={handleApplicationsDragOver}
            handleApplicationsDragEnd={handleApplicationsDragEnd}
            activeAppId={activeAppId}
            getApplicationColumnOfItem={getApplicationColumnOfItem}
            ApplicationModal={ApplicationModal}
            DeleteModal={DeleteModal}
            isModalOpen={isModalOpen}
            editingApp={editingApp}
            setIsDeleting={setIsDeleting}
            isDeleting={isDeleting}
            fetchApplications={fetchApplications}
            isDraggingAppRef={isDraggingAppRef}
            userIdParam={userIdParam}
          />
        )}

        {/* Coffee Chats Content */}
        {activeTab === 'interviews' && (
          <CoffeeChatsTab
            filteredLinkedinOutreachColumns={filteredLinkedinOutreachColumns}
            linkedinOutreachColumns={linkedinOutreachColumns}
            isLoadingLinkedinOutreach={isLoadingLinkedinOutreach}
            linkedinOutreachFilter={linkedinOutreachFilter}
            setLinkedinOutreachFilter={setLinkedinOutreachFilter}
            setIsLinkedinOutreachModalOpen={setIsLinkedinOutreachModalOpen}
            setEditingLinkedinOutreach={setEditingLinkedinOutreach}
            sensors={sensors}
            handleLinkedinOutreachDragStart={handleLinkedinOutreachDragStart}
            handleLinkedinOutreachDragOver={handleLinkedinOutreachDragOver}
            handleLinkedinOutreachDragEnd={handleLinkedinOutreachDragEnd}
            activeLinkedinOutreachId={activeLinkedinOutreachId}
            getLinkedinOutreachColumnOfItem={getLinkedinOutreachColumnOfItem}
            LinkedinOutreachModal={LinkedinOutreachModal}
            DeleteModal={DeleteModal}
            isLinkedinOutreachModalOpen={isLinkedinOutreachModalOpen}
            editingLinkedinOutreach={editingLinkedinOutreach}
            setIsDeletingLinkedinOutreach={setIsDeletingLinkedinOutreach}
            isDeletingLinkedinOutreach={isDeletingLinkedinOutreach}
            fetchLinkedinOutreach={fetchLinkedinOutreach}
            isDraggingLinkedinOutreachRef={isDraggingLinkedinOutreachRef}
            userIdParam={userIdParam}
          />
        )}

        {/* Events Content */}
        {activeTab === 'events' && (
          <EventsTab
            filteredEventColumns={filteredEventColumns}
            eventColumns={eventColumns}
            isLoadingEvents={isLoadingEvents}
            eventsFilter={eventsFilter}
            setEventsFilter={setEventsFilter}
            setIsEventModalOpen={setIsEventModalOpen}
            setEditingEvent={setEditingEvent}
            sensors={sensors}
            handleEventsDragStart={handleEventsDragStart}
            handleEventsDragOver={handleEventsDragOver}
            handleEventsDragEnd={handleEventsDragEnd}
            activeEventId={activeEventId}
            getEventColumnOfItem={getEventColumnOfItem}
            InPersonEventModal={InPersonEventModal}
            DeleteModal={DeleteModal}
            isEventModalOpen={isEventModalOpen}
            editingEvent={editingEvent}
            setIsDeletingEvent={setIsDeletingEvent}
            isDeletingEvent={isDeletingEvent}
            fetchEvents={fetchEvents}
            isDraggingEventRef={isDraggingEventRef}
            userIdParam={userIdParam}
          />
        )}

        {/* LeetCode Content */}
        {activeTab === 'leetcode' && (
          <LeetCodeTab
            filteredLeetColumns={filteredLeetColumns}
            leetColumns={leetColumns}
            isLoadingLeet={isLoadingLeet}
            leetFilter={leetFilter}
            setLeetFilter={setLeetFilter}
            setIsLeetModalOpen={setIsLeetModalOpen}
            setEditingLeet={setEditingLeet}
            sensors={sensors}
            handleLeetDragStart={handleLeetDragStart}
            handleLeetDragOver={handleLeetDragOver}
            handleLeetDragEnd={handleLeetDragEnd}
            activeLeetId={activeLeetId}
            getLeetColumnOfItem={getLeetColumnOfItem}
            LeetModal={LeetModal}
            DeleteModal={DeleteModal}
            isLeetModalOpen={isLeetModalOpen}
            editingLeet={editingLeet}
            setIsDeletingLeet={setIsDeletingLeet}
            isDeletingLeet={isDeletingLeet}
            fetchLeetEntries={fetchLeetEntries}
            isDraggingLeetRef={isDraggingLeetRef}
            userIdParam={userIdParam}
          />
        )}
    </main>
    </div>
  );
}

// Application Modal Component
function ApplicationModal({ 
  application, 
  onClose, 
  onSave 
}: { 
  application: Application | null; 
  onClose: () => void; 
  onSave: (data: Partial<Application>) => void;
}) {
  // ===== DATE CREATED EDITING: Helper function to convert ISO date to local date string =====
  const toLocalDate = (value: string) => {
    try {
      const date = new Date(value);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  type ApplicationFormData = {
    company: string;
    hiringManager: string;
    msgToManager: string;
    recruiter: string;
    msgToRecruiter: string;
    notes: string;
    status: ApplicationStatus;
    dateCreated: string; // ===== DATE FIELD EDITING: Added for testing/debugging =====
    dateModified: string; // ===== DATE FIELD EDITING: Added for testing/debugging =====
  };

  const [formData, setFormData] = useState<ApplicationFormData>({
    company: application?.company || '',
    hiringManager: application?.hiringManager || '',
    msgToManager: application?.msgToManager || '',
    recruiter: application?.recruiter || '',
    msgToRecruiter: application?.msgToRecruiter || '',
    notes: application?.notes || '',
    status: application?.status || 'applied',
    dateCreated: application?.dateCreated ? toLocalDate(application.dateCreated) : '', // ===== DATE FIELD EDITING =====
    dateModified: application?.dateModified ? toLocalDate(application.dateModified) : '', // ===== DATE FIELD EDITING =====
  });

  // Update form data when application changes
  useEffect(() => {
    if (application) {
      setFormData({
        company: application.company || '',
        hiringManager: application.hiringManager || '',
        msgToManager: application.msgToManager || '',
        recruiter: application.recruiter || '',
        msgToRecruiter: application.msgToRecruiter || '',
        notes: application.notes || '',
        status: application.status ?? 'applied',
        dateCreated: application.dateCreated ? toLocalDate(application.dateCreated) : '', // ===== DATE FIELD EDITING =====
        dateModified: application.dateModified ? toLocalDate(application.dateModified) : '', // ===== DATE FIELD EDITING =====
      });
    } else {
      setFormData({
        company: '',
        hiringManager: '',
        msgToManager: '',
        recruiter: '',
        msgToRecruiter: '',
        notes: '',
        status: 'applied',
        dateCreated: '', // ===== DATE FIELD EDITING =====
        dateModified: '', // ===== DATE FIELD EDITING =====
      });
    }
  }, [application]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company.trim()) {
      alert('Company name is required');
      return;
    }
    // ===== DATE FIELD EDITING: Convert date strings to ISO DateTime if provided =====
    const { dateCreated, dateModified, ...restFormData } = formData;
    const submitData: Partial<Application> = { ...restFormData };
    if (ENABLE_DATE_FIELD_EDITING) {
      if (dateCreated) {
        try {
          const date = new Date(dateCreated);
          if (!isNaN(date.getTime())) {
            submitData.dateCreated = date.toISOString();
          }
        } catch (error) {
          console.error('Error parsing dateCreated:', error);
        }
      }
      if (dateModified !== undefined) {
        try {
          if (dateModified) {
            const date = new Date(dateModified);
            if (!isNaN(date.getTime())) {
              submitData.dateModified = date.toISOString();
            }
          } else {
            submitData.dateModified = null;
          }
        } catch (error) {
          console.error('Error parsing dateModified:', error);
        }
      }
    }
    onSave(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">
            {application ? 'Edit Application' : 'Create New Application'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white font-semibold mb-2">Company *</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400"
              placeholder="Enter company name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-semibold mb-2">Hiring Manager</label>
              <input
                type="text"
                value={formData.hiringManager}
                onChange={(e) => setFormData({ ...formData, hiringManager: e.target.value })}
                className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400"
                placeholder="Hiring manager name"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Recruiter</label>
              <input
                type="text"
                value={formData.recruiter}
                onChange={(e) => setFormData({ ...formData, recruiter: e.target.value })}
                className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400"
                placeholder="Recruiter name"
              />
            </div>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Message to Hiring Manager</label>
            <textarea
              value={formData.msgToManager}
              onChange={(e) => setFormData({ ...formData, msgToManager: e.target.value })}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400 min-h-[80px]"
              placeholder="Enter message sent to hiring manager"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Message to Recruiter</label>
            <textarea
              value={formData.msgToRecruiter}
              onChange={(e) => setFormData({ ...formData, msgToRecruiter: e.target.value })}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400 min-h-[80px]"
              placeholder="Enter message sent to recruiter"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ApplicationStatus })}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
            >
              <option value="applied">Applied</option>
              <option value="messagedHiringManager">Messaged Hiring Manager</option>
              <option value="messagedRecruiter">Messaged Recruiter</option>
              <option value="followedUp">Followed Up</option>
              <option value="interview">Interview</option>
            </select>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400 min-h-[100px]"
              placeholder="Additional notes"
            />
          </div>

          {/* ===== DATE FIELD EDITING: Show dateCreated and dateModified fields when toggle is enabled ===== */}
          {ENABLE_DATE_FIELD_EDITING && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-semibold mb-2">Date Created (Testing/Debug)</label>
                <input
                  type="date"
                  value={formData.dateCreated}
                  onChange={(e) => setFormData({ ...formData, dateCreated: e.target.value })}
                  className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">Date Modified (Testing/Debug)</label>
                <input
                  type="date"
                  value={formData.dateModified}
                  onChange={(e) => setFormData({ ...formData, dateModified: e.target.value })}
                  className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-electric-blue hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
            >
              {application ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Linkedin outreach modal component
function LinkedinOutreachModal({ 
  linkedinOutreach, 
  onClose, 
  onSave 
}: { 
  linkedinOutreach: LinkedinOutreach | null; 
  onClose: () => void; 
  onSave: (data: Partial<LinkedinOutreach>) => void;
}) {
  // ===== DATE CREATED EDITING: Helper function to convert ISO date to local date string =====
  const toLocalDate = (value: string) => {
    try {
      const date = new Date(value);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  type LinkedinOutreachFormData = {
    name: string;
    company: string;
    message: string;
    linkedInUrl: string;
    notes: string;
    status: LinkedinOutreachStatus;
    recievedReferral: boolean;
    dateCreated: string; // ===== DATE FIELD EDITING: Added for testing/debugging =====
    dateModified: string; // ===== DATE FIELD EDITING: Added for testing/debugging =====
  };

  const [formData, setFormData] = useState<LinkedinOutreachFormData>({
    name: linkedinOutreach?.name || '',
    company: linkedinOutreach?.company || '',
    message: linkedinOutreach?.message || '',
    linkedInUrl: linkedinOutreach?.linkedInUrl || '',
    notes: linkedinOutreach?.notes || '',
    status: linkedinOutreach ? linkedinOutreach.status : 'outreachRequestSent',
    recievedReferral: linkedinOutreach?.recievedReferral || false,
    dateCreated: linkedinOutreach?.dateCreated ? toLocalDate(linkedinOutreach.dateCreated) : '', // ===== DATE FIELD EDITING =====
    dateModified: linkedinOutreach?.dateModified ? toLocalDate(linkedinOutreach.dateModified) : '', // ===== DATE FIELD EDITING =====
  });

  // Update form data when linkedin outreach changes
  useEffect(() => {
    if (linkedinOutreach) {
      setFormData({
        name: linkedinOutreach.name || '',
        company: linkedinOutreach.company || '',
        message: linkedinOutreach.message || '',
        linkedInUrl: linkedinOutreach.linkedInUrl || '',
        notes: linkedinOutreach.notes || '',
        status: linkedinOutreach.status,
        recievedReferral: linkedinOutreach.recievedReferral || false,
        dateCreated: linkedinOutreach.dateCreated ? toLocalDate(linkedinOutreach.dateCreated) : '', // ===== DATE FIELD EDITING =====
        dateModified: linkedinOutreach.dateModified ? toLocalDate(linkedinOutreach.dateModified) : '', // ===== DATE FIELD EDITING =====
      });
    } else {
      setFormData({
        name: '',
        company: '',
        message: '',
        linkedInUrl: '',
        notes: '',
        status: 'outreachRequestSent',
        recievedReferral: false,
        dateCreated: '', // ===== DATE FIELD EDITING =====
        dateModified: '', // ===== DATE FIELD EDITING =====
      });
    }
  }, [linkedinOutreach]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.company.trim()) {
      alert('Name and company are required');
      return;
    }
    // ===== DATE FIELD EDITING: Convert date strings to ISO DateTime if provided =====
    const { dateCreated, dateModified, ...restFormData } = formData;
    const submitData: Partial<LinkedinOutreach> = { ...restFormData };
    if (ENABLE_DATE_FIELD_EDITING) {
      if (dateCreated) {
        try {
          const date = new Date(dateCreated);
          if (!isNaN(date.getTime())) {
            submitData.dateCreated = date.toISOString();
          }
        } catch (error) {
          console.error('Error parsing dateCreated:', error);
        }
      }
      if (dateModified !== undefined) {
        try {
          if (dateModified) {
            const date = new Date(dateModified);
            if (!isNaN(date.getTime())) {
              submitData.dateModified = date.toISOString();
            }
          } else {
            submitData.dateModified = null;
          }
        } catch (error) {
          console.error('Error parsing dateModified:', error);
        }
      }
    }
    onSave(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">
            {linkedinOutreach ? 'Edit Coffee Chat' : 'Create New Coffee Chat'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-semibold mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400"
                placeholder="Person's name"
                required
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Company *</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400"
                placeholder="Company name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">LinkedIn URL</label>
            <input
              type="url"
              value={formData.linkedInUrl}
              onChange={(e) => setFormData({ ...formData, linkedInUrl: e.target.value })}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400"
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400 min-h-[100px]"
              placeholder="Message sent to the person"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as LinkedinOutreachStatus })}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
            >
              <option value="outreachRequestSent">Outreach Request Sent</option>
              <option value="accepted">Request Accepted</option>
              <option value="followedUp">Followed Up</option>
              <option value="linkedinOutreach">Coffee Chat</option>
            </select>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400 min-h-[100px]"
              placeholder="Additional notes"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="recievedReferral"
              checked={formData.recievedReferral}
              onChange={(e) => setFormData({ ...formData, recievedReferral: e.target.checked })}
              className="w-4 h-4 bg-gray-700 border border-light-steel-blue rounded text-electric-blue focus:ring-electric-blue"
            />
            <label htmlFor="recievedReferral" className="ml-2 text-white font-semibold">
              Received Referral
            </label>
          </div>

          {/* ===== DATE FIELD EDITING: Show dateCreated and dateModified fields when toggle is enabled ===== */}
          {ENABLE_DATE_FIELD_EDITING && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-semibold mb-2">Date Created (Testing/Debug)</label>
                <input
                  type="date"
                  value={formData.dateCreated}
                  onChange={(e) => setFormData({ ...formData, dateCreated: e.target.value })}
                  className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">Date Modified (Testing/Debug)</label>
                <input
                  type="date"
                  value={formData.dateModified}
                  onChange={(e) => setFormData({ ...formData, dateModified: e.target.value })}
                  className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-electric-blue hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
            >
              {linkedinOutreach ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Confirmation Modal
function DeleteModal({ 
  onConfirm, 
  onCancel 
}: { 
  onConfirm: () => void; 
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-white mb-4">Delete Item</h3>
        <p className="text-gray-300 mb-6">Are you sure you want to delete this item? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// In-Person Event Modal Component
function InPersonEventModal({
  eventItem,
  onClose,
  onSave,
}: {
  eventItem: InPersonEvent | null;
  onClose: () => void;
  onSave: (data: Partial<InPersonEvent> & { date?: string }) => void;
}) {
  const toLocalDate = (value: string) => {
    try {
      const date = new Date(value);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  const toLocalTime = (value: string) => {
    try {
      const date = new Date(value);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  type EventFormData = {
    event: string;
    date: string;
    timeHour: string;
    timeMinute: string;
    timePeriod: 'AM' | 'PM';
    location: string;
    url: string;
    notes: string;
    status: InPersonEventStatus;
    numPeopleSpokenTo: string;
    numLinkedInRequests: string;
    numOfInterviews: string;
    careerFair: boolean;
    dateCreated: string; // ===== DATE FIELD EDITING: Added for testing/debugging =====
    dateModified: string; // ===== DATE FIELD EDITING: Added for testing/debugging =====
  };

  const [formData, setFormData] = useState<EventFormData>({
    event: eventItem?.event ?? '',
    date: eventItem?.date ? toLocalDate(eventItem.date) : '',
    timeHour: eventItem?.date ? toLocalTimeParts(eventItem.date).hour : '',
    timeMinute: eventItem?.date ? toLocalTimeParts(eventItem.date).minute : '',
    timePeriod: eventItem?.date ? toLocalTimeParts(eventItem.date).period : 'AM',
    location: eventItem?.location ?? '',
    url: eventItem?.url ?? '',
    notes: eventItem?.notes ?? '',
    status: eventItem?.status ?? 'scheduled',
    numPeopleSpokenTo: eventItem?.numPeopleSpokenTo?.toString() ?? '',
    numLinkedInRequests: eventItem?.numLinkedInRequests?.toString() ?? '',
    numOfInterviews: eventItem?.numOfInterviews?.toString() ?? '',
    careerFair: eventItem?.careerFair ?? false,
    dateCreated: eventItem?.dateCreated ? toLocalDate(eventItem.dateCreated) : '', // ===== DATE FIELD EDITING =====
    dateModified: eventItem?.dateModified ? toLocalDate(eventItem.dateModified) : '', // ===== DATE FIELD EDITING =====
  });

  useEffect(() => {
    const timeParts = eventItem?.date ? toLocalTimeParts(eventItem.date) : { hour: '', minute: '', period: 'AM' as const };
    setFormData({
      event: eventItem?.event ?? '',
      date: eventItem?.date ? toLocalDate(eventItem.date) : '',
      timeHour: timeParts.hour,
      timeMinute: timeParts.minute,
      timePeriod: timeParts.period,
      location: eventItem?.location ?? '',
      url: eventItem?.url ?? '',
      notes: eventItem?.notes ?? '',
      status: eventItem?.status ?? 'scheduled',
      numPeopleSpokenTo: eventItem?.numPeopleSpokenTo?.toString() ?? '',
      numLinkedInRequests: eventItem?.numLinkedInRequests?.toString() ?? '',
      numOfInterviews: eventItem?.numOfInterviews?.toString() ?? '',
      careerFair: eventItem?.careerFair ?? false,
      dateCreated: eventItem?.dateCreated ? toLocalDate(eventItem.dateCreated) : '', // ===== DATE FIELD EDITING =====
      dateModified: eventItem?.dateModified ? toLocalDate(eventItem.dateModified) : '', // ===== DATE FIELD EDITING =====
    });
  }, [eventItem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.event.trim()) {
      alert('Event name is required');
      return;
    }
    if (!formData.date) {
      alert('Event date is required');
      return;
    }

    const combinedDate = (() => {
      const datePart = formData.date;
      const hasTimeSelection = formData.timeHour !== '' || formData.timeMinute !== '';

      let hour24 = 0;
      let minute = 0;

      if (hasTimeSelection) {
        let hour12 = parseInt(formData.timeHour || '12', 10);
        if (Number.isNaN(hour12) || hour12 < 1 || hour12 > 12) {
          hour12 = 12;
        }

        minute = parseInt(formData.timeMinute || '0', 10);
        if (Number.isNaN(minute) || minute < 0 || minute > 59) {
          minute = 0;
        }

        if (formData.timePeriod === 'PM') {
          hour24 = hour12 === 12 ? 12 : hour12 + 12;
        } else {
          hour24 = hour12 === 12 ? 0 : hour12;
        }
      }

      const timePart = `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      try {
        const iso = new Date(`${datePart}T${timePart}`).toISOString();
        return iso;
      } catch {
        return undefined;
      }
    })();

    if (!combinedDate) {
      alert('Invalid date or time');
      return;
    }

    // ===== DATE FIELD EDITING: Convert date strings to ISO DateTime if provided =====
    const saveData: Partial<InPersonEvent> & { date?: string } = {
      event: formData.event.trim(),
      date: combinedDate,
      location: formData.location ? formData.location.trim() : null,
      url: formData.url ? formData.url.trim() : null,
      notes: formData.notes ? formData.notes.trim() : null,
      status: formData.status,
      numPeopleSpokenTo: formData.numPeopleSpokenTo !== '' ? Number(formData.numPeopleSpokenTo) : null,
      numLinkedInRequests: formData.numLinkedInRequests !== '' ? Number(formData.numLinkedInRequests) : null,
      numOfInterviews: formData.numOfInterviews !== '' ? Number(formData.numOfInterviews) : null,
      careerFair: formData.careerFair,
    };
    if (ENABLE_DATE_FIELD_EDITING) {
      if (formData.dateCreated) {
        try {
          const date = new Date(formData.dateCreated);
          if (!isNaN(date.getTime())) {
            saveData.dateCreated = date.toISOString();
          }
        } catch (error) {
          console.error('Error parsing dateCreated:', error);
        }
      }
      if (formData.dateModified !== undefined) {
        try {
          if (formData.dateModified) {
            const date = new Date(formData.dateModified);
            if (!isNaN(date.getTime())) {
              saveData.dateModified = date.toISOString();
            }
          } else {
            saveData.dateModified = null;
          }
        } catch (error) {
          console.error('Error parsing dateModified:', error);
        }
      }
    }
    onSave(saveData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">
            {eventItem ? 'Edit Event' : 'Create New Event'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-semibold mb-2">Event Name *</label>
              <input
                type="text"
                value={formData.event}
                onChange={(e) => setFormData(prev => ({ ...prev, event: e.target.value }))}
                className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400"
                placeholder="Conference, Meetup, etc."
                required
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-semibold mb-2">Time</label>
              <div className="flex gap-2">
                <select
                  value={formData.timeHour}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeHour: e.target.value }))}
                  className="w-20 bg-gray-700 border border-light-steel-blue rounded-lg px-3 py-2 text-white"
                >
                  {hourOptions.map(hour => (
                    <option key={hour} value={hour}>{hour}</option>
                  ))}
                </select>
                <select
                  value={formData.timeMinute}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeMinute: e.target.value }))}
                  className="w-20 bg-gray-700 border border-light-steel-blue rounded-lg px-3 py-2 text-white"
                >
                  {minuteOptions.map(minute => (
                    <option key={minute} value={minute}>{minute}</option>
                  ))}
                </select>
                <select
                  value={formData.timePeriod}
                  onChange={(e) => setFormData(prev => ({ ...prev, timePeriod: e.target.value as 'AM' | 'PM' }))}
                  className="w-20 bg-gray-700 border border-light-steel-blue rounded-lg px-3 py-2 text-white"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400"
                placeholder="City, Online, etc."
              />
            </div>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Event URL</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400"
              placeholder="https://example.com/event"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as InPersonEventStatus }))}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
            >
              <option value="scheduled">Scheduled</option>
              <option value="attended">Attended</option>
              <option value="linkedinRequestsSent">LinkedIn Requests Sent</option>
              <option value="followUp">Followed Up</option>
            </select>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400 min-h-[100px]"
              placeholder="Additional details or outcomes"
            />
          </div>

          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="careerFair"
              checked={formData.careerFair}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                careerFair: e.target.checked,
                numOfInterviews: e.target.checked ? prev.numOfInterviews : ''
              }))}
              className="w-4 h-4 bg-gray-700 border border-light-steel-blue rounded text-electric-blue focus:ring-electric-blue"
            />
            <label htmlFor="careerFair" className="ml-2 text-white font-semibold">
              This is a career fair
            </label>
          </div>

          <div className={`grid gap-4 ${formData.careerFair ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <div>
              <label className="block text-white font-semibold mb-2">No. of People Spoken To</label>
              <input
                type="number"
                min={0}
                value={formData.numPeopleSpokenTo}
                onChange={(e) => setFormData(prev => ({ ...prev, numPeopleSpokenTo: e.target.value }))}
                placeholder="#"
                className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">No. of LinkedIn Requests</label>
              <input
                type="number"
                min={0}
                value={formData.numLinkedInRequests}
                onChange={(e) => setFormData(prev => ({ ...prev, numLinkedInRequests: e.target.value }))}
                placeholder="#"
                className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400"
              />
            </div>
            {formData.careerFair && (
              <div>
                <label className="block text-white font-semibold mb-2">No. of Interviews</label>
                <input
                  type="number"
                  min={0}
                  value={formData.numOfInterviews}
                  onChange={(e) => setFormData(prev => ({ ...prev, numOfInterviews: e.target.value }))}
                  placeholder="#"
                  className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400"
                />
              </div>
            )}
          </div>

          {/* ===== DATE FIELD EDITING: Show dateCreated and dateModified fields when toggle is enabled ===== */}
          {ENABLE_DATE_FIELD_EDITING && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-semibold mb-2">Date Created (Testing/Debug)</label>
                <input
                  type="date"
                  value={formData.dateCreated}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateCreated: e.target.value }))}
                  className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">Date Modified (Testing/Debug)</label>
                <input
                  type="date"
                  value={formData.dateModified}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateModified: e.target.value }))}
                  className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-electric-blue hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
            >
              {eventItem ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LeetModal({
  entry,
  onClose,
  onSave,
}: {
  entry: LeetEntry | null;
  onClose: () => void;
  onSave: (data: Partial<LeetEntry>) => void;
}) {
  // ===== DATE CREATED EDITING: Helper function to convert ISO date to local date string =====
  const toLocalDate = (value: string) => {
    try {
      const date = new Date(value);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  type LeetFormData = {
    problem: string;
    problemType: string;
    difficulty: string;
    url: string;
    reflection: string;
    status: LeetStatus;
    dateCreated: string; // ===== DATE FIELD EDITING: Added for testing/debugging =====
    dateModified: string; // ===== DATE FIELD EDITING: Added for testing/debugging =====
  };

  const [formData, setFormData] = useState<LeetFormData>({
    problem: entry?.problem ?? '',
    problemType: entry?.problemType ?? '',
    difficulty: entry?.difficulty ?? '',
    url: entry?.url ?? '',
    reflection: entry?.reflection ?? '',
    status: entry?.status ?? 'planned',
    dateCreated: entry?.dateCreated ? toLocalDate(entry.dateCreated) : '', // ===== DATE FIELD EDITING =====
    dateModified: entry?.dateModified ? toLocalDate(entry.dateModified) : '', // ===== DATE FIELD EDITING =====
  });
  const [isLeetHelpOpen, setIsLeetHelpOpen] = useState(false);
  const tooltipRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!isLeetHelpOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsLeetHelpOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLeetHelpOpen]);

  // ===== DATE FIELD EDITING: Update form data when entry changes =====
  useEffect(() => {
    if (entry) {
      setFormData({
        problem: entry.problem ?? '',
        problemType: entry.problemType ?? '',
        difficulty: entry.difficulty ?? '',
        url: entry.url ?? '',
        reflection: entry.reflection ?? '',
        status: entry.status ?? 'planned',
        dateCreated: entry.dateCreated ? toLocalDate(entry.dateCreated) : '',
        dateModified: entry.dateModified ? toLocalDate(entry.dateModified) : '',
      });
    } else {
      setFormData({
        problem: '',
        problemType: '',
        difficulty: '',
        url: '',
        reflection: '',
        status: 'planned',
        dateCreated: '',
        dateModified: '',
      });
    }
  }, [entry]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.problem.trim()) {
      alert('Problem name is required');
      return;
    }

    // ===== DATE FIELD EDITING: Convert date strings to ISO DateTime if provided =====
    const submitData: Partial<LeetEntry> = {
      problem: formData.problem.trim(),
      problemType: formData.problemType ? formData.problemType.trim() : null,
      difficulty: formData.difficulty ? formData.difficulty.trim() : null,
      url: formData.url ? formData.url.trim() : null,
      reflection: formData.reflection ? formData.reflection.trim() : null,
      status: formData.status,
    };
    if (ENABLE_DATE_FIELD_EDITING) {
      if (formData.dateCreated) {
        try {
          const date = new Date(formData.dateCreated);
          if (!isNaN(date.getTime())) {
            submitData.dateCreated = date.toISOString();
          }
        } catch (error) {
          console.error('Error parsing dateCreated:', error);
        }
      }
      if (formData.dateModified !== undefined) {
        try {
          if (formData.dateModified) {
            const date = new Date(formData.dateModified);
            if (!isNaN(date.getTime())) {
              submitData.dateModified = date.toISOString();
            }
          } else {
            submitData.dateModified = null;
          }
        } catch (error) {
          console.error('Error parsing dateModified:', error);
        }
      }
    }
    onSave(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">{entry ? 'Edit Problem' : 'Log New Problem'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white font-semibold mb-2">Problem *</label>
            <input
              type="text"
              value={formData.problem}
              onChange={(e) => setFormData(prev => ({ ...prev, problem: e.target.value }))}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400"
              placeholder="Problem title"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-semibold mb-2">
                <span className="flex items-center gap-2">
                  Data Structure / Algorithm
                  <span ref={tooltipRef} className="relative inline-flex items-center">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setIsLeetHelpOpen((prev: boolean) => !prev)}
                      onFocus={() => setIsLeetHelpOpen(true)}
                      onBlur={() => setIsLeetHelpOpen(false)}
                      className="w-4 h-4 flex items-center justify-center rounded-full bg-electric-blue text-gray-900 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-electric-blue/60"
                      aria-label="What data structure or algorithm was used?"
                    >
                      ?
                    </button>
                    {isLeetHelpOpen && (
                      <div className="absolute left-1/2 -translate-x-1/2 mt-3 w-72 px-3 py-2 rounded-lg bg-gray-900 text-white text-xs shadow-lg z-10">
                        What data structure, algorithm, or other problem solving technique was needed to solve this problem?
                      </div>
                    )}
                  </span>
                </span>
              </label>
              <input
                type="text"
                value={formData.problemType}
                onChange={(e) => setFormData(prev => ({ ...prev, problemType: e.target.value }))}
                className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400"
                placeholder="Arrays, DP, Graphs, ..."
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
              >
                <option value="">Select difficulty</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Problem URL</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400"
              placeholder="https://leetcode.com/problems/..."
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Signal / Cue</label>
            <textarea
              value={formData.reflection}
              onChange={(e) => setFormData(prev => ({ ...prev, reflection: e.target.value }))}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400 min-h-[120px]"
              placeholder="Was there anything in the original problem description that signaled to you that this problem requires the data structure/algorithm you listed above?"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as LeetStatus }))}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
            >
              <option value="planned">Planned</option>
              <option value="solved">Solved</option>
              <option value="reflected">Reflected</option>
            </select>
          </div>

          {/* ===== DATE FIELD EDITING: Show dateCreated and dateModified fields when toggle is enabled ===== */}
          {ENABLE_DATE_FIELD_EDITING && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-semibold mb-2">Date Created (Testing/Debug)</label>
                <input
                  type="date"
                  value={formData.dateCreated}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateCreated: e.target.value }))}
                  className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">Date Modified (Testing/Debug)</label>
                <input
                  type="date"
                  value={formData.dateModified}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateModified: e.target.value }))}
                  className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-electric-blue hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
            >
              {entry ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
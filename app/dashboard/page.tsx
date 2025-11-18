'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent, type DragOverEvent, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Gauge, FileText, MessageCircle, Users, Code, CalendarCheck, Plus, X, Trash2 } from 'lucide-react';

const hourOptions = ['01','02','03','04','05','06','07','08','09','10','11','12'];
const minuteOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

// ===== PROJECTED OFFER DATE FORMULA START =====
// Copied from onboarding page3-v2 so product engineers can tweak independently.
function calculateProjectedOfferDate(
  appsWithOutreachPerWeek: number,
  linkedinOutreachPerWeek: number,
  inPersonEventsPerMonth: number,
  careerFairsPerYear: number,
  referenceDate?: Date
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
    return new Date();
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

// ===== DATE CREATED EDITING TOGGLE START =====
// Toggle this flag to enable editing dateCreated in create/edit modals for testing and debugging.
// When enabled, a date input field will appear in all modals allowing you to set/change the dateCreated value.
// The date will be properly saved to the database as a DateTime when creating or updating records.
const ENABLE_DATE_CREATED_EDITING = true;
// ===== DATE CREATED EDITING TOGGLE END =====

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

const formatCardDate = (value?: string | null) => {
  if (!value) return '-';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '-';
  }
};

function CardDateMeta({
  created,
  completed,
  className,
}: {
  created?: string | null;
  completed?: string | null;
  className?: string;
}) {
  return (
    <div className={className ? className : 'mt-3'}>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-400 mb-1">
        <span>Created:</span>
        <span>Completed:</span>
      </div>
      <div className="flex items-center justify-between text-xs text-yellow-400">
        <span>{formatCardDate(created)}</span>
        <span>{formatCardDate(completed)}</span>
      </div>
    </div>
  );
}

type ApplicationStatus = 'applied' | 'messagedRecruiter' | 'messagedHiringManager' | 'followedUp' | 'interview';
type ApplicationColumnId = 'applied' | 'messagedRecruiter' | 'messagedHiringManager' | 'followedUp' | 'interview';

type LinkedinOutreachStatus = 'outreachRequestSent' | 'accepted' | 'followedUp' | 'linkedinOutreach';
type LinkedinOutreachColumnId = 'outreach' | 'accepted' | 'followedUpLinkedin' | 'linkedinOutreach';

type InPersonEventStatus = 'scheduled' | 'attended' | 'linkedinRequestsSent' | 'followUp';
type EventColumnId = 'upcoming' | 'attended' | 'linkedinRequestsSent' | 'followups';

type LeetStatus = 'planned' | 'solved' | 'reflected';
type LeetColumnId = 'planned' | 'solved' | 'reflected';

type BoardTimeFilter = 'currentMonth' | 'allTime';

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
  dateCompleted?: string | null;
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
  dateCompleted?: string | null;
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
  dateCompleted?: string | null;
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
  dateCompleted?: string | null;
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
  const [applicationsFilter, setApplicationsFilter] = useState<BoardTimeFilter>('currentMonth');
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
      const response = await fetch('/api/applications_with_outreach');
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
      const newDateCompleted = APPLICATION_COMPLETION_COLUMNS.includes(toCol)
        ? new Date().toISOString()
        : null;
      const updatedItem: Application = {
        ...movingItem,
        status: newStatus,
        dateCompleted: newDateCompleted,
      };
      const newTo = [...toItems.slice(0, insertIndex), updatedItem, ...toItems.slice(insertIndex)];
      setAppColumns(prev => ({ ...prev, [fromCol]: newFrom, [toCol]: newTo }));
      
      // Update status in database
      try {
        const response = await fetch(`/api/applications_with_outreach?id=${movingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, dateCompleted: newDateCompleted }),
        });
        if (!response.ok) throw new Error('Failed to update status');
        
        // Update the application in the main list
      } catch (error) {
        console.error('Error updating status:', error);
        // Revert on error
        fetchApplications();
      }
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

  function SortableAppCard(props: { card: Application }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(props.card.id) });
    
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0 : undefined,
    } as React.CSSProperties;

    const handleClick = (e: React.MouseEvent) => {
      // Prevent opening modal if this card was just dragged
      if (activeAppId === String(props.card.id)) {
        return;
      }
      // Small delay to check if drag started
      setTimeout(() => {
        if (!isDraggingAppRef.current && !isDragging && activeAppId !== String(props.card.id)) {
          setEditingApp(props.card);
          setIsModalOpen(true);
        }
      }, 50);
    };

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsDeleting(props.card.id);
    };

    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        {...attributes} 
        {...listeners}
        onClick={handleClick}
        className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-pointer hover:border-electric-blue transition-colors group relative"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="text-white font-medium mb-1">{props.card.company}</div>
            {props.card.hiringManager && (
              <div className="text-gray-400 text-xs mb-1">HM: {props.card.hiringManager}</div>
            )}
            {props.card.recruiter && (
              <div className="text-gray-400 text-xs mb-1">Recruiter: {props.card.recruiter}</div>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleDelete}
              className="p-1 hover:bg-red-600 rounded text-gray-300 hover:text-white"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        {(props.card.msgToManager || props.card.msgToRecruiter) && (
          <div className="text-green-400 text-xs mb-2">
            {props.card.msgToManager && '✓ Messaged HM'}
            {props.card.msgToManager && props.card.msgToRecruiter && ' • '}
            {props.card.msgToRecruiter && '✓ Messaged Recruiter'}
          </div>
        )}
        {props.card.notes && (
          <div className="text-gray-400 text-xs mb-2 line-clamp-2">{props.card.notes}</div>
        )}
        <CardDateMeta created={props.card.dateCreated} completed={props.card.dateCompleted} />
      </div>
    );
  }

  function DroppableColumn(props: { id: string; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id: props.id });
    return (
      <div ref={setNodeRef} className={`space-y-3 min-h-32 ${isOver ? 'outline outline-2 outline-electric-blue/60 outline-offset-2 bg-gray-650/40' : ''}`}>
        {props.children}
        {/* When empty, provide space to drop */}
        <div className="h-2"></div>
      </div>
    );
  }

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
  const [linkedinOutreachFilter, setLinkedinOutreachFilter] = useState<BoardTimeFilter>('currentMonth');
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
      const response = await fetch('/api/linkedin_outreach');
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
  }, []);

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
      const newDateCompleted = LINKEDIN_COMPLETION_COLUMNS.includes(toCol)
        ? new Date().toISOString()
        : null;
      const updatedItem: LinkedinOutreach = {
        ...movingItem,
        status: newStatus,
        dateCompleted: newDateCompleted,
      };
      const newFrom = [...fromItems.slice(0, movingIndex), ...fromItems.slice(movingIndex + 1)];
      const newTo = [...toItems.slice(0, insertIndex), updatedItem, ...toItems.slice(insertIndex)];
      setLinkedinOutreachColumns(prev => ({ ...prev, [fromCol]: newFrom, [toCol]: newTo }));

      try {
        const response = await fetch(`/api/linkedin_outreach?id=${movingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, dateCompleted: newDateCompleted }),
        });
        if (!response.ok) throw new Error('Failed to update LinkedIn outreach status');

      } catch (error) {
        console.error('Error updating LinkedIn outreach status:', error);
        fetchLinkedinOutreach();
      }
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
  const [eventsFilter, setEventsFilter] = useState<BoardTimeFilter>('currentMonth');
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
      const response = await fetch('/api/in_person_events');
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
  }, []);

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
      const newDateCompleted = EVENT_COMPLETION_COLUMNS.includes(toCol)
        ? new Date().toISOString()
        : null;
      const updatedItem: InPersonEvent = {
        ...movingItem,
        status: newStatus,
        dateCompleted: newDateCompleted,
      };
      const newTo = [...toItems.slice(0, insertIndex), updatedItem, ...toItems.slice(insertIndex)];
      setEventColumns(prev => ({ ...prev, [fromCol]: newFrom, [toCol]: newTo }));

      try {
        const response = await fetch(`/api/in_person_events?id=${movingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, dateCompleted: newDateCompleted }),
        });
        if (!response.ok) throw new Error('Failed to update event status');

      } catch (error) {
        console.error('Error updating event status:', error);
        fetchEvents();
      }
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
  const [leetFilter, setLeetFilter] = useState<BoardTimeFilter>('currentMonth');
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
      const response = await fetch('/api/leetcode');
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
  }, []);

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
      const newDateCompleted = LEET_COMPLETION_COLUMNS.includes(toCol)
        ? new Date().toISOString()
        : null;
      const updatedItem: LeetEntry = {
        ...movingItem,
        status: newStatus,
        dateCompleted: newDateCompleted,
      };
      const newTo = [...toItems.slice(0, insertIndex), updatedItem, ...toItems.slice(insertIndex)];
      setLeetColumns(prev => ({ ...prev, [fromCol]: newFrom, [toCol]: newTo }));

      try {
        const response = await fetch(`/api/leetcode?id=${movingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, dateCompleted: newDateCompleted }),
        });
        if (!response.ok) throw new Error('Failed to update LeetCode status');

      } catch (error) {
        console.error('Error updating LeetCode status:', error);
        fetchLeetEntries();
      }
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

  function SortableLinkedinOutreachCard(props: { card: LinkedinOutreach }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(props.card.id) });
    
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0 : undefined,
    } as React.CSSProperties;

    const handleClick = (e: React.MouseEvent) => {
      // Prevent opening modal if this card was just dragged
      if (activeLinkedinOutreachId === String(props.card.id)) {
        return;
      }
      // Small delay to check if drag started
      setTimeout(() => {
        if (!isDraggingLinkedinOutreachRef.current && !isDragging && activeLinkedinOutreachId !== String(props.card.id)) {
          setEditingLinkedinOutreach(props.card);
          setIsLinkedinOutreachModalOpen(true);
        }
      }, 50);
    };

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsDeletingLinkedinOutreach(props.card.id);
    };

    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        {...attributes} 
        {...listeners}
        onClick={handleClick}
        className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-pointer hover:border-electric-blue transition-colors group relative"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="text-white font-medium mb-1">{props.card.name}</div>
            <div className="text-gray-400 text-xs mb-1">{props.card.company}</div>
            {props.card.linkedInUrl && (
              <div className="text-xs mb-1">
                <a
                  href={props.card.linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-electric-blue hover:text-sky-300 underline"
                >
                  LinkedIn Profile
                </a>
              </div>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleDelete}
              className="p-1 hover:bg-red-600 rounded text-gray-300 hover:text-white"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        {props.card.message && (
          <div className="text-gray-400 text-xs mb-2 line-clamp-2">{props.card.message}</div>
        )}
        {props.card.notes && (
          <div className="text-gray-400 text-xs mb-2 line-clamp-2">{props.card.notes}</div>
        )}
        {props.card.recievedReferral && (
          <div className="text-green-400 text-xs mb-2">✓ Referral Received</div>
        )}
        <CardDateMeta created={props.card.dateCreated} completed={props.card.dateCompleted} />
      </div>
    );
  }

  function SortableEventCard(props: { card: InPersonEvent }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(props.card.id) });
    
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0 : undefined,
    } as React.CSSProperties;

    const formatDateTime = (dateString: string) => {
      try {
        const date = new Date(dateString);
        return date.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });
      } catch {
        return '';
      }
    };

    const handleClick = (e: React.MouseEvent) => {
      // Prevent opening modal if this card was just dragged
      if (activeEventId === String(props.card.id)) {
        return;
      }
      // Small delay to check if drag started
      setTimeout(() => {
        if (!isDraggingEventRef.current && !isDragging && activeEventId !== String(props.card.id)) {
          setEditingEvent(props.card);
          setIsEventModalOpen(true);
        }
      }, 50);
    };

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsDeletingEvent(props.card.id);
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={handleClick}
        className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-pointer hover:border-electric-blue transition-colors group relative"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="text-white font-medium mb-1">{props.card.event}</div>
            <div className="text-gray-400 text-xs mb-1">{formatDateTime(props.card.date)}</div>
            {props.card.location && (
              <div className="text-gray-400 text-xs mb-1">{props.card.location}</div>
            )}
            {props.card.url && (
              <div className="text-gray-500 text-xs mb-1">
                <a
                  href={props.card.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="hover:text-electric-blue underline"
                >
                  Event Link
                </a>
              </div>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleDelete}
              className="p-1 hover:bg-red-600 rounded text-gray-300 hover:text-white"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        {props.card.notes && (
          <div className="text-gray-400 text-xs mb-2 line-clamp-2">{props.card.notes}</div>
        )}
        <div className="flex flex-wrap gap-2 text-[10px] text-gray-300">
          {props.card.careerFair && (
            <span className="text-green-400 text-xs">✓ Career Fair</span>
          )}
          {typeof props.card.numPeopleSpokenTo === 'number' && (
            <span className="px-2 py-0.5 rounded-full bg-gray-700">Spoke to {props.card.numPeopleSpokenTo}</span>
          )}
          {typeof props.card.numLinkedInRequests === 'number' && (
            <span className="px-2 py-0.5 rounded-full bg-gray-700">LinkedIn {props.card.numLinkedInRequests}</span>
          )}
          {typeof props.card.numOfInterviews === 'number' && (
            <span className="px-2 py-0.5 rounded-full bg-gray-700">Interviews {props.card.numOfInterviews}</span>
          )}
        </div>
        <CardDateMeta created={props.card.dateCreated} completed={props.card.dateCompleted} className="mt-3" />
      </div>
    );
  }

  function SortableLeetCard(props: { card: LeetEntry }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(props.card.id) });
    
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0 : undefined,
    } as React.CSSProperties;

    const handleClick = (e: React.MouseEvent) => {
      // Prevent opening modal if this card was just dragged
      if (activeLeetId === String(props.card.id)) {
        return;
      }
      // Small delay to check if drag started
      setTimeout(() => {
        if (!isDraggingLeetRef.current && !isDragging && activeLeetId !== String(props.card.id)) {
          setEditingLeet(props.card);
          setIsLeetModalOpen(true);
        }
      }, 50);
    };

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsDeletingLeet(props.card.id);
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={handleClick}
        className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-pointer hover:border-electric-blue transition-colors group relative"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="text-white font-medium mb-1">{props.card.problem?.trim() || 'Untitled Problem'}</div>
            <div className="text-gray-400 text-xs mb-1">
              {props.card.problemType ? props.card.problemType : '—'}
            </div>
            {props.card.difficulty && (
              <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-electric-blue/20 text-electric-blue uppercase tracking-wide">
                {props.card.difficulty}
              </span>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleDelete}
              className="p-1 hover:bg-red-600 rounded text-gray-300 hover:text-white"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        {props.card.url && (
          <div className="text-gray-500 text-xs mb-2">
            <a
              href={props.card.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hover:text-electric-blue underline"
            >
              Problem Link
            </a>
          </div>
        )}
        {props.card.reflection && (
          <div className="text-gray-400 text-xs mb-2 line-clamp-3">{props.card.reflection}</div>
        )}
        <CardDateMeta created={props.card.dateCreated} completed={props.card.dateCompleted} className="mt-3" />
      </div>
    );
  }

  const [userData, setUserData] = useState<{
    appsWithOutreachPerWeek?: number | null;
    linkedinOutreachPerWeek?: number | null;
    targetOfferDate?: string | null;
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

  useEffect(() => {
    if (ENABLE_DASHBOARD_MOCKS) return;
    let isMounted = true;
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/users/onboarding2');
        if (!res.ok) return;
        const user = await res.json();
        if (isMounted) {
          setUserData(user);
          if (user?.targetOfferDate) {
            const d = new Date(user.targetOfferDate);
            if (!isNaN(d.getTime())) setTargetOfferDate(d);
          }
        }
      } catch (e) {
        // non-fatal: leave as null
      }
    };
    fetchUser();
    return () => { isMounted = false; };
  }, []);

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
    const appsPerWeekRaw = applicationsMetrics.count / PROJECTED_WEEKS_PER_MONTH;
    const linkedinPerWeekRaw = linkedinOutreachMetrics.count / PROJECTED_WEEKS_PER_MONTH;
    const appsPerWeek = Number.isFinite(appsPerWeekRaw) ? appsPerWeekRaw : 0;
    const linkedinPerWeek = Number.isFinite(linkedinPerWeekRaw) ? linkedinPerWeekRaw : 0;
    const eventsPerMonth = Number.isFinite(eventsMetrics.count) ? eventsMetrics.count : 0;
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
    applicationsMetrics.count,
    linkedinOutreachMetrics.count,
    eventsMetrics.count,
    careerFairsThisYear,
    careerFairPlanGoal,
    careerFairProgress,
    derivedPlanStartDate,
    userData?.careerFairsPerYear,
    userData?.resetStartDate,
  ]);

  const projectedOfferDateText = useMemo(() => {
    try {
      return projectedOfferDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return '—';
    }
  }, [projectedOfferDate]);

  useEffect(() => {
    if (!projectedOfferDate) return;
    const iso = projectedOfferDate.toISOString();
    if (lastProjectedOfferSyncRef.current === iso) return;

    const controller = new AbortController();

    fetch('/api/users/projected-offer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectedOfferDate: iso }),
      signal: controller.signal,
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to update projected offer date');
        }
        lastProjectedOfferSyncRef.current = iso;
      })
      .catch(error => {
        if (controller.signal.aborted) return;
        console.error('Error syncing projected offer date:', error);
      });

    return () => controller.abort();
  }, [projectedOfferDate]);

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
      filtered[columnId] = appColumns[columnId].filter(app => isWithinCurrentMonth(app.dateCreated));
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
      filtered[columnId] = linkedinOutreachColumns[columnId].filter(entry =>
        isWithinCurrentMonth(entry.dateCreated)
      );
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
      filtered[columnId] = eventColumns[columnId].filter(event =>
        isWithinCurrentMonth(event.date)
      );
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
      filtered[columnId] = leetColumns[columnId].filter(entry =>
        isWithinCurrentMonth(entry.dateCreated)
      );
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
    <div className="bg-gray-900 text-white min-h-screen">
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
          <div>
            {/* Target Offer Date (question-box styling) */
            }
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
                </div>
              </div>
              <div className="mt-2 text-left">
                <Link href="/onboarding/page3-v2" className="text-sm text-gray-300 hover:text-white underline underline-offset-2">
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
        )}

        {/* Applications Content */}
        {activeTab === 'applications' && (
          <section className="bg-gray-800 border border-light-steel-blue rounded-lg p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h4 className="text-xl font-bold text-white">High Quality Applications</h4>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span>Show:</span>
                <button
                  onClick={() => setApplicationsFilter('currentMonth')}
                  className={`px-3 py-1 rounded-md border transition-colors ${
                    applicationsFilter === 'currentMonth'
                      ? 'bg-electric-blue text-white border-electric-blue'
                      : 'bg-gray-700 text-gray-300 border-transparent hover:border-light-steel-blue'
                  }`}
                >
                  Current Month
                </button>
                <button
                  onClick={() => setApplicationsFilter('allTime')}
                  className={`px-3 py-1 rounded-md border transition-colors ${
                    applicationsFilter === 'allTime'
                      ? 'bg-electric-blue text-white border-electric-blue'
                      : 'bg-gray-700 text-gray-300 border-transparent hover:border-light-steel-blue'
                  }`}
                >
                  All Time
                </button>
              </div>
              <button 
                onClick={() => {
                  setEditingApp(null);
                  setIsModalOpen(true);
                }}
                className="bg-electric-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
              >
                <Plus className="mr-2" />Add Application
              </button>
            </div>
            {isLoading ? (
              <div className="text-center py-8 text-gray-400">Loading applications...</div>
            ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleApplicationsDragStart} onDragOver={handleApplicationsDragOver} onDragEnd={handleApplicationsDragEnd}>
              <div className="grid grid-cols-5 gap-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    Applied ({filteredAppColumns.applied.length})
                  </h5>
                  <SortableContext items={filteredAppColumns.applied.map(c => c.id)} strategy={rectSortingStrategy}>
                    <DroppableColumn id="applied">
                      {filteredAppColumns.applied.map(card => (
                        <SortableAppCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    Messaged Hiring Manager ({filteredAppColumns.messagedHiringManager.length})
                  </h5>
                  <SortableContext items={filteredAppColumns.messagedHiringManager.map(c => c.id)} strategy={rectSortingStrategy}>
                    <DroppableColumn id="messagedHiringManager">
                      {filteredAppColumns.messagedHiringManager.map(card => (
                        <SortableAppCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    Messaged Recruiter ({filteredAppColumns.messagedRecruiter.length})
                  </h5>
                  <SortableContext items={filteredAppColumns.messagedRecruiter.map(c => c.id)} strategy={rectSortingStrategy}>
                    <DroppableColumn id="messagedRecruiter">
                      {filteredAppColumns.messagedRecruiter.map(card => (
                        <SortableAppCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    Followed Up ({filteredAppColumns.followedUp.length})
                  </h5>
                  <SortableContext items={filteredAppColumns.followedUp.map(c => c.id)} strategy={rectSortingStrategy}>
                    <DroppableColumn id="followedUp">
                      {filteredAppColumns.followedUp.map(card => (
                        <SortableAppCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-pink-500 rounded-full mr-2"></div>
                    Interview ({filteredAppColumns.interview.length})
                  </h5>
                  <SortableContext items={filteredAppColumns.interview.map(c => c.id)} strategy={rectSortingStrategy}>
                    <DroppableColumn id="interview">
                      {filteredAppColumns.interview.map(card => (
                        <SortableAppCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>
              </div>
              <DragOverlay>
                {activeAppId ? (() => {
                  const col = getApplicationColumnOfItem(activeAppId);
                  if (!col) return null;
                  const card = appColumns[col].find(c => String(c.id) === activeAppId);
                  if (!card) return null;
                  return (
                    <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3">
                      <div className="text-white font-medium mb-1">{card.company}</div>
                      {card.hiringManager && (
                        <div className="text-gray-400 text-xs mb-1">HM: {card.hiringManager}</div>
                      )}
                      {card.recruiter && (
                        <div className="text-gray-400 text-xs mb-1">Recruiter: {card.recruiter}</div>
                      )}
                      <div className="text-xs text-yellow-400">{new Date(card.dateCreated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    </div>
                  );
                })() : null}
              </DragOverlay>
            </DndContext>
            )}
            
            {/* Create/Edit Modal */}
            {isModalOpen && (
              <ApplicationModal
                application={editingApp}
                onClose={() => {
                  setIsModalOpen(false);
                  setEditingApp(null);
                }}
                onSave={async (data) => {
                  try {
                    if (editingApp) {
                      // Update existing
                      const response = await fetch('/api/applications_with_outreach', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...data, id: editingApp.id }),
                      });
                      if (!response.ok) throw new Error('Failed to update application');
                    } else {
                      // Create new
                      const response = await fetch('/api/applications_with_outreach', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                      });
                      if (!response.ok) throw new Error('Failed to create application');
                    }
                    await fetchApplications();
                    setIsModalOpen(false);
                    setEditingApp(null);
                  } catch (error) {
                    console.error('Error saving application:', error);
                    alert('Failed to save application. Please try again.');
                  }
                }}
              />
            )}

            {/* Delete Confirmation Modal */}
            {isDeleting !== null && (
              <DeleteModal
                onConfirm={async () => {
                  try {
                    const response = await fetch(`/api/applications_with_outreach?id=${isDeleting}`, {
                      method: 'DELETE',
                    });
                    if (!response.ok) throw new Error('Failed to delete application');
                    await fetchApplications();
                    setIsDeleting(null);
                  } catch (error) {
                    console.error('Error deleting application:', error);
                    alert('Failed to delete application. Please try again.');
                    setIsDeleting(null);
                  }
                }}
                onCancel={() => setIsDeleting(null)}
              />
            )}
          </section>
        )}

        {/* Coffee Chats Content */}
        {activeTab === 'interviews' && (
          <section className="bg-gray-800 border border-light-steel-blue rounded-lg p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h4 className="text-xl font-bold text-white">Coffee Chats</h4>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span>Show:</span>
                <button
                  onClick={() => setLinkedinOutreachFilter('currentMonth')}
                  className={`px-3 py-1 rounded-md border transition-colors ${
                    linkedinOutreachFilter === 'currentMonth'
                      ? 'bg-electric-blue text-white border-electric-blue'
                      : 'bg-gray-700 text-gray-300 border-transparent hover:border-light-steel-blue'
                  }`}
                >
                  Current Month
                </button>
                <button
                  onClick={() => setLinkedinOutreachFilter('allTime')}
                  className={`px-3 py-1 rounded-md border transition-colors ${
                    linkedinOutreachFilter === 'allTime'
                      ? 'bg-electric-blue text-white border-electric-blue'
                      : 'bg-gray-700 text-gray-300 border-transparent hover:border-light-steel-blue'
                  }`}
                >
                  All Time
                </button>
              </div>
              <button 
                onClick={() => {
                  setEditingLinkedinOutreach(null);
                  setIsLinkedinOutreachModalOpen(true);
                }}
                className="bg-electric-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
              >
                <Plus className="mr-2" />New Outreach
              </button>
            </div>
            {isLoadingLinkedinOutreach ? (
              <div className="text-center py-8 text-gray-400">Loading coffee chats...</div>
            ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleLinkedinOutreachDragStart} onDragOver={handleLinkedinOutreachDragOver} onDragEnd={handleLinkedinOutreachDragEnd}>
              <div className="grid grid-cols-4 gap-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    Outreach Request Sent ({filteredLinkedinOutreachColumns.outreach.length})
                  </h5>
                  <SortableContext items={filteredLinkedinOutreachColumns.outreach.map(c => String(c.id))} strategy={rectSortingStrategy}>
                    <DroppableColumn id="outreach">
                      {filteredLinkedinOutreachColumns.outreach.map(card => (
                        <SortableLinkedinOutreachCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    Request Accepted ({filteredLinkedinOutreachColumns.accepted.length})
                  </h5>
                  <SortableContext items={filteredLinkedinOutreachColumns.accepted.map(c => String(c.id))} strategy={rectSortingStrategy}>
                    <DroppableColumn id="accepted">
                      {filteredLinkedinOutreachColumns.accepted.map(card => (
                        <SortableLinkedinOutreachCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    Followed Up ({filteredLinkedinOutreachColumns.followedUpLinkedin.length})
                  </h5>
                  <SortableContext items={filteredLinkedinOutreachColumns.followedUpLinkedin.map(c => String(c.id))} strategy={rectSortingStrategy}>
                    <DroppableColumn id="followedUpLinkedin">
                      {filteredLinkedinOutreachColumns.followedUpLinkedin.map(card => (
                        <SortableLinkedinOutreachCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    Coffee Chat ({filteredLinkedinOutreachColumns.linkedinOutreach.length})
                  </h5>
                  <SortableContext items={filteredLinkedinOutreachColumns.linkedinOutreach.map(c => String(c.id))} strategy={rectSortingStrategy}>
                    <DroppableColumn id="linkedinOutreach">
                      {filteredLinkedinOutreachColumns.linkedinOutreach.map(card => (
                        <SortableLinkedinOutreachCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>
              </div>
              <DragOverlay>
                {activeLinkedinOutreachId ? (() => {
                  const col = getLinkedinOutreachColumnOfItem(activeLinkedinOutreachId);
                  if (!col) return null;
                  const card = linkedinOutreachColumns[col].find(c => String(c.id) === activeLinkedinOutreachId);
                  if (!card) return null;
                  return (
                    <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3">
                      <div className="text-white font-medium mb-1">{card.name}</div>
                      <div className="text-gray-400 text-xs mb-1">{card.company}</div>
                      <div className="text-xs text-yellow-400">{new Date(card.dateCreated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    </div>
                  );
                })() : null}
              </DragOverlay>
            </DndContext>
            )}

            {/* Create/Edit Modal */}
            {isLinkedinOutreachModalOpen && (
              <LinkedinOutreachModal
                linkedinOutreach={editingLinkedinOutreach}
                onClose={() => {
                  setIsLinkedinOutreachModalOpen(false);
                  setEditingLinkedinOutreach(null);
                }}
                onSave={async (data) => {
                  try {
                    if (editingLinkedinOutreach) {
                      // Update existing
                      const response = await fetch('/api/linkedin_outreach', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...data, id: editingLinkedinOutreach.id }),
                      });
                      if (!response.ok) throw new Error('Failed to update LinkedIn outreach entry');
                    } else {
                      // Create new
                      const response = await fetch('/api/linkedin_outreach', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                      });
                      if (!response.ok) throw new Error('Failed to create LinkedIn outreach entry');
                    }
                    await fetchLinkedinOutreach();
                    setIsLinkedinOutreachModalOpen(false);
                    setEditingLinkedinOutreach(null);
                  } catch (error) {
                    console.error('Error saving LinkedIn outreach entry:', error);
                    alert('Failed to save coffee chat. Please try again.');
                  }
                }}
              />
            )}

            {/* Delete Confirmation Modal */}
            {isDeletingLinkedinOutreach !== null && (
              <DeleteModal
                onConfirm={async () => {
                  try {
                    const response = await fetch(`/api/linkedin_outreach?id=${isDeletingLinkedinOutreach}`, {
                      method: 'DELETE',
                    });
                    if (!response.ok) throw new Error('Failed to delete LinkedIn outreach entry');
                    await fetchLinkedinOutreach();
                    setIsDeletingLinkedinOutreach(null);
                  } catch (error) {
                    console.error('Error deleting LinkedIn outreach entry:', error);
                    alert('Failed to delete coffee chat. Please try again.');
                    setIsDeletingLinkedinOutreach(null);
                  }
                }}
                onCancel={() => setIsDeletingLinkedinOutreach(null)}
              />
            )}
          </section>
        )}

        {/* Events Content */}
        {activeTab === 'events' && (
          <section className="bg-gray-800 border border-light-steel-blue rounded-lg p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h4 className="text-xl font-bold text-white">In-Person Events</h4>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span>Show:</span>
                <button
                  onClick={() => setEventsFilter('currentMonth')}
                  className={`px-3 py-1 rounded-md border transition-colors ${
                    eventsFilter === 'currentMonth'
                      ? 'bg-electric-blue text-white border-electric-blue'
                      : 'bg-gray-700 text-gray-300 border-transparent hover:border-light-steel-blue'
                  }`}
                >
                  Current Month
                </button>
                <button
                  onClick={() => setEventsFilter('allTime')}
                  className={`px-3 py-1 rounded-md border transition-colors ${
                    eventsFilter === 'allTime'
                      ? 'bg-electric-blue text-white border-electric-blue'
                      : 'bg-gray-700 text-gray-300 border-transparent hover:border-light-steel-blue'
                  }`}
                >
                  All Time
                </button>
              </div>
              <button
                onClick={() => {
                  setEditingEvent(null);
                  setIsEventModalOpen(true);
                }}
                className="bg-electric-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
              >
                <Plus className="mr-2" />Add Event
              </button>
            </div>
            {isLoadingEvents ? (
              <div className="text-center py-8 text-gray-400">Loading events...</div>
            ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleEventsDragStart} onDragOver={handleEventsDragOver} onDragEnd={handleEventsDragEnd}>
              <div className="grid grid-cols-4 gap-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    Scheduled ({filteredEventColumns.upcoming.length})
                  </h5>
                  <SortableContext items={filteredEventColumns.upcoming.map(event => String(event.id))} strategy={rectSortingStrategy}>
                    <DroppableColumn id="upcoming">
                      {filteredEventColumns.upcoming.map(event => (
                        <SortableEventCard key={event.id} card={event} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    Attended ({filteredEventColumns.attended.length})
                  </h5>
                  <SortableContext items={filteredEventColumns.attended.map(event => String(event.id))} strategy={rectSortingStrategy}>
                    <DroppableColumn id="attended">
                      {filteredEventColumns.attended.map(event => (
                        <SortableEventCard key={event.id} card={event} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    LinkedIn Requests Sent ({filteredEventColumns.linkedinRequestsSent.length})
                  </h5>
                  <SortableContext items={filteredEventColumns.linkedinRequestsSent.map(event => String(event.id))} strategy={rectSortingStrategy}>
                    <DroppableColumn id="linkedinRequestsSent">
                      {filteredEventColumns.linkedinRequestsSent.map(event => (
                        <SortableEventCard key={event.id} card={event} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    Followed Up ({filteredEventColumns.followups.length})
                  </h5>
                  <SortableContext items={filteredEventColumns.followups.map(event => String(event.id))} strategy={rectSortingStrategy}>
                    <DroppableColumn id="followups">
                      {filteredEventColumns.followups.map(event => (
                        <SortableEventCard key={event.id} card={event} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>
              </div>
              <DragOverlay>
                {activeEventId ? (() => {
                  const col = getEventColumnOfItem(activeEventId);
                  if (!col) return null;
                  const card = eventColumns[col].find(event => String(event.id) === activeEventId);
                  if (!card) return null;
                  const formattedDate = (() => {
                    try {
                      return new Date(card.date).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      });
                    } catch {
                      return '';
                    }
                  })();
                  return (
                    <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3">
                      <div className="text-white font-medium mb-1">{card.event}</div>
                      <div className="text-gray-400 text-xs mb-1">{formattedDate}</div>
                      {card.location && (
                        <div className="text-gray-400 text-xs mb-1">{card.location}</div>
                      )}
                    </div>
                  );
                })() : null}
              </DragOverlay>
            </DndContext>
            )}

            {/* Create/Edit Modal */}
            {isEventModalOpen && (
              <InPersonEventModal
                eventItem={editingEvent}
                onClose={() => {
                  setIsEventModalOpen(false);
                  setEditingEvent(null);
                }}
                onSave={async (data) => {
                  try {
                    if (editingEvent) {
                      const response = await fetch('/api/in_person_events', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...data, id: editingEvent.id }),
                      });
                      if (!response.ok) throw new Error('Failed to update event');
                    } else {
                      const response = await fetch('/api/in_person_events', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                      });
                      if (!response.ok) throw new Error('Failed to create event');
                    }
                    await fetchEvents();
                    setIsEventModalOpen(false);
                    setEditingEvent(null);
                  } catch (error) {
                    console.error('Error saving event:', error);
                    alert('Failed to save event. Please try again.');
                  }
                }}
              />
            )}

            {/* Delete Confirmation Modal */}
            {isDeletingEvent !== null && (
              <DeleteModal
                onConfirm={async () => {
                  try {
                    const response = await fetch(`/api/in_person_events?id=${isDeletingEvent}`, {
                      method: 'DELETE',
                    });
                    if (!response.ok) throw new Error('Failed to delete event');
                    await fetchEvents();
                    setIsDeletingEvent(null);
                  } catch (error) {
                    console.error('Error deleting event:', error);
                    alert('Failed to delete event. Please try again.');
                    setIsDeletingEvent(null);
                  }
                }}
                onCancel={() => setIsDeletingEvent(null)}
              />
            )}
          </section>
        )}

        {/* LeetCode Content */}
        {activeTab === 'leetcode' && (
          <section className="bg-gray-800 border border-light-steel-blue rounded-lg p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h4 className="text-xl font-bold text-white">LeetCode Progress</h4>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span>Show:</span>
                <button
                  onClick={() => setLeetFilter('currentMonth')}
                  className={`px-3 py-1 rounded-md border transition-colors ${
                    leetFilter === 'currentMonth'
                      ? 'bg-electric-blue text-white border-electric-blue'
                      : 'bg-gray-700 text-gray-300 border-transparent hover:border-light-steel-blue'
                  }`}
                >
                  Current Month
                </button>
                <button
                  onClick={() => setLeetFilter('allTime')}
                  className={`px-3 py-1 rounded-md border transition-colors ${
                    leetFilter === 'allTime'
                      ? 'bg-electric-blue text-white border-electric-blue'
                      : 'bg-gray-700 text-gray-300 border-transparent hover:border-light-steel-blue'
                  }`}
                >
                  All Time
                </button>
              </div>
              <button
                onClick={() => {
                  setEditingLeet(null);
                  setIsLeetModalOpen(true);
                }}
                className="bg-electric-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
              >
                <Plus className="mr-2" />Log Practice
              </button>
            </div>
            {isLoadingLeet ? (
              <div className="text-center py-8 text-gray-400">Loading problems...</div>
            ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleLeetDragStart} onDragOver={handleLeetDragOver} onDragEnd={handleLeetDragEnd}>
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    Planned ({filteredLeetColumns.planned.length})
                  </h5>
                  <SortableContext items={filteredLeetColumns.planned.map(entry => String(entry.id))} strategy={rectSortingStrategy}>
                    <DroppableColumn id="planned">
                      {filteredLeetColumns.planned.map(entry => (
                        <SortableLeetCard key={entry.id} card={entry} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    Solved ({filteredLeetColumns.solved.length})
                  </h5>
                  <SortableContext items={filteredLeetColumns.solved.map(entry => String(entry.id))} strategy={rectSortingStrategy}>
                    <DroppableColumn id="solved">
                      {filteredLeetColumns.solved.map(entry => (
                        <SortableLeetCard key={entry.id} card={entry} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    Reflected ({filteredLeetColumns.reflected.length})
                  </h5>
                  <SortableContext items={filteredLeetColumns.reflected.map(entry => String(entry.id))} strategy={rectSortingStrategy}>
                    <DroppableColumn id="reflected">
                      {filteredLeetColumns.reflected.map(entry => (
                        <SortableLeetCard key={entry.id} card={entry} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>
              </div>
              <DragOverlay>
                {activeLeetId ? (() => {
                  const col = getLeetColumnOfItem(activeLeetId);
                  if (!col) return null;
                  const card = leetColumns[col].find(entry => String(entry.id) === activeLeetId);
                  if (!card) return null;
                  return (
                    <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3">
                      <div className="text-white font-medium mb-1">{card.problem?.trim() || 'Untitled Problem'}</div>
                      <div className="text-gray-400 text-xs mb-1">{card.problemType || '—'}</div>
                      {card.difficulty && (
                        <div className="text-[10px] text-electric-blue uppercase">{card.difficulty}</div>
                      )}
                    </div>
                  );
                })() : null}
              </DragOverlay>
            </DndContext>
            )}

            {isLeetModalOpen && (
              <LeetModal
                entry={editingLeet}
                onClose={() => {
                  setIsLeetModalOpen(false);
                  setEditingLeet(null);
                }}
                onSave={async (data) => {
                  try {
                    if (editingLeet) {
                      const response = await fetch('/api/leetcode', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...data, id: editingLeet.id }),
                      });
                      if (!response.ok) throw new Error('Failed to update problem');
                    } else {
                      const response = await fetch('/api/leetcode', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                      });
                      if (!response.ok) throw new Error('Failed to create problem');
                    }
                    await fetchLeetEntries();
                    setIsLeetModalOpen(false);
                    setEditingLeet(null);
                  } catch (error) {
                    console.error('Error saving LeetCode problem:', error);
                    alert('Failed to save problem. Please try again.');
                  }
                }}
              />
            )}

            {isDeletingLeet !== null && (
              <DeleteModal
                onConfirm={async () => {
                  try {
                    const response = await fetch(`/api/leetcode?id=${isDeletingLeet}`, {
                      method: 'DELETE',
                    });
                    if (!response.ok) throw new Error('Failed to delete problem');
                    await fetchLeetEntries();
                    setIsDeletingLeet(null);
                  } catch (error) {
                    console.error('Error deleting LeetCode problem:', error);
                    alert('Failed to delete problem. Please try again.');
                    setIsDeletingLeet(null);
                  }
                }}
                onCancel={() => setIsDeletingLeet(null)}
              />
            )}
          </section>
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
    dateCreated: string; // ===== DATE CREATED EDITING: Added for testing/debugging =====
  };

  const [formData, setFormData] = useState<ApplicationFormData>({
    company: application?.company || '',
    hiringManager: application?.hiringManager || '',
    msgToManager: application?.msgToManager || '',
    recruiter: application?.recruiter || '',
    msgToRecruiter: application?.msgToRecruiter || '',
    notes: application?.notes || '',
    status: application?.status || 'applied',
    dateCreated: application?.dateCreated ? toLocalDate(application.dateCreated) : '', // ===== DATE CREATED EDITING =====
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
        dateCreated: application.dateCreated ? toLocalDate(application.dateCreated) : '', // ===== DATE CREATED EDITING =====
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
        dateCreated: '', // ===== DATE CREATED EDITING =====
      });
    }
  }, [application]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company.trim()) {
      alert('Company name is required');
      return;
    }
    // ===== DATE CREATED EDITING: Convert date string to ISO DateTime if provided =====
    const submitData: Partial<Application> = { ...formData };
    if (ENABLE_DATE_CREATED_EDITING && formData.dateCreated) {
      try {
        // Convert local date to ISO string (midnight UTC of that date)
        const date = new Date(formData.dateCreated);
        if (!isNaN(date.getTime())) {
          submitData.dateCreated = date.toISOString();
        }
      } catch (error) {
        console.error('Error parsing dateCreated:', error);
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

          {/* ===== DATE CREATED EDITING: Show dateCreated field when toggle is enabled ===== */}
          {ENABLE_DATE_CREATED_EDITING && (
            <div>
              <label className="block text-white font-semibold mb-2">Date Created (Testing/Debug)</label>
              <input
                type="date"
                value={formData.dateCreated}
                onChange={(e) => setFormData({ ...formData, dateCreated: e.target.value })}
                className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
              />
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
    dateCreated: string; // ===== DATE CREATED EDITING: Added for testing/debugging =====
  };

  const [formData, setFormData] = useState<LinkedinOutreachFormData>({
    name: linkedinOutreach?.name || '',
    company: linkedinOutreach?.company || '',
    message: linkedinOutreach?.message || '',
    linkedInUrl: linkedinOutreach?.linkedInUrl || '',
    notes: linkedinOutreach?.notes || '',
    status: linkedinOutreach ? linkedinOutreach.status : 'outreachRequestSent',
    recievedReferral: linkedinOutreach?.recievedReferral || false,
    dateCreated: linkedinOutreach?.dateCreated ? toLocalDate(linkedinOutreach.dateCreated) : '', // ===== DATE CREATED EDITING =====
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
        dateCreated: linkedinOutreach.dateCreated ? toLocalDate(linkedinOutreach.dateCreated) : '', // ===== DATE CREATED EDITING =====
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
        dateCreated: '', // ===== DATE CREATED EDITING =====
      });
    }
  }, [linkedinOutreach]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.company.trim()) {
      alert('Name and company are required');
      return;
    }
    // ===== DATE CREATED EDITING: Convert date string to ISO DateTime if provided =====
    const submitData: Partial<LinkedinOutreach> = { ...formData };
    if (ENABLE_DATE_CREATED_EDITING && formData.dateCreated) {
      try {
        // Convert local date to ISO string (midnight UTC of that date)
        const date = new Date(formData.dateCreated);
        if (!isNaN(date.getTime())) {
          submitData.dateCreated = date.toISOString();
        }
      } catch (error) {
        console.error('Error parsing dateCreated:', error);
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

          {/* ===== DATE CREATED EDITING: Show dateCreated field when toggle is enabled ===== */}
          {ENABLE_DATE_CREATED_EDITING && (
            <div>
              <label className="block text-white font-semibold mb-2">Date Created (Testing/Debug)</label>
              <input
                type="date"
                value={formData.dateCreated}
                onChange={(e) => setFormData({ ...formData, dateCreated: e.target.value })}
                className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
              />
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
    dateCreated: string; // ===== DATE CREATED EDITING: Added for testing/debugging =====
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
    dateCreated: eventItem?.dateCreated ? toLocalDate(eventItem.dateCreated) : '', // ===== DATE CREATED EDITING =====
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
      dateCreated: eventItem?.dateCreated ? toLocalDate(eventItem.dateCreated) : '', // ===== DATE CREATED EDITING =====
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

    // ===== DATE CREATED EDITING: Convert date string to ISO DateTime if provided =====
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
    if (ENABLE_DATE_CREATED_EDITING && formData.dateCreated) {
      try {
        // Convert local date to ISO string (midnight UTC of that date)
        const date = new Date(formData.dateCreated);
        if (!isNaN(date.getTime())) {
          saveData.dateCreated = date.toISOString();
        }
      } catch (error) {
        console.error('Error parsing dateCreated:', error);
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

          {/* ===== DATE CREATED EDITING: Show dateCreated field when toggle is enabled ===== */}
          {ENABLE_DATE_CREATED_EDITING && (
            <div>
              <label className="block text-white font-semibold mb-2">Date Created (Testing/Debug)</label>
              <input
                type="date"
                value={formData.dateCreated}
                onChange={(e) => setFormData(prev => ({ ...prev, dateCreated: e.target.value }))}
                className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
              />
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
    dateCreated: string; // ===== DATE CREATED EDITING: Added for testing/debugging =====
  };

  const [formData, setFormData] = useState<LeetFormData>({
    problem: entry?.problem ?? '',
    problemType: entry?.problemType ?? '',
    difficulty: entry?.difficulty ?? '',
    url: entry?.url ?? '',
    reflection: entry?.reflection ?? '',
    status: entry?.status ?? 'planned',
    dateCreated: entry?.dateCreated ? toLocalDate(entry.dateCreated) : '', // ===== DATE CREATED EDITING =====
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

  // ===== DATE CREATED EDITING: Update form data when entry changes =====
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
      });
    }
  }, [entry]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.problem.trim()) {
      alert('Problem name is required');
      return;
    }

    // ===== DATE CREATED EDITING: Convert date string to ISO DateTime if provided =====
    const submitData: Partial<LeetEntry> = {
      problem: formData.problem.trim(),
      problemType: formData.problemType ? formData.problemType.trim() : null,
      difficulty: formData.difficulty ? formData.difficulty.trim() : null,
      url: formData.url ? formData.url.trim() : null,
      reflection: formData.reflection ? formData.reflection.trim() : null,
      status: formData.status,
    };
    if (ENABLE_DATE_CREATED_EDITING && formData.dateCreated) {
      try {
        // Convert local date to ISO string (midnight UTC of that date)
        const date = new Date(formData.dateCreated);
        if (!isNaN(date.getTime())) {
          submitData.dateCreated = date.toISOString();
        }
      } catch (error) {
        console.error('Error parsing dateCreated:', error);
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

          {/* ===== DATE CREATED EDITING: Show dateCreated field when toggle is enabled ===== */}
          {ENABLE_DATE_CREATED_EDITING && (
            <div>
              <label className="block text-white font-semibold mb-2">Date Created (Testing/Debug)</label>
              <input
                type="date"
                value={formData.dateCreated}
                onChange={(e) => setFormData(prev => ({ ...prev, dateCreated: e.target.value }))}
                className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
              />
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
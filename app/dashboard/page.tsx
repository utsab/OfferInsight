'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent, type DragOverEvent, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Gauge, FileText, MessageCircle, Users, Code, CalendarCheck, Plus, X, Edit2, Trash2 } from 'lucide-react';

const hourOptions = ['01','02','03','04','05','06','07','08','09','10','11','12'];
const minuteOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

const toLocalTimeParts = (value: string) => {
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
      period: 'AM' as const,
    };
  }
};

// Application type definition
type Application = {
  id: number;
  company: string;
  hiringManager?: string | null;
  msgToManager?: string | null;
  recruiter?: string | null;
  msgToRecruiter?: string | null;
  notes?: string | null;
  status: string;
  dateCreated: string;
  userId: string;
};

type ColumnId = 'applied' | 'messagedRecruiter' | 'messagedHiringManager' | 'followedUp' | 'interview';

// Coffee Chat type definition
type CoffeeChat = {
  id: number;
  name: string;
  company: string;
  message?: string | null;
  linkedInUrl?: string | null;
  notes?: string | null;
  status: string;
  dateCreated: string;
  recievedReferral: boolean;
  userId: string;
};

type CoffeeChatColumnId = 'outreach' | 'accepted' | 'followedUpCoffee' | 'coffeeChat';

// Map status values to column IDs (moved outside component to prevent re-renders)
const statusToColumn: Record<string, ColumnId> = {
  'applied': 'applied',
  'messagedRecruiter': 'messagedRecruiter',
  'messagedHiringManager': 'messagedHiringManager',
  'followedUp': 'followedUp',
  'interview': 'interview',
};

const columnToStatus: Record<ColumnId, string> = {
  'applied': 'applied',
  'messagedRecruiter': 'messagedRecruiter',
  'messagedHiringManager': 'messagedHiringManager',
  'followedUp': 'followedUp',
  'interview': 'interview',
};

// Coffee Chat status mappings
const coffeeChatStatusToColumn: Record<string, CoffeeChatColumnId> = {
  'outreachRequestSent': 'outreach',
  'accepted': 'accepted',
  'followedUp': 'followedUpCoffee',
  'coffeeChat': 'coffeeChat',
};

const coffeeChatColumnToStatus: Record<CoffeeChatColumnId, string> = {
  'outreach': 'outreachRequestSent',
  'accepted': 'accepted',
  'followedUpCoffee': 'followedUp',
  'coffeeChat': 'coffeeChat',
};

type InPersonEvent = {
  id: number;
  event: string;
  date: string;
  location?: string | null;
  url?: string | null;
  notes?: string | null;
  status: string;
  numPeopleSpokenTo?: number | null;
  numLinkedInRequests?: number | null;
  careerFair: boolean;
  numOfInterviews?: number | null;
  userId: string;
};

type EventColumnId = 'upcoming' | 'attending' | 'attended' | 'followups';

const eventStatusToColumn: Record<string, EventColumnId> = {
  scheduled: 'upcoming',
  attending: 'attending',
  attended: 'attended',
  followUp: 'followups',
  followups: 'followups',
};

const eventColumnToStatus: Record<EventColumnId, string> = {
  upcoming: 'scheduled',
  attending: 'attending',
  attended: 'attended',
  followups: 'followUp',
};

type LeetEntry = {
  id: number;
  problem?: string | null;
  problemType?: string | null;
  difficulty?: string | null;
  url?: string | null;
  reflection?: string | null;
  status: string;
  userId: string;
};

type LeetColumnId = 'planned' | 'solved' | 'reflected';

const leetStatusToColumn: Record<string, LeetColumnId> = {
  planned: 'planned',
  solved: 'solved',
  reflected: 'reflected',
};

const leetColumnToStatus: Record<LeetColumnId, string> = {
  planned: 'planned',
  solved: 'solved',
  reflected: 'reflected',
};

export default function Page() {
  const [activeTab, setActiveTab] = useState('overview');
  const [projectedOfferDate, setProjectedOfferDate] = useState<Date | null>(null);

  // dnd-kit: Applications board state

  const [applications, setApplications] = useState<Application[]>([]);
  const [appColumns, setAppColumns] = useState<Record<ColumnId, Application[]>>({
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
  const isFetchingRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const fetchApplications = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) return;
    
    try {
      isFetchingRef.current = true;
      setIsLoading(true);
      const response = await fetch('/api/applications_with_outreach');
      if (!response.ok) throw new Error('Failed to fetch applications');
      const data = await response.json();
      setApplications(data);
      
      // Group applications by status
      const grouped: Record<ColumnId, Application[]> = {
        applied: [],
        messagedRecruiter: [],
        messagedHiringManager: [],
        followedUp: [],
        interview: [],
      };
      
      data.forEach((app: Application) => {
        const column = statusToColumn[app.status] || 'applied';
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
    if ((activeTab === 'applications' || activeTab === 'overview') && !isFetchingRef.current) {
      fetchApplications();
    }
  }, [activeTab, fetchApplications]);

  const getColumnOfItem = (id: string): ColumnId | null => {
    const entry = (Object.keys(appColumns) as ColumnId[]).find(col => 
      appColumns[col].some(c => String(c.id) === id)
    );
    return entry ?? null;
  };

  const handleApplicationsDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const fromCol = getColumnOfItem(activeId);
    const toCol = (['applied','messagedRecruiter','messagedHiringManager','followedUp','interview'] as ColumnId[]).includes(overId as ColumnId)
      ? (overId as ColumnId)
      : getColumnOfItem(overId);
    if (!fromCol || !toCol) return;

    // Update UI optimistically
    if (fromCol === toCol) {
      const items = appColumns[fromCol];
      const oldIndex = items.findIndex(i => String(i.id) === activeId);
      const newIndex = items.findIndex(i => String(i.id) === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      const newItems = arrayMove(items, oldIndex, newIndex);
      setAppColumns(prev => ({ ...prev, [fromCol]: newItems }));
    } else {
      const fromItems = appColumns[fromCol];
      const toItems = appColumns[toCol];
      const movingIndex = fromItems.findIndex(i => String(i.id) === activeId);
      if (movingIndex === -1) return;
      const movingItem = fromItems[movingIndex];
      const overIndex = toItems.findIndex(i => String(i.id) === overId);
      const insertIndex = overIndex === -1 ? toItems.length : overIndex;
      const newFrom = [...fromItems.slice(0, movingIndex), ...fromItems.slice(movingIndex + 1)];
      const newTo = [...toItems.slice(0, insertIndex), movingItem, ...toItems.slice(insertIndex)];
      setAppColumns(prev => ({ ...prev, [fromCol]: newFrom, [toCol]: newTo }));
      
      // Update status in database
      try {
        const newStatus = columnToStatus[toCol];
        const response = await fetch(`/api/applications_with_outreach?id=${movingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!response.ok) throw new Error('Failed to update status');
        
        // Update the application in the main list
        setApplications(prev => prev.map(app => 
          app.id === movingItem.id ? { ...app, status: newStatus } : app
        ));
      } catch (error) {
        console.error('Error updating status:', error);
        // Revert on error
        fetchApplications();
      }
    }
    setActiveAppId(null);
  };

  const handleApplicationsDragStart = (event: DragStartEvent) => {
    setActiveAppId(String(event.active.id));
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

    const formatDate = (dateString: string) => {
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } catch {
        return '';
      }
    };

    const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingApp(props.card);
      setIsModalOpen(true);
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
        className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors group relative"
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
              onClick={handleEdit}
              className="p-1 hover:bg-gray-500 rounded text-gray-300 hover:text-white"
              title="Edit"
            >
              <Edit2 size={14} />
            </button>
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
          <div className="text-gray-500 text-xs mb-2">
            {props.card.msgToManager && '✓ Messaged HM'}
            {props.card.msgToManager && props.card.msgToRecruiter && ' • '}
            {props.card.msgToRecruiter && '✓ Messaged Recruiter'}
          </div>
        )}
        {props.card.notes && (
          <div className="text-gray-400 text-xs mb-2 line-clamp-2">{props.card.notes}</div>
        )}
        <div className="flex items-center justify-between text-xs">
          <span className="text-yellow-400">{formatDate(props.card.dateCreated)}</span>
          <span className="text-gray-500">ID: {props.card.id}</span>
        </div>
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

  // dnd-kit: Coffee Chats board (Linkedin_Outreach)

  const [coffeeChats, setCoffeeChats] = useState<CoffeeChat[]>([]);
  const [coffeeChatColumns, setCoffeeChatColumns] = useState<Record<CoffeeChatColumnId, CoffeeChat[]>>({
    outreach: [],
    accepted: [],
    followedUpCoffee: [],
    coffeeChat: [],
  });
  const [activeCoffeeChatId, setActiveCoffeeChatId] = useState<string | null>(null);
  const [isCoffeeChatModalOpen, setIsCoffeeChatModalOpen] = useState(false);
  const [editingCoffeeChat, setEditingCoffeeChat] = useState<CoffeeChat | null>(null);
  const [isDeletingCoffeeChat, setIsDeletingCoffeeChat] = useState<number | null>(null);
  const [isLoadingCoffeeChats, setIsLoadingCoffeeChats] = useState(true);
  const isFetchingCoffeeChatsRef = useRef(false);

  const fetchCoffeeChats = useCallback(async () => {
    if (isFetchingCoffeeChatsRef.current) return;

    try {
      isFetchingCoffeeChatsRef.current = true;
      setIsLoadingCoffeeChats(true);
      const response = await fetch('/api/linkedin_outreach');
      if (!response.ok) throw new Error('Failed to fetch coffee chats');
      const data = await response.json();
      setCoffeeChats(data);

      const grouped: Record<CoffeeChatColumnId, CoffeeChat[]> = {
        outreach: [],
        accepted: [],
        followedUpCoffee: [],
        coffeeChat: [],
      };

      (data as CoffeeChat[]).forEach(chat => {
        const column = coffeeChatStatusToColumn[chat.status] ?? 'outreach';
        grouped[column].push(chat);
      });

      setCoffeeChatColumns(grouped);
    } catch (error) {
      console.error('Error fetching coffee chats:', error);
    } finally {
      setIsLoadingCoffeeChats(false);
      isFetchingCoffeeChatsRef.current = false;
    }
  }, []);

  useEffect(() => {
    if ((activeTab === 'interviews' || activeTab === 'overview') && !isFetchingCoffeeChatsRef.current) {
      fetchCoffeeChats();
    }
  }, [activeTab, fetchCoffeeChats]);

  const getCoffeeChatColumnOfItem = (id: string): CoffeeChatColumnId | null => {
    const entry = (Object.keys(coffeeChatColumns) as CoffeeChatColumnId[]).find(col =>
      coffeeChatColumns[col].some(chat => String(chat.id) === id)
    );
    return entry ?? null;
  };

  const handleCoffeeChatsDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const fromCol = getCoffeeChatColumnOfItem(activeId);
    const toCol = (['outreach', 'accepted', 'followedUpCoffee', 'coffeeChat'] as CoffeeChatColumnId[]).includes(overId as CoffeeChatColumnId)
      ? (overId as CoffeeChatColumnId)
      : getCoffeeChatColumnOfItem(overId);
    if (!fromCol || !toCol) return;

    if (fromCol === toCol) {
      const items = coffeeChatColumns[fromCol];
      const oldIndex = items.findIndex(i => String(i.id) === activeId);
      const newIndex = items.findIndex(i => String(i.id) === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      const newItems = arrayMove(items, oldIndex, newIndex);
      setCoffeeChatColumns(prev => ({ ...prev, [fromCol]: newItems }));
    } else {
      const fromItems = coffeeChatColumns[fromCol];
      const toItems = coffeeChatColumns[toCol];
      const movingIndex = fromItems.findIndex(i => String(i.id) === activeId);
      if (movingIndex === -1) return;
      const movingItem = fromItems[movingIndex];
      const overIndex = toItems.findIndex(i => String(i.id) === overId);
      const insertIndex = overIndex === -1 ? toItems.length : overIndex;
      const newFrom = [...fromItems.slice(0, movingIndex), ...fromItems.slice(movingIndex + 1)];
      const newTo = [...toItems.slice(0, insertIndex), movingItem, ...toItems.slice(insertIndex)];
      setCoffeeChatColumns(prev => ({ ...prev, [fromCol]: newFrom, [toCol]: newTo }));

      try {
        const newStatus = coffeeChatColumnToStatus[toCol];
        const response = await fetch(`/api/linkedin_outreach?id=${movingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!response.ok) throw new Error('Failed to update coffee chat status');

        setCoffeeChats(prev => prev.map(chat =>
          chat.id === movingItem.id ? { ...chat, status: newStatus } : chat
        ));
      } catch (error) {
        console.error('Error updating coffee chat status:', error);
        fetchCoffeeChats();
      }
    }
    setActiveCoffeeChatId(null);
  };

  const handleCoffeeChatsDragStart = (event: DragStartEvent) => {
    setActiveCoffeeChatId(String(event.active.id));
  };

  const handleCoffeeChatsDragOver = (event: DragOverEvent) => {
    // onDragOver is only for visual feedback via DroppableColumn
  };

  // dnd-kit: Events board (In-Person Events)
  const [events, setEvents] = useState<InPersonEvent[]>([]);
  const [eventColumns, setEventColumns] = useState<Record<EventColumnId, InPersonEvent[]>>({
    upcoming: [],
    attending: [],
    attended: [],
    followups: [],
  });
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<InPersonEvent | null>(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState<number | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const isFetchingEventsRef = useRef(false);

  const fetchEvents = useCallback(async () => {
    if (isFetchingEventsRef.current) return;

    try {
      isFetchingEventsRef.current = true;
      setIsLoadingEvents(true);
      const response = await fetch('/api/in_person_events');
      if (!response.ok) throw new Error('Failed to fetch in-person events');
      const data = await response.json();
      setEvents(data);

      const grouped: Record<EventColumnId, InPersonEvent[]> = {
        upcoming: [],
        attending: [],
        attended: [],
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
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const fromCol = getEventColumnOfItem(activeId);
    const toCol = (['upcoming', 'attending', 'attended', 'followups'] as EventColumnId[]).includes(overId as EventColumnId)
      ? (overId as EventColumnId)
      : getEventColumnOfItem(overId);
    if (!fromCol || !toCol) return;

    if (fromCol === toCol) {
      const items = eventColumns[fromCol];
      const oldIndex = items.findIndex(i => String(i.id) === activeId);
      const newIndex = items.findIndex(i => String(i.id) === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      const newItems = arrayMove(items, oldIndex, newIndex);
      setEventColumns(prev => ({ ...prev, [fromCol]: newItems }));
    } else {
      const fromItems = eventColumns[fromCol];
      const toItems = eventColumns[toCol];
      const movingIndex = fromItems.findIndex(i => String(i.id) === activeId);
      if (movingIndex === -1) return;
      const movingItem = fromItems[movingIndex];
      const overIndex = toItems.findIndex(i => String(i.id) === overId);
      const insertIndex = overIndex === -1 ? toItems.length : overIndex;
      const newFrom = [...fromItems.slice(0, movingIndex), ...fromItems.slice(movingIndex + 1)];
      const newTo = [...toItems.slice(0, insertIndex), movingItem, ...toItems.slice(insertIndex)];
      setEventColumns(prev => ({ ...prev, [fromCol]: newFrom, [toCol]: newTo }));

      try {
        const newStatus = eventColumnToStatus[toCol] ?? 'scheduled';
        const response = await fetch(`/api/in_person_events?id=${movingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!response.ok) throw new Error('Failed to update event status');

        setEvents(prev => prev.map(ev =>
          ev.id === movingItem.id ? { ...ev, status: newStatus } : ev
        ));
      } catch (error) {
        console.error('Error updating event status:', error);
        fetchEvents();
      }
    }
    setActiveEventId(null);
  };

  const handleEventsDragStart = (event: DragStartEvent) => {
    setActiveEventId(String(event.active.id));
  };

  const handleEventsDragOver = (event: DragOverEvent) => {
    // onDragOver is only for visual feedback via DroppableColumn
  };

  // dnd-kit: LeetCode board
  const [leetEntries, setLeetEntries] = useState<LeetEntry[]>([]);
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
  const isFetchingLeetRef = useRef(false);

  const fetchLeetEntries = useCallback(async () => {
    if (isFetchingLeetRef.current) return;

    try {
      isFetchingLeetRef.current = true;
      setIsLoadingLeet(true);
      const response = await fetch('/api/leetcode');
      if (!response.ok) throw new Error('Failed to fetch LeetCode entries');
      const data = await response.json();
      setLeetEntries(data);

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
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const fromCol = getLeetColumnOfItem(activeId);
    const toCol = (['planned', 'solved', 'reflected'] as LeetColumnId[]).includes(overId as LeetColumnId)
      ? (overId as LeetColumnId)
      : getLeetColumnOfItem(overId);
    if (!fromCol || !toCol) return;

    if (fromCol === toCol) {
      const items = leetColumns[fromCol];
      const oldIndex = items.findIndex(i => String(i.id) === activeId);
      const newIndex = items.findIndex(i => String(i.id) === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      const newItems = arrayMove(items, oldIndex, newIndex);
      setLeetColumns(prev => ({ ...prev, [fromCol]: newItems }));
    } else {
      const fromItems = leetColumns[fromCol];
      const toItems = leetColumns[toCol];
      const movingIndex = fromItems.findIndex(i => String(i.id) === activeId);
      if (movingIndex === -1) return;
      const movingItem = fromItems[movingIndex];
      const overIndex = toItems.findIndex(i => String(i.id) === overId);
      const insertIndex = overIndex === -1 ? toItems.length : overIndex;
      const newFrom = [...fromItems.slice(0, movingIndex), ...fromItems.slice(movingIndex + 1)];
      const newTo = [...toItems.slice(0, insertIndex), movingItem, ...toItems.slice(insertIndex)];
      setLeetColumns(prev => ({ ...prev, [fromCol]: newFrom, [toCol]: newTo }));

      try {
        const newStatus = leetColumnToStatus[toCol];
        const response = await fetch(`/api/leetcode?id=${movingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!response.ok) throw new Error('Failed to update LeetCode status');

        setLeetEntries(prev => prev.map(entry =>
          entry.id === movingItem.id ? { ...entry, status: newStatus } : entry
        ));
      } catch (error) {
        console.error('Error updating LeetCode status:', error);
        fetchLeetEntries();
      }
    }
    setActiveLeetId(null);
  };

  const handleLeetDragStart = (event: DragStartEvent) => {
    setActiveLeetId(String(event.active.id));
  };

  const handleLeetDragOver = (event: DragOverEvent) => {
    // onDragOver is only for visual feedback via DroppableColumn
  };

  function SortableCoffeeChatCard(props: { card: CoffeeChat }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(props.card.id) });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0 : undefined,
    } as React.CSSProperties;

    const formatDate = (dateString: string) => {
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } catch {
        return '';
      }
    };

    const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingCoffeeChat(props.card);
      setIsCoffeeChatModalOpen(true);
    };

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsDeletingCoffeeChat(props.card.id);
    };

    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        {...attributes} 
        {...listeners} 
        className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors group relative"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="text-white font-medium mb-1">{props.card.name}</div>
            <div className="text-gray-400 text-xs mb-1">{props.card.company}</div>
            {props.card.linkedInUrl && (
              <div className="text-gray-500 text-xs mb-1">
                <a href={props.card.linkedInUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="hover:text-electric-blue underline">
                  LinkedIn Profile
                </a>
              </div>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleEdit}
              className="p-1 hover:bg-gray-500 rounded text-gray-300 hover:text-white"
              title="Edit"
            >
              <Edit2 size={14} />
            </button>
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
        <div className="flex items-center justify-between text-xs">
          <span className="text-yellow-400">{formatDate(props.card.dateCreated)}</span>
          <span className="text-gray-500">ID: {props.card.id}</span>
        </div>
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

    const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingEvent(props.card);
      setIsEventModalOpen(true);
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
        className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors group relative"
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
                <a href={props.card.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="hover:text-electric-blue underline">
                  Event Link
                </a>
              </div>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleEdit}
              className="p-1 hover:bg-gray-500 rounded text-gray-300 hover:text-white"
              title="Edit"
            >
              <Edit2 size={14} />
            </button>
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
        <div className="flex items-center justify-between text-xs mt-2">
          <span className="text-gray-500">ID: {props.card.id}</span>
          <span className="text-gray-500 capitalize">Status: {props.card.status}</span>
        </div>
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

    const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingLeet(props.card);
      setIsLeetModalOpen(true);
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
        className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors group relative"
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
              onClick={handleEdit}
              className="p-1 hover:bg-gray-500 rounded text-gray-300 hover:text-white"
              title="Edit"
            >
              <Edit2 size={14} />
            </button>
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
            <a href={props.card.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="hover:text-electric-blue underline">
              Problem Link
            </a>
          </div>
        )}
        {props.card.reflection && (
          <div className="text-gray-400 text-xs mb-2 line-clamp-3">{props.card.reflection}</div>
        )}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">ID: {props.card.id}</span>
          <span className="text-gray-500 capitalize">Status: {props.card.status}</span>
        </div>
      </div>
    );
  }

  const [userData, setUserData] = useState<{
    apps_with_outreach_per_week?: number | null;
    info_interview_outreach_per_month?: number | null;
    projected_offer_date?: string | null;
    in_person_events_per_month?: number | null;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/users/onboarding2');
        if (!res.ok) return;
        const user = await res.json();
        if (isMounted) {
          setUserData(user);
          if (user?.projected_offer_date) {
            const d = new Date(user.projected_offer_date);
            if (!isNaN(d.getTime())) setProjectedOfferDate(d);
          }
        }
      } catch (e) {
        // non-fatal: leave as null
      }
    };
    fetchUser();
    return () => { isMounted = false; };
  }, []);

  const projectedOfferDateText = useMemo(() => {
    if (!projectedOfferDate) return '—';
    try {
      return projectedOfferDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return '—';
    }
  }, [projectedOfferDate]);

  // Calculate applications metrics for this month
  const applicationsMetrics = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Count applications in columns: messagedHiringManager, messagedRecruiter, followedUp, interview
    // (any column to the right of "applied")
    const qualifyingColumns: ColumnId[] = ['messagedHiringManager', 'messagedRecruiter', 'followedUp', 'interview'];
    let count = 0;
    
    qualifyingColumns.forEach(col => {
      appColumns[col].forEach(app => {
        const appDate = new Date(app.dateCreated);
        if (appDate >= startOfMonth) {
          count++;
        }
      });
    });

    // Goal is apps_with_outreach_per_week * 4 (4 weeks per month)
    const goal = userData?.apps_with_outreach_per_week ? userData.apps_with_outreach_per_week * 4 : 0;
    const percentage = goal > 0 ? Math.min((count / goal) * 100, 100) : 0;
    const difference = goal > 0 ? ((count - goal) / goal) * 100 : 0;
    const statusColor = difference >= 0 ? 'green' : 'yellow';
    const statusIcon = difference >= 0 ? 'bg-green-500' : 'bg-yellow-500';
    const statusText = difference >= 0 ? `+${Math.round(difference)}%` : `${Math.round(difference)}%`;
    const statusTextColor = difference >= 0 ? 'text-green-400' : 'text-yellow-400';

    return {
      count,
      goal,
      percentage,
      statusColor,
      statusIcon,
      statusText,
      statusTextColor,
    };
  }, [appColumns, userData]);

  // Calculate coffee chats metrics for this month
  const coffeeChatsMetrics = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Count all coffee chats from all 4 columns (outreach, accepted, followedUpCoffee, coffeeChat)
    const allColumns: CoffeeChatColumnId[] = ['outreach', 'accepted', 'followedUpCoffee', 'coffeeChat'];
    let count = 0;
    
    allColumns.forEach(col => {
      coffeeChatColumns[col].forEach(chat => {
        const chatDate = new Date(chat.dateCreated);
        if (chatDate >= startOfMonth) {
          count++;
        }
      });
    });

    // Goal is info_interview_outreach_per_month from user's onboarding data
    const goal = userData?.info_interview_outreach_per_month ?? 0;
    const percentage = goal > 0 ? Math.min((count / goal) * 100, 100) : 0;
    const difference = goal > 0 ? ((count - goal) / goal) * 100 : 0;
    const statusColor = difference >= 0 ? 'green' : 'yellow';
    const statusIcon = difference >= 0 ? 'bg-green-500' : 'bg-yellow-500';
    const statusText = difference >= 0 ? `+${Math.round(difference)}%` : `${Math.round(difference)}%`;
    const statusTextColor = difference >= 0 ? 'text-green-400' : 'text-yellow-400';

    return {
      count,
      goal,
      percentage,
      statusColor,
      statusIcon,
      statusText,
      statusTextColor,
    };
  }, [coffeeChatColumns, userData]);

  const eventsMetrics = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const qualifyingColumns: EventColumnId[] = ['attended', 'followups'];
    let count = 0;

    qualifyingColumns.forEach(col => {
      eventColumns[col].forEach(event => {
        const eventDate = new Date(event.date);
        if (!Number.isNaN(eventDate.getTime()) && eventDate >= startOfMonth) {
          count++;
        }
      });
    });

    const goal = userData?.in_person_events_per_month ?? 0;
    const percentage = goal > 0 ? Math.min((count / goal) * 100, 100) : 0;
    const difference = goal > 0 ? ((count - goal) / goal) * 100 : 0;
    const statusColor = difference >= 0 ? 'green' : 'yellow';
    const statusIcon = difference >= 0 ? 'bg-green-500' : 'bg-yellow-500';
    const statusText = difference >= 0 ? `+${Math.round(difference)}%` : `${Math.round(difference)}%`;
    const statusTextColor = difference >= 0 ? 'text-green-400' : 'text-yellow-400';

    return {
      count,
      goal,
      percentage,
      statusColor,
      statusIcon,
      statusText,
      statusTextColor,
    };
  }, [eventColumns, userData]);

  const leetMetrics = useMemo(() => {
    const count = leetColumns.reflected.length;
    const goal = 4;
    const percentage = goal > 0 ? Math.min((count / goal) * 100, 100) : 0;
    const difference = goal > 0 ? ((count - goal) / goal) * 100 : 0;
    const statusColor = difference >= 0 ? 'green' : 'yellow';
    const statusIcon = difference >= 0 ? 'bg-green-500' : 'bg-yellow-500';
    const statusText = difference >= 0 ? `+${Math.round(difference)}%` : `${Math.round(difference)}%`;
    const statusTextColor = difference >= 0 ? 'text-green-400' : 'text-yellow-400';

    return {
      count,
      goal,
      percentage,
      statusColor,
      statusIcon,
      statusText,
      statusTextColor,
    };
  }, [leetColumns]);

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
            {/* Projected Offer Date (question-box styling) */
            }
            <section className="bg-gray-700 border border-light-steel-blue rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-white font-bold text-lg flex items-center">
                  <CalendarCheck className="text-electric-blue mr-3" />
                  Projected Offer Date
                </h2>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-5xl font-bold text-electric-blue text-center">{projectedOfferDateText}</div>
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
                    <div className={`w-3 h-3 ${applicationsMetrics.statusIcon} rounded-full`}></div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{applicationsMetrics.count}</div>
                  <div className="text-sm text-gray-400 mb-3">This month</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Goal: {applicationsMetrics.goal || '—'}</span>
                    {applicationsMetrics.goal > 0 && (
                      <span className={applicationsMetrics.statusTextColor}>{applicationsMetrics.statusText}</span>
                    )}
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                    <div 
                      className={`${applicationsMetrics.statusColor === 'green' ? 'bg-electric-blue' : 'bg-yellow-500'} h-2 rounded-full`} 
                      style={{width: `${Math.min(Math.max(applicationsMetrics.percentage, 0), 100)}%`}}
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
                    <div className={`w-3 h-3 ${coffeeChatsMetrics.statusIcon} rounded-full`}></div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{coffeeChatsMetrics.count}</div>
                  <div className="text-sm text-gray-400 mb-3">This month</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Goal: {coffeeChatsMetrics.goal || '—'}</span>
                    {coffeeChatsMetrics.goal > 0 && (
                      <span className={coffeeChatsMetrics.statusTextColor}>{coffeeChatsMetrics.statusText}</span>
                    )}
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                    <div 
                      className={`${coffeeChatsMetrics.statusColor === 'green' ? 'bg-electric-blue' : 'bg-yellow-500'} h-2 rounded-full`} 
                      style={{width: `${Math.min(Math.max(coffeeChatsMetrics.percentage, 0), 100)}%`}}
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
                    <div className={`w-3 h-3 ${eventsMetrics.statusIcon} rounded-full`}></div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{eventsMetrics.count}</div>
                  <div className="text-sm text-gray-400 mb-3">This month</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Goal: {eventsMetrics.goal || '—'}</span>
                    {eventsMetrics.goal > 0 && (
                      <span className={eventsMetrics.statusTextColor}>{eventsMetrics.statusText}</span>
                    )}
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                    <div 
                      className={`${eventsMetrics.statusColor === 'green' ? 'bg-electric-blue' : 'bg-yellow-500'} h-2 rounded-full`} 
                      style={{width: `${Math.min(Math.max(eventsMetrics.percentage, 0), 100)}%`}}
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
                    <div className={`w-3 h-3 ${leetMetrics.statusIcon} rounded-full`}></div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{leetMetrics.count}</div>
                  <div className="text-sm text-gray-400 mb-3">This month</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Goal: {leetMetrics.goal}</span>
                    <span className={leetMetrics.statusTextColor}>{leetMetrics.statusText}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                    <div 
                      className={`${leetMetrics.statusColor === 'green' ? 'bg-electric-blue' : 'bg-yellow-500'} h-2 rounded-full`} 
                      style={{width: `${Math.min(Math.max(leetMetrics.percentage, 0), 100)}%`}}
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
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-bold text-white">High Quality Applications</h4>
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
                    Applied ({appColumns.applied.length})
                  </h5>
                  <SortableContext items={appColumns.applied.map(c => c.id)} strategy={rectSortingStrategy}>
                    <DroppableColumn id="applied">
                      {appColumns.applied.map(card => (
                        <SortableAppCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    Messaged Hiring Manager ({appColumns.messagedHiringManager.length})
                  </h5>
                  <SortableContext items={appColumns.messagedHiringManager.map(c => c.id)} strategy={rectSortingStrategy}>
                    <DroppableColumn id="messagedHiringManager">
                      {appColumns.messagedHiringManager.map(card => (
                        <SortableAppCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    Messaged Recruiter ({appColumns.messagedRecruiter.length})
                  </h5>
                  <SortableContext items={appColumns.messagedRecruiter.map(c => c.id)} strategy={rectSortingStrategy}>
                    <DroppableColumn id="messagedRecruiter">
                      {appColumns.messagedRecruiter.map(card => (
                        <SortableAppCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    Followed Up ({appColumns.followedUp.length})
                  </h5>
                  <SortableContext items={appColumns.followedUp.map(c => c.id)} strategy={rectSortingStrategy}>
                    <DroppableColumn id="followedUp">
                      {appColumns.followedUp.map(card => (
                        <SortableAppCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-pink-500 rounded-full mr-2"></div>
                    Interview ({appColumns.interview.length})
                  </h5>
                  <SortableContext items={appColumns.interview.map(c => c.id)} strategy={rectSortingStrategy}>
                    <DroppableColumn id="interview">
                      {appColumns.interview.map(card => (
                        <SortableAppCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>
              </div>
              <DragOverlay>
                {activeAppId ? (() => {
                  const col = getColumnOfItem(activeAppId);
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
                      <div className="flex items-center justify-between text-xs mt-2">
                        <span className="text-yellow-400">{new Date(card.dateCreated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span className="text-gray-500">ID: {card.id}</span>
                      </div>
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
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-bold text-white">Coffee Chats</h4>
              <button 
                onClick={() => {
                  setEditingCoffeeChat(null);
                  setIsCoffeeChatModalOpen(true);
                }}
                className="bg-electric-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
              >
                <Plus className="mr-2" />New Outreach
              </button>
            </div>
            {isLoadingCoffeeChats ? (
              <div className="text-center py-8 text-gray-400">Loading coffee chats...</div>
            ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleCoffeeChatsDragStart} onDragOver={handleCoffeeChatsDragOver} onDragEnd={handleCoffeeChatsDragEnd}>
              <div className="grid grid-cols-4 gap-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    Outreach Request Sent ({coffeeChatColumns.outreach.length})
                  </h5>
                  <SortableContext items={coffeeChatColumns.outreach.map(c => String(c.id))} strategy={rectSortingStrategy}>
                    <DroppableColumn id="outreach">
                      {coffeeChatColumns.outreach.map(card => (
                        <SortableCoffeeChatCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    Request Accepted ({coffeeChatColumns.accepted.length})
                  </h5>
                  <SortableContext items={coffeeChatColumns.accepted.map(c => String(c.id))} strategy={rectSortingStrategy}>
                    <DroppableColumn id="accepted">
                      {coffeeChatColumns.accepted.map(card => (
                        <SortableCoffeeChatCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    Followed Up ({coffeeChatColumns.followedUpCoffee.length})
                  </h5>
                  <SortableContext items={coffeeChatColumns.followedUpCoffee.map(c => String(c.id))} strategy={rectSortingStrategy}>
                    <DroppableColumn id="followedUpCoffee">
                      {coffeeChatColumns.followedUpCoffee.map(card => (
                        <SortableCoffeeChatCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    Coffee Chat ({coffeeChatColumns.coffeeChat.length})
                  </h5>
                  <SortableContext items={coffeeChatColumns.coffeeChat.map(c => String(c.id))} strategy={rectSortingStrategy}>
                    <DroppableColumn id="coffeeChat">
                      {coffeeChatColumns.coffeeChat.map(card => (
                        <SortableCoffeeChatCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>
              </div>
              <DragOverlay>
                {activeCoffeeChatId ? (() => {
                  const col = getCoffeeChatColumnOfItem(activeCoffeeChatId);
                  if (!col) return null;
                  const card = coffeeChatColumns[col].find(c => String(c.id) === activeCoffeeChatId);
                  if (!card) return null;
                  return (
                    <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3">
                      <div className="text-white font-medium mb-1">{card.name}</div>
                      <div className="text-gray-400 text-xs mb-1">{card.company}</div>
                      <div className="flex items-center justify-between text-xs mt-2">
                        <span className="text-yellow-400">{new Date(card.dateCreated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span className="text-gray-500">ID: {card.id}</span>
                      </div>
                    </div>
                  );
                })() : null}
              </DragOverlay>
            </DndContext>
            )}

            {/* Create/Edit Modal */}
            {isCoffeeChatModalOpen && (
              <CoffeeChatModal
                coffeeChat={editingCoffeeChat}
                onClose={() => {
                  setIsCoffeeChatModalOpen(false);
                  setEditingCoffeeChat(null);
                }}
                onSave={async (data) => {
                  try {
                    if (editingCoffeeChat) {
                      // Update existing
                      const response = await fetch('/api/linkedin_outreach', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...data, id: editingCoffeeChat.id }),
                      });
                      if (!response.ok) throw new Error('Failed to update coffee chat');
                    } else {
                      // Create new
                      const response = await fetch('/api/linkedin_outreach', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                      });
                      if (!response.ok) throw new Error('Failed to create coffee chat');
                    }
                    await fetchCoffeeChats();
                    setIsCoffeeChatModalOpen(false);
                    setEditingCoffeeChat(null);
                  } catch (error) {
                    console.error('Error saving coffee chat:', error);
                    alert('Failed to save coffee chat. Please try again.');
                  }
                }}
              />
            )}

            {/* Delete Confirmation Modal */}
            {isDeletingCoffeeChat !== null && (
              <DeleteModal
                onConfirm={async () => {
                  try {
                    const response = await fetch(`/api/linkedin_outreach?id=${isDeletingCoffeeChat}`, {
                      method: 'DELETE',
                    });
                    if (!response.ok) throw new Error('Failed to delete coffee chat');
                    await fetchCoffeeChats();
                    setIsDeletingCoffeeChat(null);
                  } catch (error) {
                    console.error('Error deleting coffee chat:', error);
                    alert('Failed to delete coffee chat. Please try again.');
                    setIsDeletingCoffeeChat(null);
                  }
                }}
                onCancel={() => setIsDeletingCoffeeChat(null)}
              />
            )}
          </section>
        )}

        {/* Events Content */}
        {activeTab === 'events' && (
          <section className="bg-gray-800 border border-light-steel-blue rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-bold text-white">In-Person Events</h4>
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
                    Scheduled ({eventColumns.upcoming.length})
                  </h5>
                  <SortableContext items={eventColumns.upcoming.map(event => String(event.id))} strategy={rectSortingStrategy}>
                    <DroppableColumn id="upcoming">
                      {eventColumns.upcoming.map(event => (
                        <SortableEventCard key={event.id} card={event} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    Attending ({eventColumns.attending.length})
                  </h5>
                  <SortableContext items={eventColumns.attending.map(event => String(event.id))} strategy={rectSortingStrategy}>
                    <DroppableColumn id="attending">
                      {eventColumns.attending.map(event => (
                        <SortableEventCard key={event.id} card={event} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    Attended ({eventColumns.attended.length})
                  </h5>
                  <SortableContext items={eventColumns.attended.map(event => String(event.id))} strategy={rectSortingStrategy}>
                    <DroppableColumn id="attended">
                      {eventColumns.attended.map(event => (
                        <SortableEventCard key={event.id} card={event} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    Followed Up ({eventColumns.followups.length})
                  </h5>
                  <SortableContext items={eventColumns.followups.map(event => String(event.id))} strategy={rectSortingStrategy}>
                    <DroppableColumn id="followups">
                      {eventColumns.followups.map(event => (
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
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-bold text-white">LeetCode Progress</h4>
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
                    Planned ({leetColumns.planned.length})
                  </h5>
                  <SortableContext items={leetColumns.planned.map(entry => String(entry.id))} strategy={rectSortingStrategy}>
                    <DroppableColumn id="planned">
                      {leetColumns.planned.map(entry => (
                        <SortableLeetCard key={entry.id} card={entry} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    Solved ({leetColumns.solved.length})
                  </h5>
                  <SortableContext items={leetColumns.solved.map(entry => String(entry.id))} strategy={rectSortingStrategy}>
                    <DroppableColumn id="solved">
                      {leetColumns.solved.map(entry => (
                        <SortableLeetCard key={entry.id} card={entry} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    Reflected ({leetColumns.reflected.length})
                  </h5>
                  <SortableContext items={leetColumns.reflected.map(entry => String(entry.id))} strategy={rectSortingStrategy}>
                    <DroppableColumn id="reflected">
                      {leetColumns.reflected.map(entry => (
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
  const [formData, setFormData] = useState({
    company: application?.company || '',
    hiringManager: application?.hiringManager || '',
    msgToManager: application?.msgToManager || '',
    recruiter: application?.recruiter || '',
    msgToRecruiter: application?.msgToRecruiter || '',
    notes: application?.notes || '',
    status: application?.status || 'applied',
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
        status: application.status || 'applied',
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
      });
    }
  }, [application]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company.trim()) {
      alert('Company name is required');
      return;
    }
    onSave(formData);
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
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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

// Coffee Chat Modal Component
function CoffeeChatModal({ 
  coffeeChat, 
  onClose, 
  onSave 
}: { 
  coffeeChat: CoffeeChat | null; 
  onClose: () => void; 
  onSave: (data: Partial<CoffeeChat>) => void;
}) {
  const [formData, setFormData] = useState({
    name: coffeeChat?.name || '',
    company: coffeeChat?.company || '',
    message: coffeeChat?.message || '',
    linkedInUrl: coffeeChat?.linkedInUrl || '',
    notes: coffeeChat?.notes || '',
    status: coffeeChat?.status || 'outreachRequestSent',
    recievedReferral: coffeeChat?.recievedReferral || false,
  });

  // Update form data when coffeeChat changes
  useEffect(() => {
    if (coffeeChat) {
      setFormData({
        name: coffeeChat.name || '',
        company: coffeeChat.company || '',
        message: coffeeChat.message || '',
        linkedInUrl: coffeeChat.linkedInUrl || '',
        notes: coffeeChat.notes || '',
        status: coffeeChat.status || 'outreachRequestSent',
        recievedReferral: coffeeChat.recievedReferral || false,
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
      });
    }
  }, [coffeeChat]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.company.trim()) {
      alert('Name and company are required');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">
            {coffeeChat ? 'Edit Coffee Chat' : 'Create New Coffee Chat'}
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
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
            >
              <option value="outreachRequestSent">Outreach Request Sent</option>
              <option value="accepted">Request Accepted</option>
              <option value="followedUp">Followed Up</option>
              <option value="coffeeChat">Coffee Chat</option>
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
              {coffeeChat ? 'Update' : 'Create'}
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

  const [formData, setFormData] = useState({
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

    onSave({
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
    });
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
                  className="bg-gray-700 border border-light-steel-blue rounded-lg px-3 py-2 text-white"
                >
                  {hourOptions.map(hour => (
                    <option key={hour} value={hour}>{hour}</option>
                  ))}
                </select>
                <select
                  value={formData.timeMinute}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeMinute: e.target.value }))}
                  className="bg-gray-700 border border-light-steel-blue rounded-lg px-3 py-2 text-white"
                >
                  {minuteOptions.map(minute => (
                    <option key={minute} value={minute}>{minute}</option>
                  ))}
                </select>
                <select
                  value={formData.timePeriod}
                  onChange={(e) => setFormData(prev => ({ ...prev, timePeriod: e.target.value as 'AM' | 'PM' }))}
                  className="bg-gray-700 border border-light-steel-blue rounded-lg px-3 py-2 text-white"
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
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
            >
              <option value="scheduled">Scheduled</option>
              <option value="attending">Attending</option>
              <option value="attended">Attended</option>
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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-white font-semibold mb-2">People Spoken To</label>
              <input
                type="number"
                min={0}
                value={formData.numPeopleSpokenTo}
                onChange={(e) => setFormData(prev => ({ ...prev, numPeopleSpokenTo: e.target.value }))}
                className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">LinkedIn Requests</label>
              <input
                type="number"
                min={0}
                value={formData.numLinkedInRequests}
                onChange={(e) => setFormData(prev => ({ ...prev, numLinkedInRequests: e.target.value }))}
                className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2">Interviews from Event</label>
              <input
                type="number"
                min={0}
                value={formData.numOfInterviews}
                onChange={(e) => setFormData(prev => ({ ...prev, numOfInterviews: e.target.value }))}
                className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="careerFair"
              checked={formData.careerFair}
              onChange={(e) => setFormData(prev => ({ ...prev, careerFair: e.target.checked }))}
              className="w-4 h-4 bg-gray-700 border border-light-steel-blue rounded text-electric-blue focus:ring-electric-blue"
            />
            <label htmlFor="careerFair" className="ml-2 text-white font-semibold">
              This is a career fair
            </label>
          </div>

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
  const [formData, setFormData] = useState({
    problem: entry?.problem ?? '',
    problemType: entry?.problemType ?? '',
    difficulty: entry?.difficulty ?? '',
    url: entry?.url ?? '',
    reflection: entry?.reflection ?? '',
    status: entry?.status ?? 'planned',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.problem.trim()) {
      alert('Problem name is required');
      return;
    }

    onSave({
      problem: formData.problem.trim(),
      problemType: formData.problemType ? formData.problemType.trim() : null,
      difficulty: formData.difficulty ? formData.difficulty.trim() : null,
      url: formData.url ? formData.url.trim() : null,
      reflection: formData.reflection ? formData.reflection.trim() : null,
      status: formData.status,
    });
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
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
            >
              <option value="planned">Planned</option>
              <option value="solved">Solved</option>
              <option value="reflected">Reflected</option>
            </select>
          </div>

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
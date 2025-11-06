'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent, type DragOverEvent, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Gauge, FileText, MessageCircle, Users, Code, CalendarCheck, Plus, X, Edit2, Trash2 } from 'lucide-react';

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

  // dnd-kit: Events board (keeping for other boards)
  type PipelineCard = {
    id: string;
    title: string;
    subtitle: string;
    leftLabel: string;
    rightLabel: string;
    leftClass?: string;
    rightClass?: string;
  };

  // Fetch LinkedIn outreach (Coffee Chats) from API
  const fetchCoffeeChats = useCallback(async () => {
    if (isFetchingCoffeeChatsRef.current) return;
    
    try {
      isFetchingCoffeeChatsRef.current = true;
      setIsLoadingCoffeeChats(true);
      const response = await fetch('/api/linkedin_outreach');
      if (!response.ok) throw new Error('Failed to fetch LinkedIn outreach');
      const data = await response.json();
      setCoffeeChats(data);
      
      // Group LinkedIn outreach by status
      const grouped: Record<CoffeeChatColumnId, CoffeeChat[]> = {
        outreach: [],
        accepted: [],
        followedUpCoffee: [],
        coffeeChat: [],
      };
      
      data.forEach((chat: CoffeeChat) => {
        const column = coffeeChatStatusToColumn[chat.status] || 'outreach';
        grouped[column].push(chat);
      });
      
      setCoffeeChatColumns(grouped);
    } catch (error) {
      console.error('Error fetching LinkedIn outreach:', error);
    } finally {
      setIsLoadingCoffeeChats(false);
      isFetchingCoffeeChatsRef.current = false;
    }
  }, []);

  // Fetch LinkedIn outreach when tab is active or when overview tab is active (needed for metrics)
  useEffect(() => {
    if ((activeTab === 'interviews' || activeTab === 'overview') && !isFetchingCoffeeChatsRef.current) {
      fetchCoffeeChats();
    }
  }, [activeTab, fetchCoffeeChats]);

  const getCoffeeChatColumnOfItem = (id: string): CoffeeChatColumnId | null => {
    const entry = (Object.keys(coffeeChatColumns) as CoffeeChatColumnId[]).find(col => 
      coffeeChatColumns[col].some(c => String(c.id) === id)
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

    // Update UI optimistically
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
      
      // Update status in database
      try {
        const newStatus = coffeeChatColumnToStatus[toCol];
        const response = await fetch(`/api/linkedin_outreach?id=${movingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!response.ok) throw new Error('Failed to update status');
        
        // Update the coffee chat in the main list
        setCoffeeChats(prev => prev.map(chat => 
          chat.id === movingItem.id ? { ...chat, status: newStatus } : chat
        ));
      } catch (error) {
        console.error('Error updating status:', error);
        // Revert on error
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
    // State updates should only happen in onDragEnd to prevent infinite loops
  };

  // dnd-kit: Events board
  type EventsColumnId = 'upcoming' | 'attending' | 'attended' | 'followups';
  const [eventColumns, setEventColumns] = useState<Record<EventsColumnId, PipelineCard[]>>({
    upcoming: [
      { id: 'career-fair', title: 'Tech Career Fair', subtitle: 'Dec 18, 10:00 AM', leftLabel: 'San Francisco', rightLabel: 'In-person', leftClass: 'text-yellow-400', rightClass: 'text-gray-500' },
      { id: 'startup-networking', title: 'Startup Networking', subtitle: 'Dec 20, 6:00 PM', leftLabel: 'Palo Alto', rightLabel: 'Networking', leftClass: 'text-yellow-400', rightClass: 'text-gray-500' },
    ],
    attending: [
      { id: 'aiml-meetup', title: 'AI/ML Meetup', subtitle: 'Currently attending', leftLabel: 'Live now', rightLabel: 'Online', leftClass: 'text-blue-400', rightClass: 'text-gray-500' },
    ],
    attended: [
      { id: 'google-talk', title: 'Google Tech Talk', subtitle: 'Attended Dec 10', leftLabel: '3 connections made', rightLabel: 'Success', leftClass: 'text-purple-400', rightClass: 'text-green-500' },
      { id: 'startup-demo', title: 'Startup Demo Day', subtitle: 'Attended Dec 5', leftLabel: '2 connections made', rightLabel: 'Success', leftClass: 'text-purple-400', rightClass: 'text-green-500' },
    ],
    followups: [
      { id: 'netflix-recruiter', title: 'Netflix Recruiter', subtitle: 'Follow-up scheduled', leftLabel: 'LinkedIn message sent', rightLabel: 'Active', leftClass: 'text-green-400', rightClass: 'text-green-500' },
    ],
  });

  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  const handleEventsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const columns = eventColumns;
    const colKeys = Object.keys(columns) as EventsColumnId[];
    const fromCol = colKeys.find(col => columns[col].some(c => c.id === activeId));
    const overCol: EventsColumnId | undefined = (colKeys as string[]).includes(overId) ? (overId as EventsColumnId) : colKeys.find(col => columns[col].some(c => c.id === overId));
    if (!fromCol || !overCol) return;
    if (fromCol === overCol) {
      const items = columns[fromCol];
      const oldIndex = items.findIndex(i => i.id === activeId);
      const newIndex = items.findIndex(i => i.id === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      setEventColumns(prev => ({ ...prev, [fromCol]: arrayMove(prev[fromCol], oldIndex, newIndex) }));
    } else {
      const fromItems = columns[fromCol];
      const toItems = columns[overCol];
      const movingIndex = fromItems.findIndex(i => i.id === activeId);
      if (movingIndex === -1) return;
      const movingItem = fromItems[movingIndex];
      const overIndex = toItems.findIndex(i => i.id === overId);
      const insertIndex = overIndex === -1 ? toItems.length : overIndex;
      const newFrom = [...fromItems.slice(0, movingIndex), ...fromItems.slice(movingIndex + 1)];
      const newTo = [...toItems.slice(0, insertIndex), movingItem, ...toItems.slice(insertIndex)];
      setEventColumns(prev => ({ ...prev, [fromCol]: newFrom, [overCol]: newTo }));
    }
    setActiveEventId(null);
  };

  const handleEventsDragStart = (event: DragStartEvent) => {
    setActiveEventId(String(event.active.id));
  };

  const handleEventsDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const columns = eventColumns;
    const colKeys = Object.keys(columns) as EventsColumnId[];
    const fromCol = colKeys.find(col => columns[col].some(c => c.id === activeId));
    const overCol: EventsColumnId | undefined = (colKeys as string[]).includes(overId) ? (overId as EventsColumnId) : colKeys.find(col => columns[col].some(c => c.id === overId));
    if (!fromCol || !overCol || fromCol === overCol) return;
    setEventColumns(prev => {
      const fromItems = prev[fromCol];
      const toItems = prev[overCol];
      const movingIndex = fromItems.findIndex(i => i.id === activeId);
      if (movingIndex === -1) return prev;
      const movingItem = fromItems[movingIndex];
      const overIndex = toItems.findIndex(i => i.id === overId);
      const insertIndex = overIndex === -1 ? toItems.length : overIndex;
      return {
        ...prev,
        [fromCol]: [...fromItems.slice(0, movingIndex), ...fromItems.slice(movingIndex + 1)],
        [overCol]: [...toItems.slice(0, insertIndex), movingItem, ...toItems.slice(insertIndex)],
      };
    });
  };

  // dnd-kit: LeetCode board
  type LeetColumnId = 'planned' | 'solved' | 'reflected';
  const [leetColumns, setLeetColumns] = useState<Record<LeetColumnId, PipelineCard[]>>({
    planned: [
      { id: 'two-sum', title: 'Two Sum', subtitle: 'Easy - Arrays', leftLabel: 'Planned', rightLabel: 'Easy', leftClass: 'text-yellow-400', rightClass: 'text-gray-500' },
      { id: 'valid-paren', title: 'Valid Parentheses', subtitle: 'Easy - Stack', leftLabel: 'Planned', rightLabel: 'Easy', leftClass: 'text-yellow-400', rightClass: 'text-gray-500' },
      { id: 'merge-intervals', title: 'Merge Intervals', subtitle: 'Medium - Arrays', leftLabel: 'Planned', rightLabel: 'Medium', leftClass: 'text-yellow-400', rightClass: 'text-gray-500' },
    ],
    solved: [
      { id: 'bt-inorder', title: 'Binary Tree Inorder', subtitle: 'Medium - Trees', leftLabel: 'Solved', rightLabel: 'Dec 12', leftClass: 'text-green-400', rightClass: 'text-gray-500' },
      { id: 'reverse-ll', title: 'Reverse Linked List', subtitle: 'Easy - Linked Lists', leftLabel: 'Solved', rightLabel: 'Dec 10', leftClass: 'text-green-400', rightClass: 'text-gray-500' },
      { id: 'max-subarray', title: 'Maximum Subarray', subtitle: 'Medium - Arrays', leftLabel: 'Solved', rightLabel: 'Dec 8', leftClass: 'text-green-400', rightClass: 'text-gray-500' },
    ],
    reflected: [
      { id: 'climbing-stairs', title: 'Climbing Stairs', subtitle: 'Easy - DP', leftLabel: 'Reflected', rightLabel: 'Patterns noted', leftClass: 'text-purple-400', rightClass: 'text-green-500' },
      { id: 'lcs', title: 'Longest Common Subsequence', subtitle: 'Medium - DP', leftLabel: 'Reflected', rightLabel: 'Patterns noted', leftClass: 'text-purple-400', rightClass: 'text-green-500' },
    ],
  });

  const [activeLeetId, setActiveLeetId] = useState<string | null>(null);

  const handleLeetDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const columns = leetColumns;
    const colKeys = Object.keys(columns) as LeetColumnId[];
    const fromCol = colKeys.find(col => columns[col].some(c => c.id === activeId));
    const overCol: LeetColumnId | undefined = (colKeys as string[]).includes(overId) ? (overId as LeetColumnId) : colKeys.find(col => columns[col].some(c => c.id === overId));
    if (!fromCol || !overCol) return;
    if (fromCol === overCol) {
      const items = columns[fromCol];
      const oldIndex = items.findIndex(i => i.id === activeId);
      const newIndex = items.findIndex(i => i.id === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      setLeetColumns(prev => ({ ...prev, [fromCol]: arrayMove(prev[fromCol], oldIndex, newIndex) }));
    } else {
      const fromItems = columns[fromCol];
      const toItems = columns[overCol];
      const movingIndex = fromItems.findIndex(i => i.id === activeId);
      if (movingIndex === -1) return;
      const movingItem = fromItems[movingIndex];
      const overIndex = toItems.findIndex(i => i.id === overId);
      const insertIndex = overIndex === -1 ? toItems.length : overIndex;
      const newFrom = [...fromItems.slice(0, movingIndex), ...fromItems.slice(movingIndex + 1)];
      const newTo = [...toItems.slice(0, insertIndex), movingItem, ...toItems.slice(insertIndex)];
      setLeetColumns(prev => ({ ...prev, [fromCol]: newFrom, [overCol]: newTo }));
    }
    setActiveLeetId(null);
  };

  const handleLeetDragStart = (event: DragStartEvent) => {
    setActiveLeetId(String(event.active.id));
  };

  const handleLeetDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const columns = leetColumns;
    const colKeys = Object.keys(columns) as LeetColumnId[];
    const fromCol = colKeys.find(col => columns[col].some(c => c.id === activeId));
    const overCol: LeetColumnId | undefined = (colKeys as string[]).includes(overId) ? (overId as LeetColumnId) : colKeys.find(col => columns[col].some(c => c.id === overId));
    if (!fromCol || !overCol || fromCol === overCol) return;
    setLeetColumns(prev => {
      const fromItems = prev[fromCol];
      const toItems = prev[overCol];
      const movingIndex = fromItems.findIndex(i => i.id === activeId);
      if (movingIndex === -1) return prev;
      const movingItem = fromItems[movingIndex];
      const overIndex = toItems.findIndex(i => i.id === overId);
      const insertIndex = overIndex === -1 ? toItems.length : overIndex;
      return {
        ...prev,
        [fromCol]: [...fromItems.slice(0, movingIndex), ...fromItems.slice(movingIndex + 1)],
        [overCol]: [...toItems.slice(0, insertIndex), movingItem, ...toItems.slice(insertIndex)],
      };
    });
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

  function SortablePipelineCard(props: { card: PipelineCard }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.card.id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0 : undefined,
    } as React.CSSProperties;
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
        <div className="text-white font-medium mb-1">{props.card.title}</div>
        <div className="text-gray-400 text-sm mb-2">{props.card.subtitle}</div>
        <div className="flex items-center justify-between text-xs">
          <span className={props.card.leftClass ?? 'text-yellow-400'}>{props.card.leftLabel}</span>
          <span className={props.card.rightClass ?? 'text-gray-500'}>{props.card.rightLabel}</span>
        </div>
      </div>
    );
  }

  const [userData, setUserData] = useState<{
    apps_with_outreach_per_week?: number | null;
    info_interview_outreach_per_month?: number | null;
    projected_offer_date?: string | null;
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

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleHabitCardClick = (cardId: string) => {
    setActiveTab(cardId);
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
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">4</div>
                  <div className="text-sm text-gray-400 mb-3">This month</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Goal: 3</span>
                    <span className="text-green-400">+33%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                    <div className="bg-electric-blue h-2 rounded-full" style={{width: '133%'}}></div>
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
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">47</div>
                  <div className="text-sm text-gray-400 mb-3">This month</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Goal: 40</span>
                    <span className="text-green-400">+18%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                    <div className="bg-electric-blue h-2 rounded-full" style={{width: '118%'}}></div>
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
              <h4 className="text-xl font-bold text-white">Event Tracking</h4>
              <button className="bg-electric-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center">
                <Plus className="mr-2" />Add Event
              </button>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleEventsDragStart} onDragOver={handleEventsDragOver} onDragEnd={handleEventsDragEnd}>
              <div className="grid grid-cols-4 gap-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    Scheduled ({eventColumns.upcoming.length})
                  </h5>
                  <SortableContext items={eventColumns.upcoming.map(c => c.id)} strategy={rectSortingStrategy}>
                    <DroppableColumn id="upcoming">
                      {eventColumns.upcoming.map(card => (
                        <SortablePipelineCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    Attended ({eventColumns.attending.length})
                  </h5>
                  <SortableContext items={eventColumns.attending.map(c => c.id)} strategy={rectSortingStrategy}>
                    <DroppableColumn id="attending">
                      {eventColumns.attending.map(card => (
                        <SortablePipelineCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    Connected Online ({eventColumns.attended.length})
                  </h5>
                  <SortableContext items={eventColumns.attended.map(c => c.id)} strategy={rectSortingStrategy}>
                    <DroppableColumn id="attended">
                      {eventColumns.attended.map(card => (
                        <SortablePipelineCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    Followed Up ({eventColumns.followups.length})
                  </h5>
                  <SortableContext items={eventColumns.followups.map(c => c.id)} strategy={rectSortingStrategy}>
                    <DroppableColumn id="followups">
                      {eventColumns.followups.map(card => (
                        <SortablePipelineCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>
              </div>
              <DragOverlay>
                {activeEventId ? (() => {
                  const columns = eventColumns;
                  const col = (Object.keys(columns) as EventsColumnId[]).find(k => columns[k].some(c => c.id === activeEventId));
                  if (!col) return null;
                  const card = columns[col].find(c => c.id === activeEventId);
                  if (!card) return null;
                  return (
                    <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3">
                      <div className="text-white font-medium mb-1">{card.title}</div>
                      <div className="text-gray-400 text-sm mb-2">{card.subtitle}</div>
                      <div className="flex items-center justify-between text-xs">
                        <span className={card.leftClass ?? 'text-yellow-400'}>{card.leftLabel}</span>
                        <span className={card.rightClass ?? 'text-gray-500'}>{card.rightLabel}</span>
                      </div>
                    </div>
                  );
                })() : null}
              </DragOverlay>
            </DndContext>
          </section>
        )}

        {/* LeetCode Content */}
        {activeTab === 'leetcode' && (
          <section className="bg-gray-800 border border-light-steel-blue rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-bold text-white">LeetCode Progress</h4>
              <button className="bg-electric-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center">
                <Plus className="mr-2" />Log Practice
              </button>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleLeetDragStart} onDragOver={handleLeetDragOver} onDragEnd={handleLeetDragEnd}>
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    Planned ({leetColumns.planned.length})
                  </h5>
                  <SortableContext items={leetColumns.planned.map(c => c.id)} strategy={rectSortingStrategy}>
                    <DroppableColumn id="planned">
                      {leetColumns.planned.map(card => (
                        <SortablePipelineCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    Solved ({leetColumns.solved.length})
                  </h5>
                  <SortableContext items={leetColumns.solved.map(c => c.id)} strategy={rectSortingStrategy}>
                    <DroppableColumn id="solved">
                      {leetColumns.solved.map(card => (
                        <SortablePipelineCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    Reflected ({leetColumns.reflected.length})
                  </h5>
                  <SortableContext items={leetColumns.reflected.map(c => c.id)} strategy={rectSortingStrategy}>
                    <DroppableColumn id="reflected">
                      {leetColumns.reflected.map(card => (
                        <SortablePipelineCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>
              </div>
              <DragOverlay>
                {activeLeetId ? (() => {
                  const columns = leetColumns;
                  const col = (Object.keys(columns) as LeetColumnId[]).find(k => columns[k].some(c => c.id === activeLeetId));
                  if (!col) return null;
                  const card = columns[col].find(c => c.id === activeLeetId);
                  if (!card) return null;
                  return (
                    <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3">
                      <div className="text-white font-medium mb-1">{card.title}</div>
                      <div className="text-gray-400 text-sm mb-2">{card.subtitle}</div>
                      <div className="flex items-center justify-between text-xs">
                        <span className={card.leftClass ?? 'text-yellow-400'}>{card.leftLabel}</span>
                        <span className={card.rightClass ?? 'text-gray-500'}>{card.rightLabel}</span>
                      </div>
                    </div>
                  );
                })() : null}
              </DragOverlay>
            </DndContext>
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
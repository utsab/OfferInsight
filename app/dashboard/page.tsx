'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent, type DragOverEvent, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function Page() {
  const [activeTab, setActiveTab] = useState('overview');
  const [projectedOfferDate, setProjectedOfferDate] = useState<Date | null>(null);

  // dnd-kit: Applications board state
  type AppCard = {
    id: string;
    title: string;
    location: string;
    leftLabel: string;
    rightLabel: string;
  };

  type ColumnId = 'applied' | 'messagedRecruiter' | 'messagedHiringManager' | 'followedUp' | 'interview';
  const [appColumns, setAppColumns] = useState<Record<ColumnId, AppCard[]>>({
    applied: [
      { id: 'google-swe', title: 'Google Software Engineer', location: 'Mountain View, CA', leftLabel: 'Applied Dec 12', rightLabel: 'High Priority' },
      { id: 'microsoft-pm', title: 'Microsoft Product Manager', location: 'Seattle, WA', leftLabel: 'Applied Dec 11', rightLabel: 'Medium Priority' },
      { id: 'tesla-swe', title: 'Tesla Software Engineer', location: 'Austin, TX', leftLabel: 'Applied Dec 10', rightLabel: 'High Priority' },
    ],
    messagedRecruiter: [
      { id: 'meta-ds', title: 'Meta Data Scientist', location: 'Menlo Park, CA', leftLabel: 'Messaged recruiter', rightLabel: 'Dec 9' },
    ],
    messagedHiringManager: [
      { id: 'stripe-backend', title: 'Stripe Backend Engineer', location: 'San Francisco, CA', leftLabel: 'Messaged hiring manager', rightLabel: 'Dec 8' },
    ],
    followedUp: [
      { id: 'netflix-eng', title: 'Netflix Engineering', location: 'Los Gatos, CA', leftLabel: 'Followed up', rightLabel: 'Dec 7' },
    ],
    interview: [
      { id: 'apple-ios', title: 'Apple iOS Developer', location: 'Cupertino, CA', leftLabel: 'Interview Scheduled', rightLabel: 'Dec 15' },
      { id: 'uber-swe', title: 'Uber Software Engineer', location: 'San Francisco, CA', leftLabel: 'Interview Scheduled', rightLabel: 'Dec 16' },
    ],
  });

  const [activeAppId, setActiveAppId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const getColumnOfItem = (id: string): ColumnId | null => {
    const entry = (Object.keys(appColumns) as ColumnId[]).find(col => appColumns[col].some(c => c.id === id));
    return entry ?? null;
  };

  const handleApplicationsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const fromCol = getColumnOfItem(activeId);
    const toCol = (['applied','messagedRecruiter','messagedHiringManager','followedUp','interview'] as ColumnId[]).includes(overId as ColumnId)
      ? (overId as ColumnId)
      : getColumnOfItem(overId);
    if (!fromCol || !toCol) return;

    if (fromCol === toCol) {
      const items = appColumns[fromCol];
      const oldIndex = items.findIndex(i => i.id === activeId);
      const newIndex = items.findIndex(i => i.id === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      const newItems = arrayMove(items, oldIndex, newIndex);
      setAppColumns(prev => ({ ...prev, [fromCol]: newItems }));
    } else {
      const fromItems = appColumns[fromCol];
      const toItems = appColumns[toCol];
      const movingIndex = fromItems.findIndex(i => i.id === activeId);
      if (movingIndex === -1) return;
      const movingItem = fromItems[movingIndex];
      const overIndex = toItems.findIndex(i => i.id === overId);
      const insertIndex = overIndex === -1 ? toItems.length : overIndex;
      const newFrom = [...fromItems.slice(0, movingIndex), ...fromItems.slice(movingIndex + 1)];
      const newTo = [...toItems.slice(0, insertIndex), movingItem, ...toItems.slice(insertIndex)];
      setAppColumns(prev => ({ ...prev, [fromCol]: newFrom, [toCol]: newTo }));
    }
    setActiveAppId(null);
  };

  const handleApplicationsDragStart = (event: DragStartEvent) => {
    setActiveAppId(String(event.active.id));
  };

  const handleApplicationsDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const fromCol = getColumnOfItem(activeId);
    const toCol = (['applied','messagedRecruiter','messagedHiringManager','followedUp','interview'] as ColumnId[]).includes(overId as ColumnId)
      ? (overId as ColumnId)
      : getColumnOfItem(overId);
    if (!fromCol || !toCol || fromCol === toCol) return;
    setAppColumns(prev => {
      const fromItems = prev[fromCol];
      const toItems = prev[toCol];
      const movingIndex = fromItems.findIndex(i => i.id === activeId);
      if (movingIndex === -1) return prev;
      const movingItem = fromItems[movingIndex];
      const overIndex = toItems.findIndex(i => i.id === overId);
      const insertIndex = overIndex === -1 ? toItems.length : overIndex;
      return {
        ...prev,
        [fromCol]: [...fromItems.slice(0, movingIndex), ...fromItems.slice(movingIndex + 1)],
        [toCol]: [...toItems.slice(0, insertIndex), movingItem, ...toItems.slice(insertIndex)],
      };
    });
  };

  function SortableAppCard(props: { card: AppCard }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.card.id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0 : undefined,
    } as React.CSSProperties;
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-move hover:border-electric-blue transition-colors">
        <div className="text-white font-medium mb-1">{props.card.title}</div>
        <div className="text-gray-400 text-sm mb-2">{props.card.location}</div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-yellow-400">{props.card.leftLabel}</span>
          <span className="text-gray-500">{props.card.rightLabel}</span>
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

  // dnd-kit: Interviews board
  type PipelineCard = {
    id: string;
    title: string;
    subtitle: string;
    leftLabel: string;
    rightLabel: string;
    leftClass?: string;
    rightClass?: string;
  };
  type InterviewsColumnId = 'outreach' | 'accepted' | 'followedUpCoffee' | 'coffeeChat';
  const [interviewColumns, setInterviewColumns] = useState<Record<InterviewsColumnId, PipelineCard[]>>({
    outreach: [
      { id: 'google-outreach', title: 'Googler SWE', subtitle: 'Dec 20, 2:00 PM', leftLabel: 'Outreach sent', rightLabel: 'Awaiting reply', leftClass: 'text-yellow-400', rightClass: 'text-gray-500' },
      { id: 'meta-outreach', title: 'Meta DS', subtitle: 'Dec 22, 10:00 AM', leftLabel: 'Outreach sent', rightLabel: 'Awaiting reply', leftClass: 'text-yellow-400', rightClass: 'text-gray-500' },
    ],
    accepted: [
      { id: 'ms-accepted', title: 'Microsoft PM', subtitle: 'Accepted', leftLabel: 'Next: schedule', rightLabel: 'Pending', leftClass: 'text-blue-400', rightClass: 'text-gray-500' },
    ],
    followedUpCoffee: [
      { id: 'apple-followed', title: 'Apple iOS', subtitle: 'Followed up Dec 12', leftLabel: 'Nudge sent', rightLabel: 'Waiting', leftClass: 'text-purple-400', rightClass: 'text-gray-500' },
    ],
    coffeeChat: [
      { id: 'shopify-chat', title: 'Shopify Backend', subtitle: 'Coffee chat on Dec 8', leftLabel: '15 min', rightLabel: 'Done', leftClass: 'text-green-400', rightClass: 'text-green-500' },
    ],
  });

  const [activeInterviewId, setActiveInterviewId] = useState<string | null>(null);

  const handleInterviewsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const columns = interviewColumns;
    const colKeys = Object.keys(columns) as InterviewsColumnId[];
    const fromCol = colKeys.find(col => columns[col].some(c => c.id === activeId));
    const overCol: InterviewsColumnId | undefined = (colKeys as string[]).includes(overId) ? (overId as InterviewsColumnId) : colKeys.find(col => columns[col].some(c => c.id === overId));
    if (!fromCol || !overCol) return;
    if (fromCol === overCol) {
      const items = columns[fromCol];
      const oldIndex = items.findIndex(i => i.id === activeId);
      const newIndex = items.findIndex(i => i.id === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      setInterviewColumns(prev => ({ ...prev, [fromCol]: arrayMove(prev[fromCol], oldIndex, newIndex) }));
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
      setInterviewColumns(prev => ({ ...prev, [fromCol]: newFrom, [overCol]: newTo }));
    }
    setActiveInterviewId(null);
  };

  const handleInterviewsDragStart = (event: DragStartEvent) => {
    setActiveInterviewId(String(event.active.id));
  };

  const handleInterviewsDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const columns = interviewColumns;
    const colKeys = Object.keys(columns) as InterviewsColumnId[];
    const fromCol = colKeys.find(col => columns[col].some(c => c.id === activeId));
    const overCol: InterviewsColumnId | undefined = (colKeys as string[]).includes(overId) ? (overId as InterviewsColumnId) : colKeys.find(col => columns[col].some(c => c.id === overId));
    if (!fromCol || !overCol || fromCol === overCol) return;
    setInterviewColumns(prev => {
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

  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/users/onboarding2');
        if (!res.ok) return;
        const user = await res.json();
        if (user?.projected_offer_date) {
          const d = new Date(user.projected_offer_date);
          if (isMounted && !isNaN(d.getTime())) setProjectedOfferDate(d);
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
              <i className="fas fa-gauge-high mr-2"></i>Overview
            </button>
            <button 
              onClick={() => handleTabClick('applications')}
              className={`main-tab-btn flex-1 py-4 px-6 text-center font-semibold border-r border-light-steel-blue transition-colors ${
                activeTab === 'applications' 
                  ? 'bg-electric-blue text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <i className="fas fa-file-lines mr-2"></i>Applications
            </button>
            <button 
              onClick={() => handleTabClick('interviews')}
              className={`main-tab-btn flex-1 py-4 px-6 text-center font-semibold border-r border-light-steel-blue transition-colors ${
                activeTab === 'interviews' 
                  ? 'bg-electric-blue text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <i className="fas fa-comments mr-2"></i>Coffee Chats
            </button>
            <button 
              onClick={() => handleTabClick('events')}
              className={`main-tab-btn flex-1 py-4 px-6 text-center font-semibold border-r border-light-steel-blue transition-colors ${
                activeTab === 'events' 
                  ? 'bg-electric-blue text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <i className="fas fa-users mr-2"></i>Events
            </button>
            <button 
              onClick={() => handleTabClick('leetcode')}
              className={`main-tab-btn flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                activeTab === 'leetcode' 
                  ? 'bg-electric-blue text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <i className="fas fa-code mr-2"></i>LeetCode
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
                  <i className="fas fa-calendar-check text-electric-blue mr-3"></i>
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
                      <i className="fas fa-file-lines text-electric-blue text-xl"></i>
                      <h4 className="text-white font-semibold">Applications</h4>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">23</div>
                  <div className="text-sm text-gray-400 mb-3">This month</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Goal: 20</span>
                    <span className="text-green-400">+15%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                    <div className="bg-electric-blue h-2 rounded-full" style={{width: '115%'}}></div>
                  </div>
                </div>

                <div 
                  onClick={() => handleHabitCardClick('interviews')}
                  className="bg-gray-800 border border-light-steel-blue rounded-lg p-6 hover:border-electric-blue transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-comments text-electric-blue text-xl"></i>
                      <h4 className="text-white font-semibold">Interviews</h4>
                    </div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">8</div>
                  <div className="text-sm text-gray-400 mb-3">This month</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Goal: 10</span>
                    <span className="text-yellow-400">-20%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{width: '80%'}}></div>
                  </div>
                </div>

                <div 
                  onClick={() => handleHabitCardClick('events')}
                  className="bg-gray-800 border border-light-steel-blue rounded-lg p-6 hover:border-electric-blue transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-users text-electric-blue text-xl"></i>
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
                      <i className="fas fa-code text-electric-blue text-xl"></i>
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
              <button className="bg-electric-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                <i className="fas fa-plus mr-2"></i>Add Application
              </button>
            </div>
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
                  const card = appColumns[col].find(c => c.id === activeAppId);
                  if (!card) return null;
                  return (
                    <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3">
                      <div className="text-white font-medium mb-1">{card.title}</div>
                      <div className="text-gray-400 text-sm mb-2">{card.location}</div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-yellow-400">{card.leftLabel}</span>
                        <span className="text-gray-500">{card.rightLabel}</span>
                      </div>
                    </div>
                  );
                })() : null}
              </DragOverlay>
            </DndContext>
          </section>
        )}

        {/* Interviews Content */}
        {activeTab === 'interviews' && (
          <section className="bg-gray-800 border border-light-steel-blue rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-bold text-white">Coffee Chats</h4>
              <button className="bg-electric-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                <i className="fas fa-plus mr-2"></i>New Outreach
              </button>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleInterviewsDragStart} onDragOver={handleInterviewsDragOver} onDragEnd={handleInterviewsDragEnd}>
              <div className="grid grid-cols-4 gap-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    Outreach Request Sent ({interviewColumns.outreach.length})
                  </h5>
                  <SortableContext items={interviewColumns.outreach.map(c => c.id)} strategy={rectSortingStrategy}>
                    <DroppableColumn id="outreach">
                      {interviewColumns.outreach.map(card => (
                        <SortablePipelineCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    Request Accepted ({interviewColumns.accepted.length})
                  </h5>
                  <SortableContext items={interviewColumns.accepted.map(c => c.id)} strategy={rectSortingStrategy}>
                    <DroppableColumn id="accepted">
                      {interviewColumns.accepted.map(card => (
                        <SortablePipelineCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    Followed Up ({interviewColumns.followedUpCoffee.length})
                  </h5>
                  <SortableContext items={interviewColumns.followedUpCoffee.map(c => c.id)} strategy={rectSortingStrategy}>
                    <DroppableColumn id="followedUpCoffee">
                      {interviewColumns.followedUpCoffee.map(card => (
                        <SortablePipelineCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h5 className="text-white font-semibold mb-4 flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    Coffee Chat ({interviewColumns.coffeeChat.length})
                  </h5>
                  <SortableContext items={interviewColumns.coffeeChat.map(c => c.id)} strategy={rectSortingStrategy}>
                    <DroppableColumn id="coffeeChat">
                      {interviewColumns.coffeeChat.map(card => (
                        <SortablePipelineCard key={card.id} card={card} />
                      ))}
                    </DroppableColumn>
                  </SortableContext>
                </div>
              </div>
              <DragOverlay>
                {activeInterviewId ? (() => {
                  const columns = interviewColumns;
                  const col = (Object.keys(columns) as InterviewsColumnId[]).find(k => columns[k].some(c => c.id === activeInterviewId));
                  if (!col) return null;
                  const card = columns[col].find(c => c.id === activeInterviewId);
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

        {/* Events Content */}
        {activeTab === 'events' && (
          <section className="bg-gray-800 border border-light-steel-blue rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-bold text-white">Event Tracking</h4>
              <button className="bg-electric-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                <i className="fas fa-plus mr-2"></i>Add Event
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
              <button className="bg-electric-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                <i className="fas fa-plus mr-2"></i>Log Practice
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
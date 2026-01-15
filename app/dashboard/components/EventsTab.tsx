'use client';

import React, { useState, useEffect } from 'react';
import { getApiHeaders } from '@/app/lib/api-helpers';

import { Plus, Trash2, X, PlayCircle } from 'lucide-react';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { InPersonEvent, EventColumnId, BoardTimeFilter, InPersonEventStatus } from './types';
import { eventStatusToColumn, eventColumnToStatus } from './types';
import { DroppableColumn, DeleteModal, formatModalDate, toLocalDateString, getLocalTimeParts, getLocalDateParts, LockTooltip, VideoModal } from './shared';

const hourOptions = ['01','02','03','04','05','06','07','08','09','10','11','12'];
const minuteOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

// ===== DATE FIELD EDITING TOGGLE START =====
// Toggle this flag to enable editing dateCreated and dateModified in create/edit modals for testing and debugging.
const ENABLE_DATE_FIELD_EDITING = false;
// ===== DATE FIELD EDITING TOGGLE END =====

// Helper Message Component - shows video link based on current column
function HelperMessage({ status }: { status?: InPersonEventStatus | null }) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const videoUrl = 'https://www.youtube.com/watch?v=UgZrVViUQLk'; // TODO: Update with actual Events video URL

  const getMessage = () => {
    if (!status) return 'plan events';
    switch (status) {
      case 'plan':
        return 'plan events';
      case 'attended':
        return 'attend events';
      case 'sendLinkedInRequest':
        return 'send LinkedIn requests';
      case 'followUp':
        return 'follow up';
      default:
        return 'plan events';
    }
  };

  return (
    <>
      <div className="text-center py-3">
        <button
          type="button"
          onClick={() => setIsVideoOpen(true)}
          className="inline-flex items-center gap-2 text-white font-semibold hover:text-electric-blue transition-colors cursor-pointer underline"
        >
          <PlayCircle className="w-5 h-5 text-electric-blue flex-shrink-0" />
          <span>Helper video: How to {getMessage()}</span>
        </button>
      </div>
      <VideoModal videoUrl={videoUrl} isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} />
    </>
  );
}

type TimeParts = {
  hour: string;
  minute: string;
  period: 'AM' | 'PM';
};

const toLocalTimeParts = (value: string): TimeParts => {
  try {
    const { hours, minutes: mins } = getLocalTimeParts(value);
    const period = hours >= 12 ? 'PM' : 'AM';
    let displayHours = hours % 12;
    if (displayHours === 0) displayHours = 12;
    return {
      hour: String(displayHours).padStart(2, '0'),
      minute: String(mins).padStart(2, '0'),
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

type EventsTabProps = {
  filteredEventColumns: Record<EventColumnId, InPersonEvent[]>;
  eventColumns: Record<EventColumnId, InPersonEvent[]>;
  setEventColumns: React.Dispatch<React.SetStateAction<Record<EventColumnId, InPersonEvent[]>>>;
  isLoadingEvents: boolean;
  eventsFilter: BoardTimeFilter;
  setEventsFilter: (filter: BoardTimeFilter) => void;
  setIsEventModalOpen: (open: boolean) => void;
  setEditingEvent: (event: InPersonEvent | null) => void;
  sensors: any;
  handleEventsDragStart: (event: any) => void;
  handleEventsDragOver: (event: any) => void;
  handleEventsDragEnd: (event: any) => void;
  activeEventId: string | null;
  getEventColumnOfItem: (id: string) => EventColumnId | null;
  isEventModalOpen: boolean;
  editingEvent: InPersonEvent | null;
  setIsDeletingEvent: (id: number | null) => void;
  isDeletingEvent: number | null;
  fetchEvents: () => Promise<void>;
  isDraggingEventRef: React.MutableRefObject<boolean>;
  userIdParam: string | null;
};

function SortableEventCard(props: { 
  card: InPersonEvent;
  activeEventId: string | null;
  setEditingEvent: (event: InPersonEvent) => void;
  setIsEventModalOpen: (open: boolean) => void;
  setIsDeletingEvent: (id: number) => void;
  isDraggingEventRef: React.MutableRefObject<boolean>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(props.card.id) });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : undefined,
  } as React.CSSProperties;

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const day = date.getDate();
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      if (hours === 0) hours = 12;
      return `${month} ${day}, ${hours}:${String(minutes).padStart(2, '0')} ${period}`;
    } catch {
      return '';
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click during drag
    if (isDragging || props.isDraggingEventRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (props.activeEventId === String(props.card.id)) {
      return;
    }
    setTimeout(() => {
      if (!props.isDraggingEventRef.current && !isDragging && props.activeEventId !== String(props.card.id)) {
        props.setEditingEvent(props.card);
        props.setIsEventModalOpen(true);
      }
    }, 50);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    props.setIsDeletingEvent(props.card.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, touchAction: 'none' }}
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
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleDelete}
            className="p-1 hover:bg-red-600 rounded text-gray-300 hover:text-white"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-[10px] text-gray-300">
        {props.card.careerFair && (
          <span className="text-green-400 text-xs">✓ Career Fair</span>
        )}
        {props.card.nameOfPersonSpokenTo && (
          <span className="px-2 py-0.5 rounded-full bg-gray-700">Met: {props.card.nameOfPersonSpokenTo}</span>
        )}
        {props.card.sentLinkedInRequest && (
          <span className="px-2 py-0.5 rounded-full bg-gray-700">✓ LinkedIn Sent</span>
        )}
      </div>
    </div>
  );
}

// In-Person Event Modal Component
function InPersonEventModal({
  eventItem,
  onClose,
  onSave,
  defaultStatus,
  onDelete
}: {
  eventItem: InPersonEvent | null;
  onClose: () => void;
  onSave: (data: Partial<InPersonEvent> & { date?: string }) => void;
  defaultStatus?: InPersonEventStatus;
  onDelete?: () => void;
}) {

  type EventFormData = {
    event: string;
    date: string;
    timeHour: string;
    timeMinute: string;
    timePeriod: 'AM' | 'PM';
    location: string;
    url: string;
    status: InPersonEventStatus;
    nameOfPersonSpokenTo: string;
    sentLinkedInRequest: boolean;
    careerFair: boolean;
    followUpMessage: string;
    dateCreated: string; // ===== DATE FIELD EDITING: Added for testing/debugging =====
    dateModified: string; // ===== DATE FIELD EDITING: Added for testing/debugging =====
  };

  const [formData, setFormData] = useState<EventFormData>({
    event: eventItem?.event ?? '',
    date: eventItem?.date ? toLocalDateString(eventItem.date) : '',
    timeHour: eventItem?.date ? toLocalTimeParts(eventItem.date).hour : '',
    timeMinute: eventItem?.date ? toLocalTimeParts(eventItem.date).minute : '',
    timePeriod: eventItem?.date ? toLocalTimeParts(eventItem.date).period : 'AM',
    location: eventItem?.location ?? '',
    url: eventItem?.url ?? '',
    status: eventItem?.status ?? (defaultStatus || 'plan'),
    nameOfPersonSpokenTo: eventItem?.nameOfPersonSpokenTo ?? '',
    sentLinkedInRequest: eventItem?.sentLinkedInRequest ?? false,
    careerFair: eventItem?.careerFair ?? false,
    followUpMessage: eventItem?.followUpMessage ?? '',
    dateCreated: eventItem?.dateCreated ? toLocalDateString(eventItem.dateCreated) : '', // ===== DATE FIELD EDITING =====
    dateModified: eventItem?.dateModified ? toLocalDateString(eventItem.dateModified) : '', // ===== DATE FIELD EDITING =====
  });

  useEffect(() => {
    const timeParts = eventItem?.date ? toLocalTimeParts(eventItem.date) : { hour: '', minute: '', period: 'AM' as const };
    setFormData({
      event: eventItem?.event ?? '',
      date: eventItem?.date ? toLocalDateString(eventItem.date) : '',
      timeHour: timeParts.hour,
      timeMinute: timeParts.minute,
      timePeriod: timeParts.period,
      location: eventItem?.location ?? '',
      url: eventItem?.url ?? '',
      status: eventItem?.status ?? (defaultStatus || 'plan'),
      nameOfPersonSpokenTo: eventItem?.nameOfPersonSpokenTo ?? '',
      sentLinkedInRequest: eventItem?.sentLinkedInRequest ?? false,
      careerFair: eventItem?.careerFair ?? false,
      followUpMessage: eventItem?.followUpMessage ?? '',
      dateCreated: eventItem?.dateCreated ? toLocalDateString(eventItem.dateCreated) : '', // ===== DATE FIELD EDITING =====
      dateModified: eventItem?.dateModified ? toLocalDateString(eventItem.dateModified) : '', // ===== DATE FIELD EDITING =====
    });
  }, [eventItem, defaultStatus]);

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
      status: formData.status,
      nameOfPersonSpokenTo: formData.nameOfPersonSpokenTo ? formData.nameOfPersonSpokenTo.trim() : null,
      sentLinkedInRequest: formData.sentLinkedInRequest,
      careerFair: formData.careerFair,
      followUpMessage: formData.followUpMessage ? formData.followUpMessage.trim() : null,
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-4 sm:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-0" onClick={(e) => e.stopPropagation()}>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-2 text-white">Time</label>
              <div className="flex gap-2">
                <select
                  value={formData.timeHour}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeHour: e.target.value }))}
                  className="w-20 border rounded-lg px-3 py-2 bg-gray-700 border-light-steel-blue text-white"
                >
                  {hourOptions.map(hour => (
                    <option key={hour} value={hour}>{hour}</option>
                  ))}
                </select>
                <select
                  value={formData.timeMinute}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeMinute: e.target.value }))}
                  className="w-20 border rounded-lg px-3 py-2 bg-gray-700 border-light-steel-blue text-white"
                >
                  {minuteOptions.map(minute => (
                    <option key={minute} value={minute}>{minute}</option>
                  ))}
                </select>
                <select
                  value={formData.timePeriod}
                  onChange={(e) => setFormData(prev => ({ ...prev, timePeriod: e.target.value as 'AM' | 'PM' }))}
                  className="w-20 border rounded-lg px-3 py-2 bg-gray-700 border-light-steel-blue text-white"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-2 text-white">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full border rounded-lg px-4 py-2 placeholder-gray-400 bg-gray-700 border-light-steel-blue text-white"
                placeholder="City, Online, etc."
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-2 text-white">Event URL</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              className="w-full border rounded-lg px-4 py-2 placeholder-gray-400 bg-gray-700 border-light-steel-blue text-white"
              placeholder="https://example.com/event"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="careerFair"
              checked={formData.careerFair}
              onChange={(e) => setFormData(prev => ({ ...prev, careerFair: e.target.checked }))}
              className="w-4 h-4 border rounded bg-gray-700 border-light-steel-blue text-electric-blue focus:ring-electric-blue"
            />
            <label htmlFor="careerFair" className="ml-2 font-semibold text-white">
              This is a career fair
            </label>
          </div>

          {/* Helper message for Plan column */}
          {(!eventItem || eventItem.status === 'plan') && (
            <HelperMessage status={eventItem?.status ?? defaultStatus ?? 'plan'} />
          )}

          {/* Name of one person I met field - blurred in plan (revealed in next column "Attended"), visible from attended */}
          {!eventItem ? (
            // Create mode: Show Name of one person I met blurred (will be revealed in next column)
            <div className="relative group py-4">
              <div className="blur-sm">
                <label className="block font-semibold mb-2 text-white">Name of one person I met</label>
                <input
                  type="text"
                  value={formData.nameOfPersonSpokenTo}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameOfPersonSpokenTo: e.target.value }))}
                  disabled={true}
                  placeholder="Enter name"
                  className="w-full border rounded-lg px-4 py-2 placeholder-gray-400 bg-gray-700 border-light-steel-blue text-white"
                />
              </div>
              <LockTooltip />
            </div>
          ) : eventItem.status === 'plan' ? (
            // Plan status: Show Name of one person I met blurred (will be revealed in next column "Attended")
            <div className="relative group py-4">
              <div className="blur-sm">
                <label className="block font-semibold mb-2 text-white">Name of one person I met</label>
                <input
                  type="text"
                  value={formData.nameOfPersonSpokenTo}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameOfPersonSpokenTo: e.target.value }))}
                  disabled={true}
                  placeholder="Enter name"
                  className="w-full border rounded-lg px-4 py-2 placeholder-gray-400 bg-gray-700 border-light-steel-blue text-white"
                />
              </div>
              <LockTooltip />
            </div>
          ) : (
            // attended or beyond: Show Name of one person I met unblurred
            <>
              <div className={eventItem.status === 'attended' ? 'border border-yellow-500 rounded-lg p-4 bg-yellow-500/10' : ''}>
                <label className="block font-semibold mb-2 text-white">Name of one person I met</label>
                <input
                  type="text"
                  value={formData.nameOfPersonSpokenTo}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameOfPersonSpokenTo: e.target.value }))}
                  placeholder="Enter name"
                  className="w-full border rounded-lg px-4 py-2 placeholder-gray-400 bg-gray-700 border-light-steel-blue text-white"
                />
                {/* Helper message inside highlighted section */}
                {eventItem.status === 'attended' && (
                  <HelperMessage status={eventItem.status} />
                )}
              </div>

              {/* Sent LinkedIn Request checkbox - blurred in attended (revealed in next column "Send LinkedIn Request"), visible from sendLinkedInRequest */}
              {eventItem.status === 'attended' ? (
                // Attended status: Show Sent LinkedIn Request checkbox blurred (will be revealed in next column "Send LinkedIn Request")
                <div className="relative group py-4">
                  <div className="blur-sm">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="sentLinkedInRequest"
                        checked={formData.sentLinkedInRequest}
                        onChange={(e) => setFormData(prev => ({ ...prev, sentLinkedInRequest: e.target.checked }))}
                        disabled={true}
                        className="w-4 h-4 border rounded bg-gray-700 border-light-steel-blue text-electric-blue focus:ring-electric-blue"
                      />
                      <label htmlFor="sentLinkedInRequest" className="ml-2 font-semibold text-white">
                        Sent LinkedIn Request
                      </label>
                    </div>
                  </div>
                  <LockTooltip />
                </div>
              ) : eventItem.status === 'sendLinkedInRequest' || eventItem.status === 'followUp' ? (
                // sendLinkedInRequest or followUp status: Show checkbox unblurred
                <div className={eventItem.status === 'sendLinkedInRequest' ? 'border border-yellow-500 rounded-lg p-4 bg-yellow-500/10' : ''}>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="sentLinkedInRequest"
                      checked={formData.sentLinkedInRequest}
                      onChange={(e) => setFormData(prev => ({ ...prev, sentLinkedInRequest: e.target.checked }))}
                      className="w-4 h-4 border rounded bg-gray-700 border-light-steel-blue text-electric-blue focus:ring-electric-blue"
                    />
                    <label htmlFor="sentLinkedInRequest" className="ml-2 font-semibold text-white">
                      Sent LinkedIn Request
                    </label>
                  </div>
                  {/* Helper message inside highlighted section */}
                  {eventItem.status === 'sendLinkedInRequest' && (
                    <HelperMessage status={eventItem.status} />
                  )}
                </div>
              ) : null}

              {/* Follow-Up Message field - blurred in sendLinkedInRequest (revealed in net column Follow Up"), visible from followUp */}
              {eventItem.status === 'sendLinkedInRequest' ? (
                // Send LinkedIn Request status: Show Follow-Up Message blurred (will be revealed in next column "Follow Up")
                <div className="relative group py-4">
                  <div className="blur-sm">
                    <label className="block font-semibold mb-2 text-white">Follow-Up Message</label>
                    <textarea
                      value={formData.followUpMessage}
                      onChange={(e) => setFormData(prev => ({ ...prev, followUpMessage: e.target.value }))}
                      disabled={true}
                      className="w-full border rounded-lg px-4 py-2 placeholder-gray-400 min-h-[100px] bg-gray-700 border-light-steel-blue text-white"
                      placeholder="Enter follow-up message"
                    />
                  </div>
                  <LockTooltip />
                </div>
              ) : eventItem.status === 'followUp' ? (
                // Follow Up status: Show Follow-Up Message unblurred
                <div className="border border-yellow-500 rounded-lg p-4 bg-yellow-500/10">
                  <label className="block font-semibold mb-2 text-white">Follow-Up Message</label>
                  <textarea
                    value={formData.followUpMessage}
                    onChange={(e) => setFormData(prev => ({ ...prev, followUpMessage: e.target.value }))}
                    className="w-full border rounded-lg px-4 py-2 placeholder-gray-400 min-h-[100px] bg-gray-700 border-light-steel-blue text-white"
                    placeholder="Enter follow-up message"
                  />
                  {/* Helper message inside highlighted section */}
                  <HelperMessage status={eventItem.status} />
                </div>
              ) : null}
            </>
          )}

          {/* ===== DATE FIELD EDITING: Show dateCreated and dateModified fields when toggle is enabled ===== */}
          {ENABLE_DATE_FIELD_EDITING && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {eventItem && (
            <div className="text-xs text-gray-400 pt-2 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <span>Created: {formatModalDate(eventItem.dateCreated)}</span>
                <span>Modified: {formatModalDate(eventItem.dateModified)}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between sm:justify-end gap-3 pt-4">
            {eventItem && onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onDelete();
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors md:hidden order-3 sm:order-1"
              >
                <Trash2 className="inline mr-2 w-4 h-4" />Delete
              </button>
            )}
            <div className="flex gap-3 order-1 sm:order-2">
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
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EventsTab({
  filteredEventColumns,
  eventColumns,
  setEventColumns,
  isLoadingEvents,
  eventsFilter,
  setEventsFilter,
  setIsEventModalOpen,
  setEditingEvent,
  sensors,
  handleEventsDragStart,
  handleEventsDragOver,
  handleEventsDragEnd,
  activeEventId,
  getEventColumnOfItem,
  isEventModalOpen,
  editingEvent,
  setIsDeletingEvent,
  isDeletingEvent,
  fetchEvents,
  isDraggingEventRef,
  userIdParam,
}: EventsTabProps) {
  const [defaultStatus, setDefaultStatus] = React.useState<InPersonEventStatus | undefined>(undefined);
  
  return (
    <section className="bg-gray-800 border border-light-steel-blue rounded-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4 mb-6">
        <h4 className="text-xl font-bold text-white">In-Person Events</h4>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span>Show:</span>
          <button
            onClick={() => setEventsFilter('modifiedThisMonth')}
            className={`px-3 py-1 rounded-md border transition-colors ${
              eventsFilter === 'modifiedThisMonth'
                ? 'bg-electric-blue text-white border-electric-blue'
                : 'bg-gray-700 text-gray-300 border-transparent hover:border-light-steel-blue'
            }`}
          >
            This Month
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
            setDefaultStatus(undefined);
            setEditingEvent(null);
            setIsEventModalOpen(true);
          }}
          className="bg-electric-blue hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold transition-colors flex items-center text-sm sm:text-base w-full sm:w-auto"
        >
          <Plus className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />Add Event
        </button>
      </div>
      {isLoadingEvents ? (
        <div className="text-center py-8 text-gray-400">Loading events...</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleEventsDragStart} onDragOver={handleEventsDragOver} onDragEnd={handleEventsDragEnd}>
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="grid grid-cols-4 gap-6 min-w-[640px]">
            <div className="bg-gray-700 rounded-lg p-4">
              <h5 className="text-white font-semibold mb-4 flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                Plan ({filteredEventColumns.plan.length})
              </h5>
              <SortableContext items={filteredEventColumns.plan.map(event => String(event.id))} strategy={rectSortingStrategy}>
                <DroppableColumn 
                  id="plan"
                  onAddCard={() => {
                    setDefaultStatus(eventColumnToStatus.plan);
                    setEditingEvent(null);
                    setIsEventModalOpen(true);
                  }}
                  hasCardsToRight={
                    filteredEventColumns.attended.length > 0 ||
                    filteredEventColumns.sendLinkedInRequest.length > 0 ||
                    filteredEventColumns.followUp.length > 0
                  }
                >
                  {filteredEventColumns.plan.map(event => (
                    <SortableEventCard 
                      key={event.id} 
                      card={event}
                      activeEventId={activeEventId}
                      setEditingEvent={setEditingEvent}
                      setIsEventModalOpen={setIsEventModalOpen}
                      setIsDeletingEvent={setIsDeletingEvent}
                      isDraggingEventRef={isDraggingEventRef}
                    />
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
                <DroppableColumn 
                  id="attended"
                  hasCardsToRight={
                    filteredEventColumns.sendLinkedInRequest.length > 0 ||
                    filteredEventColumns.followUp.length > 0
                  }
                >
                  {filteredEventColumns.attended.map(event => (
                    <SortableEventCard 
                      key={event.id} 
                      card={event}
                      activeEventId={activeEventId}
                      setEditingEvent={setEditingEvent}
                      setIsEventModalOpen={setIsEventModalOpen}
                      setIsDeletingEvent={setIsDeletingEvent}
                      isDraggingEventRef={isDraggingEventRef}
                    />
                  ))}
                </DroppableColumn>
              </SortableContext>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h5 className="text-white font-semibold mb-4 flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                Send LinkedIn Request ({filteredEventColumns.sendLinkedInRequest.length})
              </h5>
              <SortableContext items={filteredEventColumns.sendLinkedInRequest.map(event => String(event.id))} strategy={rectSortingStrategy}>
                <DroppableColumn 
                  id="sendLinkedInRequest"
                  hasCardsToRight={filteredEventColumns.followUp.length > 0}
                >
                  {filteredEventColumns.sendLinkedInRequest.map(event => (
                    <SortableEventCard 
                      key={event.id} 
                      card={event}
                      activeEventId={activeEventId}
                      setEditingEvent={setEditingEvent}
                      setIsEventModalOpen={setIsEventModalOpen}
                      setIsDeletingEvent={setIsDeletingEvent}
                      isDraggingEventRef={isDraggingEventRef}
                    />
                  ))}
                </DroppableColumn>
              </SortableContext>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h5 className="text-white font-semibold mb-4 flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                Follow Up ({filteredEventColumns.followUp.length})
              </h5>
              <SortableContext items={filteredEventColumns.followUp.map(event => String(event.id))} strategy={rectSortingStrategy}>
                <DroppableColumn 
                  id="followUp"
                  hasCardsToRight={false}
                >
                  {filteredEventColumns.followUp.map(event => (
                    <SortableEventCard 
                      key={event.id} 
                      card={event}
                      activeEventId={activeEventId}
                      setEditingEvent={setEditingEvent}
                      setIsEventModalOpen={setIsEventModalOpen}
                      setIsDeletingEvent={setIsDeletingEvent}
                      isDraggingEventRef={isDraggingEventRef}
                    />
                  ))}
                </DroppableColumn>
              </SortableContext>
            </div>
          </div>
          </div>
          <DragOverlay style={{ touchAction: 'none' }}>
            {activeEventId ? (() => {
              const col = getEventColumnOfItem(activeEventId);
              if (!col) return null;
              const card = eventColumns[col].find(event => String(event.id) === activeEventId);
              if (!card) return null;
              const formattedDate = (() => {
                try {
                  const { year, month, day } = getLocalDateParts(card.date);
                  const { hours, minutes } = getLocalTimeParts(card.date);
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const period = hours >= 12 ? 'PM' : 'AM';
                  let displayHours = hours % 12;
                  if (displayHours === 0) displayHours = 12;
                  return `${monthNames[month]} ${day}, ${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
                } catch {
                  return '';
                }
              })();
              return (
                <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3" style={{ touchAction: 'none' }}>
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
          defaultStatus={defaultStatus}
          onClose={() => {
            setIsEventModalOpen(false);
            setEditingEvent(null);
            setDefaultStatus(undefined);
          }}
          onDelete={() => {
            if (editingEvent) {
              setIsEventModalOpen(false);
              setIsDeletingEvent(editingEvent.id);
            }
          }}
          onSave={async (data: Partial<InPersonEvent> & { date?: string }) => {
            try {
              const url = userIdParam ? `/api/in_person_events?userId=${userIdParam}` : '/api/in_person_events';
              let updatedEvent: InPersonEvent;
              if (editingEvent) {
                const response = await fetch(url, {
                  method: 'PUT',
                  headers: getApiHeaders(),
                  body: JSON.stringify({ ...data, id: editingEvent.id }),
                });
                if (!response.ok) throw new Error('Failed to update event');
                updatedEvent = await response.json() as InPersonEvent;
                
                // Optimistically update the state immediately
                setEventColumns(prev => {
                  const newColumns = { ...prev };
                  const targetColumn = eventStatusToColumn[updatedEvent.status] ?? 'plan';
                  
                  // Find the old item's column and index
                  let oldColumn: EventColumnId | null = null;
                  let oldIndex = -1;
                  Object.keys(newColumns).forEach(colId => {
                    const col = colId as EventColumnId;
                    const index = newColumns[col].findIndex(event => event.id === editingEvent.id);
                    if (index !== -1) {
                      oldColumn = col;
                      oldIndex = index;
                    }
                  });
                  
                  if (oldColumn !== null && oldIndex !== -1) {
                    // Create a new object reference to ensure React detects the change
                    const updatedCard = { ...updatedEvent };
                    if (oldColumn === targetColumn) {
                      // Same column: update in place
                      newColumns[targetColumn] = [
                        ...newColumns[targetColumn].slice(0, oldIndex),
                        updatedCard,
                        ...newColumns[targetColumn].slice(oldIndex + 1)
                      ];
                    } else {
                      // Different column: remove from old, add to new
                      // Use type assertion to help TypeScript understand oldColumn is not null here
                      const sourceColumn = oldColumn as EventColumnId;
                      const sourceArray = newColumns[sourceColumn];
                      newColumns[sourceColumn] = [
                        ...sourceArray.slice(0, oldIndex),
                        ...sourceArray.slice(oldIndex + 1)
                      ];
                      newColumns[targetColumn] = [...newColumns[targetColumn], updatedCard];
                    }
                  } else {
                    // Not found (shouldn't happen), just add to target column
                    const updatedCard = { ...updatedEvent };
                    newColumns[targetColumn] = [...newColumns[targetColumn], updatedCard];
                  }
                  
                  return newColumns;
                });
              } else {
                const response = await fetch(url, {
                  method: 'POST',
                  headers: getApiHeaders(),
                  body: JSON.stringify(data),
                });
                if (!response.ok) throw new Error('Failed to create event');
                updatedEvent = await response.json() as InPersonEvent;
                
                // Optimistically update the state immediately
                setEventColumns(prev => {
                  const newColumns = { ...prev };
                  const targetColumn = eventStatusToColumn[updatedEvent.status] ?? 'plan';
                  newColumns[targetColumn] = [...newColumns[targetColumn], updatedEvent];
                  return newColumns;
                });
              }
              setIsEventModalOpen(false);
              setEditingEvent(null);
              // No need to refetch - we already have the updated item from the API response
              // The optimistic update is sufficient since we're using the server's response data
            } catch (error) {
              console.error('Error saving event:', error);
              alert('Failed to save event. Please try again.');
              // Refresh data on error to restore correct state
              await fetchEvents();
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeletingEvent !== null && (
        <DeleteModal
          onConfirm={async () => {
            try {
              const url = userIdParam ? `/api/in_person_events?id=${isDeletingEvent}&userId=${userIdParam}` : `/api/in_person_events?id=${isDeletingEvent}`;
              const response = await fetch(url, {
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
  );
}

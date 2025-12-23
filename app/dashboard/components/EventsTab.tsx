'use client';

import { getHeadersWithTimezone } from '@/app/lib/api-helpers';

import { Plus, Trash2 } from 'lucide-react';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { InPersonEvent, EventColumnId, BoardTimeFilter } from './types';
import { eventStatusToColumn } from './types';
import { CardDateMeta, DroppableColumn } from './shared';

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
  InPersonEventModal: React.ComponentType<any>;
  DeleteModal: React.ComponentType<any>;
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
      <CardDateMeta created={props.card.dateCreated} modified={props.card.dateModified} className="mt-3" />
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
  InPersonEventModal,
  DeleteModal,
  isEventModalOpen,
  editingEvent,
  setIsDeletingEvent,
  isDeletingEvent,
  fetchEvents,
  isDraggingEventRef,
  userIdParam,
}: EventsTabProps) {
  return (
    <section className="bg-gray-800 border border-light-steel-blue rounded-lg p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
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
                <DroppableColumn id="attended">
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
                LinkedIn Requests Sent ({filteredEventColumns.linkedinRequestsSent.length})
              </h5>
              <SortableContext items={filteredEventColumns.linkedinRequestsSent.map(event => String(event.id))} strategy={rectSortingStrategy}>
                <DroppableColumn id="linkedinRequestsSent">
                  {filteredEventColumns.linkedinRequestsSent.map(event => (
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
                Followed Up ({filteredEventColumns.followups.length})
              </h5>
              <SortableContext items={filteredEventColumns.followups.map(event => String(event.id))} strategy={rectSortingStrategy}>
                <DroppableColumn id="followups">
                  {filteredEventColumns.followups.map(event => (
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
          onSave={async (data: Partial<InPersonEvent> & { date?: string }) => {
            try {
              const url = userIdParam ? `/api/in_person_events?userId=${userIdParam}` : '/api/in_person_events';
              let updatedEvent: InPersonEvent;
              if (editingEvent) {
                const response = await fetch(url, {
                  method: 'PUT',
                  headers: getHeadersWithTimezone(),
                  body: JSON.stringify({ ...data, id: editingEvent.id }),
                });
                if (!response.ok) throw new Error('Failed to update event');
                updatedEvent = await response.json() as InPersonEvent;
                
                // Optimistically update the state immediately
                setEventColumns(prev => {
                  const newColumns = { ...prev };
                  const targetColumn = eventStatusToColumn[updatedEvent.status] ?? 'upcoming';
                  
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
                      newColumns[oldColumn] = [
                        ...newColumns[oldColumn].slice(0, oldIndex),
                        ...newColumns[oldColumn].slice(oldIndex + 1)
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
                  headers: getHeadersWithTimezone(),
                  body: JSON.stringify(data),
                });
                if (!response.ok) throw new Error('Failed to create event');
                updatedEvent = await response.json() as InPersonEvent;
                
                // Optimistically update the state immediately
                setEventColumns(prev => {
                  const newColumns = { ...prev };
                  const targetColumn = eventStatusToColumn[updatedEvent.status] ?? 'upcoming';
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

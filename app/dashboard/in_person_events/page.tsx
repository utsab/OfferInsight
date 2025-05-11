"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

type Event = {
  id: number;
  event: string;
  date: string;
  location: string | null;
  url: string | null;
  notes: string | null;
  status: string;
  numPeopleSpokenTo: number | null;
  numLinkedInRequests: number | null;
};

type ColumnId = "scheduled" | "attended" | "connectedOnline";

// Draggable event card component
const DraggableEventCard = ({
  event,
  onEdit,
}: {
  event: Event;
  onEdit: (event: Event) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: event.id.toString(),
      data: { event },
    });

  // Track if we have a pending click
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isClicking, setIsClicking] = useState(false);
  const [mouseDownTime, setMouseDownTime] = useState<number | null>(null);

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1,
        cursor: isDragging ? "grabbing" : "pointer",
      }
    : {
        cursor: "pointer",
      };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Clear any existing timeouts
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }

    // Set clicking state to true
    setIsClicking(true);
    setMouseDownTime(Date.now());

    // Start a timer to initiate drag if the mouse is held down
    longPressTimeoutRef.current = setTimeout(() => {
      // This will initiate the drag after the delay
      if (listeners && listeners.onMouseDown) {
        const syntheticEvent = new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          clientX: e.clientX,
          clientY: e.clientY,
        });

        // Now we're ready to start dragging
        e.target.dispatchEvent(syntheticEvent);
      }
    }, 100); // 100ms delay for faster drag initiation
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // Clear the long press timer
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    const mouseUpTime = Date.now();
    const mouseDownDuration = mouseDownTime ? mouseUpTime - mouseDownTime : 0;

    // If press was short (less than 100ms), consider it a click
    if (isClicking && mouseDownDuration < 100 && !isDragging) {
      clickTimeoutRef.current = setTimeout(() => {
        onEdit(event);
      }, 50);
    }

    // Reset clicking state
    setIsClicking(false);
    setMouseDownTime(null);
  };

  // Touch handling for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    // Track touch start time
    setMouseDownTime(Date.now());
    setIsClicking(true);

    // Set a timeout to distinguish between tap and drag
    longPressTimeoutRef.current = setTimeout(() => {
      // Add visual feedback for long press
      const target = e.currentTarget as HTMLElement;
      target.classList.add("touch-dragging");

      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 100);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Clear the long press timer
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    const touchEndTime = Date.now();
    const touchDuration = mouseDownTime ? touchEndTime - mouseDownTime : 0;

    // If it was a short tap (not a drag), open the edit modal
    if (isClicking && touchDuration < 100 && !isDragging) {
      e.currentTarget.classList.remove("touch-dragging");
      onEdit(event);
    }

    // Reset state
    setIsClicking(false);
    setMouseDownTime(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // If finger moves significantly, cancel the click and let dnd-kit handle the drag
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      className="bg-white p-3 mb-2 rounded shadow hover:shadow-md transition-shadow relative group"
    >
      {/* Drag handle icon that appears on hover */}
      <div className="absolute -left-1 top-0 bottom-0 w-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <GripVertical size={16} className="text-gray-400 drag-handle" />
      </div>

      <h3 className="font-medium text-gray-800">{event.event}</h3>
      <p className="text-sm text-gray-600">Date: {event.date}</p>
      {event.location && (
        <p className="text-sm text-gray-600">Location: {event.location}</p>
      )}
      {event.url && (
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-500 hover:underline"
          onClick={(e) => e.stopPropagation()} // Prevent edit modal when clicking link
        >
          Event Link
        </a>
      )}
      {event.notes && (
        <div className="mt-2 text-sm text-gray-600">
          <p className="font-medium">Notes:</p>
          <p>{event.notes}</p>
        </div>
      )}
    </div>
  );
};

// Regular event card for drag overlay
const EventCard = ({ event }: { event: Event }) => (
  <div className="bg-white p-3 mb-2 rounded shadow">
    <h3 className="font-medium text-gray-800">{event.event}</h3>
    <p className="text-sm text-gray-600">Date: {event.date}</p>
    {event.location && (
      <p className="text-sm text-gray-600">Location: {event.location}</p>
    )}
    {event.url && (
      <a
        href={event.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-500 hover:underline"
      >
        Event Link
      </a>
    )}
    {event.notes && (
      <div className="mt-2 text-sm text-gray-600">
        <p className="font-medium">Notes:</p>
        <p>{event.notes}</p>
      </div>
    )}
  </div>
);

// Column component with droppable area
const Column = ({
  id,
  title,
  events,
  color,
  onEditEvent,
}: {
  id: ColumnId;
  title: string;
  events: Event[];
  color: string;
  onEditEvent: (event: Event) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  // Add a background highlight when dragging over this column
  const dropStyle = isOver
    ? {
        backgroundColor: "rgba(0, 0, 0, 0.05)",
        boxShadow: "inset 0 0 5px rgba(0, 0, 0, 0.2)",
      }
    : undefined;

  return (
    <div className="flex-shrink-0 w-80 bg-gray-100 rounded-lg shadow-md">
      <div className={`p-3 ${color} text-white rounded-t-lg`}>
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div
        ref={setNodeRef}
        className="p-2 min-h-[500px] transition-colors duration-200"
        style={dropStyle}
      >
        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No {title.toLowerCase()} events
          </p>
        ) : (
          events.map((event) => (
            <DraggableEventCard
              key={event.id}
              event={event}
              onEdit={onEditEvent}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default function InPersonEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [activeDroppableId, setActiveDroppableId] = useState<ColumnId | null>(
    null
  );
  const [newEvent, setNewEvent] = useState({
    event: "",
    date: "",
    location: "",
    url: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  // Setup sensors for drag and drop with appropriate activation constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Set a shorter delay to distinguish between click and drag
      activationConstraint: {
        delay: 100, // Wait 100ms before activating drag
        tolerance: 5, // Allow 5px of movement during that delay
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: () => ({ x: 0, y: 0 }),
    })
  );

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/in_person_events");
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/in_person_events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEvent),
      });

      if (response.ok) {
        const createdEvent = await response.json();
        setEvents([createdEvent, ...events]);
        setNewEvent({
          event: "",
          date: "",
          location: "",
          url: "",
          notes: "",
        });
        setIsModalOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    try {
      const response = await fetch("/api/in_person_events", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingEvent),
      });

      if (response.ok) {
        // Update local state
        setEvents(
          events.map((event) =>
            event.id === editingEvent.id ? editingEvent : event
          )
        );
        setIsEditModalOpen(false);
        setEditingEvent(null);
      }
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const response = await fetch("/api/in_person_events", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status }),
      });

      if (response.ok) {
        // Update local state without fetching again
        setEvents(
          events.map((event) =>
            event.id === id ? { ...event, status } : event
          )
        );
      } else {
        console.error("Failed to update event status");
        await fetchEvents();
      }
    } catch (error) {
      console.error("Error updating event status:", error);
      await fetchEvents();
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewEvent((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!editingEvent) return;

    const { name, value } = e.target;
    setEditingEvent((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleEditEvent = (event: Event) => {
    // Only open edit modal if we're not currently dragging something
    if (!activeId) {
      setEditingEvent(event);
      setIsEditModalOpen(true);
    }
  };

  const handleDeleteEvent = async () => {
    if (!editingEvent) return;

    try {
      const response = await fetch(
        `/api/in_person_events?id=${editingEvent.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Remove from local state
        setEvents(events.filter((event) => event.id !== editingEvent.id));
        setIsEditModalOpen(false);
        setEditingEvent(null);
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    const draggedEvent = events.find(
      (item) => item.id.toString() === active.id
    );
    if (draggedEvent) {
      setActiveEvent(draggedEvent);

      // Set cursor to grabbing during drag
      document.body.style.cursor = "grabbing";
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      // Track which droppable container we're over
      setActiveDroppableId(over.id as ColumnId);
    } else {
      setActiveDroppableId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    // Reset cursor
    document.body.style.cursor = "";

    if (!over || !active) {
      setActiveId(null);
      setActiveEvent(null);
      setActiveDroppableId(null);
      return;
    }

    const eventId = parseInt(active.id as string);
    const columnId = over.id as ColumnId;

    // Only process if we're dropping onto a column and have a valid ID
    if (
      columnId &&
      ["scheduled", "attended", "connectedOnline"].includes(columnId) &&
      eventId
    ) {
      // Update to use the single status field
      const newStatus = columnId;

      // Update local state immediately to prevent UI flicker
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === eventId ? { ...event, status: newStatus } : event
        )
      );

      // Then update the server state
      try {
        await fetch("/api/in_person_events", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: eventId, status: newStatus }),
        });
      } catch (error) {
        console.error("Error updating event status:", error);
        // Revert local state in case of error
        fetchEvents();
      }
    }

    setActiveId(null);
    setActiveEvent(null);
    setActiveDroppableId(null);
  };

  // Filter events for each column
  const scheduledEvents = events.filter(
    (event) => event.status === "scheduled"
  );
  const attendedEvents = events.filter((event) => event.status === "attended");
  const connectedEvents = events.filter(
    (event) => event.status === "connectedOnline"
  );

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4 items-center">
        <h1 className="text-2xl font-bold">In-Person Events</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center hover:bg-blue-600 transition-colors"
        >
          <span className="mr-1 text-xl">+</span> New Event
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading events...</div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {/* Scheduled Column */}
            <Column
              id="scheduled"
              title="Scheduled"
              events={scheduledEvents}
              color="bg-blue-500"
              onEditEvent={handleEditEvent}
            />

            {/* Attended Column */}
            <Column
              id="attended"
              title="Attended"
              events={attendedEvents}
              color="bg-green-500"
              onEditEvent={handleEditEvent}
            />

            {/* Connected Online Column */}
            <Column
              id="connectedOnline"
              title="Connected Online"
              events={connectedEvents}
              color="bg-purple-500"
              onEditEvent={handleEditEvent}
            />
          </div>

          {/* Drag Overlay with animation */}
          <DragOverlay
            dropAnimation={{
              duration: 250,
              easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
            }}
          >
            {activeId && activeEvent ? (
              <div className="opacity-80 transform scale-105 shadow-lg">
                <EventCard event={activeEvent} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Modal for creating new events */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create New Event</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateEvent}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Event Name *</label>
                <input
                  type="text"
                  name="event"
                  value={newEvent.event}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  name="date"
                  value={newEvent.date}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={newEvent.location}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  name="url"
                  value={newEvent.url}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="https://..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={newEvent.notes}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for editing events */}
      {isEditModalOpen && editingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Event</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateEvent}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Event Name *</label>
                <input
                  type="text"
                  name="event"
                  value={editingEvent.event}
                  onChange={handleEditInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  name="date"
                  value={editingEvent.date}
                  onChange={handleEditInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={editingEvent.location || ""}
                  onChange={handleEditInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  name="url"
                  value={editingEvent.url || ""}
                  onChange={handleEditInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="https://..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={editingEvent.notes || ""}
                  onChange={handleEditInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={3}
                />
              </div>

              <div className="flex justify-between gap-2">
                <button
                  type="button"
                  onClick={handleDeleteEvent}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add styles for touch interactions */}
      <style jsx global>{`
        /* Touch indicator */
        .touch-dragging {
          transform: scale(1.02);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.5);
          opacity: 0.9;
        }

        /* Touch indicator ripple effect */
        @keyframes ripple {
          to {
            transform: scale(8);
            opacity: 0;
          }
        }

        /* Better visual feedback during active drag */
        [data-dragging="true"] {
          cursor: grabbing !important;
        }

        /* Drag handle styling */
        .drag-handle {
          cursor: grab;
        }
      `}</style>
    </div>
  );
}

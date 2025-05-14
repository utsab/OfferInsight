"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DragStartEvent } from "@dnd-kit/core";
import { DragAndDropBoard, DraggableItem } from "@/components/DragAndDrop";
import { getBoardColumns } from "@/components/BoardColumns";
import CardCreationModal from "@/components/CardCreationModal";
import CardContent from "@/components/CardContent";
import CardEditModal from "@/components/CardEditModal";
import ConfirmationModal from "@/components/ConfirmationModal";

type Event = {
  id: number;
  event: string;
  date: Date | string;
  location: string | null;
  url: string | null;
  notes: string | null;
  status: string;
  numPeopleSpokenTo: number | null;
  numLinkedInRequests: number | null;
};

export default function InPersonEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    event: "",
    date: "",
    location: "",
    url: "",
    notes: "",
    status: "scheduled",
    numPeopleSpokenTo: null,
    numLinkedInRequests: null,
  });
  const [editEvent, setEditEvent] = useState<Event | null>(null);

  // Define columns configuration
  const columns = getBoardColumns("inPersonEvents");

  // Define fields for the create/edit modal
  const eventFields = [
    {
      name: "event",
      label: "Event Name",
      type: "text" as const,
      required: true,
    },
    { name: "date", label: "Date", type: "date" as const, required: true },
    { name: "location", label: "Location", type: "text" as const },
    { name: "url", label: "URL", type: "url" as const },
    {
      name: "numPeopleSpokenTo",
      label: "Number of People Spoken To",
      type: "number" as const,
    },
    {
      name: "numLinkedInRequests",
      label: "Number of LinkedIn Requests",
      type: "number" as const,
    },
    { name: "notes", label: "Notes", type: "textarea" as const, rows: 3 },
  ];

  // Define fields for the card content
  const contentFields = [
    {
      key: "date",
      label: "Date",
      type: "text" as const,
      formatter: (date: Date | string) => {
        if (date instanceof Date) {
          return date.toLocaleDateString();
        }
        return typeof date === "string"
          ? new Date(date).toLocaleDateString()
          : "";
      },
    },
    { key: "location", label: "Location", type: "text" as const },
    {
      key: "url",
      label: "Event Link",
      type: "url" as const,
      linkText: "Event Link",
    },
    {
      key: "numPeopleSpokenTo",
      label: "People Spoken To",
      type: "text" as const,
    },
    {
      key: "numLinkedInRequests",
      label: "LinkedIn Requests",
      type: "text" as const,
    },
    { key: "notes", label: "Notes", type: "notes" as const },
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/in_person_events");
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
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

      if (!response.ok) {
        throw new Error("Failed to create event");
      }

      setShowCreateModal(false);
      setNewEvent({
        event: "",
        date: "",
        location: "",
        url: "",
        notes: "",
        status: "scheduled",
        numPeopleSpokenTo: null,
        numLinkedInRequests: null,
      });
      fetchEvents();
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editEvent) return;

    try {
      const response = await fetch(`/api/in_person_events?id=${editEvent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editEvent),
      });

      if (!response.ok) {
        throw new Error("Failed to update event");
      }

      setShowEditModal(false);
      setEditEvent(null);
      fetchEvents();
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const event = events.find((event) => event.id === id);
      if (!event) return;

      const updatedEvent = { ...event, status };

      // Note: The UI is already updated by the DragAndDropBoard component
      // We just need to make the API call here

      const response = await fetch(`/api/in_person_events?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedEvent),
      });

      if (!response.ok) {
        throw new Error("Failed to update event status");
      }

      // If successful, update our app state to match
      // The UI is already updated, but we need to keep our state in sync
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === id ? { ...event, status } : event
        )
      );
    } catch (error) {
      console.error("Error updating event status:", error);
      // No need to revert the UI as the DragAndDropBoard will handle that
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
    const { name, value } = e.target;
    if (editEvent) {
      setEditEvent({ ...editEvent, [name]: value });
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditEvent(event);
    setShowEditModal(true);
  };

  const handleDeleteEvent = async () => {
    if (!editEvent) return;

    try {
      const response = await fetch(`/api/in_person_events?id=${editEvent.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      setShowDeleteModal(false);
      setShowEditModal(false);
      setEditEvent(null);
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id.toString());

    // Find the active event
    const foundEvent = events.find(
      (e) => e.id.toString() === active.id.toString()
    );
    if (foundEvent) {
      setActiveEvent(foundEvent);
    }
  };

  // Render content for event cards using our new CardContent component
  const renderEventContent = (item: DraggableItem) => {
    const event = item as unknown as Event;
    return <CardContent title="event" item={event} fields={contentFields} />;
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">In-Person Events</h1>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          onClick={() => setShowCreateModal(true)}
        >
          Add Event
        </button>
      </div>

      <DragAndDropBoard
        items={events}
        columns={columns}
        activeItem={activeEvent}
        onUpdateStatus={handleUpdateStatus}
        onEditItem={handleEditEvent}
        renderContent={renderEventContent}
        renderOverlay={renderEventContent}
        onDragStart={handleDragStart}
      />

      {/* Use our reusable components for modals */}
      {showCreateModal && (
        <CardCreationModal
          title="Add New Event"
          onSubmit={handleCreateEvent}
          onClose={() => setShowCreateModal(false)}
          fields={eventFields}
          values={newEvent}
          onChange={handleInputChange}
        />
      )}

      {showEditModal && editEvent && (
        <CardEditModal
          title="Edit Event"
          onSubmit={handleUpdateEvent}
          onClose={() => setShowEditModal(false)}
          onDelete={() => setShowDeleteModal(true)}
          fields={eventFields}
          values={editEvent}
          onChange={handleEditInputChange}
        />
      )}

      {showDeleteModal && (
        <ConfirmationModal
          title="Delete Event"
          message="Are you sure you want to delete this event? This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDeleteEvent}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}

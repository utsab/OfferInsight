"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import {
  DragAndDropBoard,
  ColumnConfig,
  DraggableItem,
} from "@/components/DragAndDrop";

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
  const columns: ColumnConfig[] = [
    {
      id: "scheduled",
      title: "Scheduled",
      color: "bg-blue-500",
    },
    {
      id: "attended",
      title: "Attended",
      color: "bg-green-500",
    },
    {
      id: "connectedOnline",
      title: "Connected Online",
      color: "bg-purple-500",
    },
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

      // Update the local state
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === id ? { ...event, status } : event
        )
      );
    } catch (error) {
      console.error("Error updating event status:", error);
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

  // Render content for event cards
  const renderEventContent = (event: Event) => (
    <>
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
    </>
  );

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

      {/* Drag and Drop Board */}
      <DragAndDropBoard<Event>
        items={events}
        columns={columns}
        activeItem={activeEvent}
        onUpdateStatus={handleUpdateStatus}
        onEditItem={handleEditEvent}
        renderContent={renderEventContent}
        renderOverlay={(event) => renderEventContent(event)}
        onDragStart={handleDragStart}
      />

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Event</h2>
            <form onSubmit={handleCreateEvent}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Event Name</label>
                <input
                  type="text"
                  name="event"
                  value={newEvent.event}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  name="date"
                  value={newEvent.date}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={newEvent.location || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">URL</label>
                <input
                  type="url"
                  name="url"
                  value={newEvent.url || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={newEvent.notes || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditModal && editEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Event</h2>
            <form onSubmit={handleUpdateEvent}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Event Name</label>
                <input
                  type="text"
                  name="event"
                  value={editEvent.event}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  name="date"
                  value={editEvent.date}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={editEvent.location || ""}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">URL</label>
                <input
                  type="url"
                  name="url"
                  value={editEvent.url || ""}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={editEvent.notes || ""}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
              {editEvent.status === "attended" && (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">
                      Number of People Spoken To
                    </label>
                    <input
                      type="number"
                      name="numPeopleSpokenTo"
                      value={editEvent.numPeopleSpokenTo || ""}
                      onChange={handleEditInputChange}
                      className="w-full p-2 border rounded"
                      min="0"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">
                      Number of LinkedIn Requests
                    </label>
                    <input
                      type="number"
                      name="numLinkedInRequests"
                      value={editEvent.numLinkedInRequests || ""}
                      onChange={handleEditInputChange}
                      className="w-full p-2 border rounded"
                      min="0"
                    />
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Update
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p>
              Are you sure you want to delete this event? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEvent}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

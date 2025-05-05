"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Event = {
  id: number;
  event: string;
  date: string;
  location: string | null;
  url: string | null;
  notes: string | null;
  scheduled: boolean;
  attended: boolean;
  connectedOnline: boolean;
};

export default function InPersonEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    event: "",
    date: "",
    location: "",
    url: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(true);

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

  const handleUpdateStatus = async (
    id: number,
    status: {
      scheduled?: boolean;
      attended?: boolean;
      connectedOnline?: boolean;
    }
  ) => {
    try {
      const response = await fetch("/api/in_person_events", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...status }),
      });

      if (response.ok) {
        fetchEvents();
      }
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

  // Filter events for each column
  const scheduledEvents = events.filter(
    (event) => event.scheduled && !event.attended && !event.connectedOnline
  );
  const attendedEvents = events.filter(
    (event) => event.attended && !event.connectedOnline
  );
  const connectedEvents = events.filter((event) => event.connectedOnline);

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

      <div className="mt-3 flex gap-2">
        {!event.attended && (
          <button
            onClick={() =>
              handleUpdateStatus(event.id, { attended: true, scheduled: false })
            }
            className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
          >
            Mark Attended
          </button>
        )}
        {event.attended && !event.connectedOnline && (
          <button
            onClick={() =>
              handleUpdateStatus(event.id, { connectedOnline: true })
            }
            className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
          >
            Mark Connected
          </button>
        )}
      </div>
    </div>
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
        <div className="flex gap-4 overflow-x-auto pb-4">
          {/* Scheduled Column */}
          <div className="flex-shrink-0 w-80 bg-gray-100 rounded-lg shadow-md">
            <div className="p-3 bg-blue-500 text-white rounded-t-lg">
              <h2 className="font-semibold">Scheduled</h2>
            </div>
            <div className="p-2 min-h-[500px]">
              {scheduledEvents.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No scheduled events
                </p>
              ) : (
                scheduledEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
              )}
            </div>
          </div>

          {/* Attended Column */}
          <div className="flex-shrink-0 w-80 bg-gray-100 rounded-lg shadow-md">
            <div className="p-3 bg-green-500 text-white rounded-t-lg">
              <h2 className="font-semibold">Attended</h2>
            </div>
            <div className="p-2 min-h-[500px]">
              {attendedEvents.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No attended events
                </p>
              ) : (
                attendedEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
              )}
            </div>
          </div>

          {/* Connected Online Column */}
          <div className="flex-shrink-0 w-80 bg-gray-100 rounded-lg shadow-md">
            <div className="p-3 bg-purple-500 text-white rounded-t-lg">
              <h2 className="font-semibold">Connected Online</h2>
            </div>
            <div className="p-2 min-h-[500px]">
              {connectedEvents.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No connected events
                </p>
              ) : (
                connectedEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
              )}
            </div>
          </div>
        </div>
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
    </div>
  );
}

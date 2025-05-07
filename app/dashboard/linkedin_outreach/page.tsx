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

type Outreach = {
  id: number;
  name: string;
  company: string;
  message: string | null;
  linkedInUrl: string | null;
  notes: string | null;
  responded: boolean;
  scheduled: boolean;
  referral: boolean;
};

type ColumnId = "responded" | "scheduled" | "referral";

// Draggable outreach card component
const DraggableOutreachCard = ({
  outreach,
  onEdit,
}: {
  outreach: Outreach;
  onEdit: (outreach: Outreach) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: outreach.id.toString(),
      data: { outreach },
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
        onEdit(outreach);
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
      onEdit(outreach);
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

      <h3 className="font-medium text-gray-800">{outreach.name}</h3>
      <p className="text-sm text-gray-600">Company: {outreach.company}</p>
      {outreach.linkedInUrl && (
        <a
          href={outreach.linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-500 hover:underline"
          onClick={(e) => e.stopPropagation()} // Prevent edit modal when clicking link
        >
          LinkedIn Profile
        </a>
      )}
      {outreach.message && (
        <div className="mt-2 text-sm text-gray-600">
          <p className="font-medium">Message:</p>
          <p>{outreach.message}</p>
        </div>
      )}
      {outreach.notes && (
        <div className="mt-2 text-sm text-gray-600">
          <p className="font-medium">Notes:</p>
          <p>{outreach.notes}</p>
        </div>
      )}
    </div>
  );
};

// Regular outreach card for drag overlay
const OutreachCard = ({ outreach }: { outreach: Outreach }) => (
  <div className="bg-white p-3 mb-2 rounded shadow">
    <h3 className="font-medium text-gray-800">{outreach.name}</h3>
    <p className="text-sm text-gray-600">Company: {outreach.company}</p>
    {outreach.linkedInUrl && (
      <a
        href={outreach.linkedInUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-500 hover:underline"
      >
        LinkedIn Profile
      </a>
    )}
    {outreach.message && (
      <div className="mt-2 text-sm text-gray-600">
        <p className="font-medium">Message:</p>
        <p>{outreach.message}</p>
      </div>
    )}
    {outreach.notes && (
      <div className="mt-2 text-sm text-gray-600">
        <p className="font-medium">Notes:</p>
        <p>{outreach.notes}</p>
      </div>
    )}
  </div>
);

// Column component with droppable area
const Column = ({
  id,
  title,
  outreaches,
  color,
  onEditOutreach,
}: {
  id: ColumnId;
  title: string;
  outreaches: Outreach[];
  color: string;
  onEditOutreach: (outreach: Outreach) => void;
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
        {outreaches.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No {title.toLowerCase()} contacts
          </p>
        ) : (
          outreaches.map((outreach) => (
            <DraggableOutreachCard
              key={outreach.id}
              outreach={outreach}
              onEdit={onEditOutreach}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default function LinkedInOutreachPage() {
  const router = useRouter();
  const [outreaches, setOutreaches] = useState<Outreach[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeOutreach, setActiveOutreach] = useState<Outreach | null>(null);
  const [editingOutreach, setEditingOutreach] = useState<Outreach | null>(null);
  const [activeDroppableId, setActiveDroppableId] = useState<ColumnId | null>(
    null
  );
  const [newOutreach, setNewOutreach] = useState({
    name: "",
    company: "",
    message: "",
    linkedInUrl: "",
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
    fetchOutreaches();
  }, []);

  const fetchOutreaches = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/linkedin_outreach");
      if (response.ok) {
        const data = await response.json();
        setOutreaches(data);
      }
    } catch (error) {
      console.error("Error fetching outreaches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOutreach = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/linkedin_outreach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newOutreach),
      });

      if (response.ok) {
        const createdOutreach = await response.json();
        setOutreaches([createdOutreach, ...outreaches]);
        setNewOutreach({
          name: "",
          company: "",
          message: "",
          linkedInUrl: "",
          notes: "",
        });
        setIsModalOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Error creating outreach:", error);
    }
  };

  const handleUpdateOutreach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOutreach) return;

    try {
      const response = await fetch("/api/linkedin_outreach", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingOutreach),
      });

      if (response.ok) {
        // Update local state
        setOutreaches(
          outreaches.map((outreach) =>
            outreach.id === editingOutreach.id ? editingOutreach : outreach
          )
        );
        setIsEditModalOpen(false);
        setEditingOutreach(null);
      }
    } catch (error) {
      console.error("Error updating outreach:", error);
    }
  };

  const handleUpdateStatus = async (
    id: number,
    status: { responded: boolean; scheduled: boolean; referral: boolean }
  ) => {
    try {
      const response = await fetch("/api/linkedin_outreach", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...status }),
      });

      if (response.ok) {
        // Update local state without fetching again
        setOutreaches(
          outreaches.map((outreach) =>
            outreach.id === id ? { ...outreach, ...status } : outreach
          )
        );
      }
    } catch (error) {
      console.error("Error updating outreach status:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewOutreach((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!editingOutreach) return;

    const { name, value } = e.target;
    setEditingOutreach((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleEditOutreach = (outreach: Outreach) => {
    // Only open edit modal if we're not currently dragging something
    if (!activeId) {
      setEditingOutreach(outreach);
      setIsEditModalOpen(true);
    }
  };

  const handleDeleteOutreach = async () => {
    if (!editingOutreach) return;

    try {
      const response = await fetch(
        `/api/linkedin_outreach?id=${editingOutreach.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Remove from local state
        setOutreaches(
          outreaches.filter((outreach) => outreach.id !== editingOutreach.id)
        );
        setIsEditModalOpen(false);
        setEditingOutreach(null);
      }
    } catch (error) {
      console.error("Error deleting outreach:", error);
    }
  };

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    const draggedOutreach = outreaches.find(
      (item) => item.id.toString() === active.id
    );
    if (draggedOutreach) {
      setActiveOutreach(draggedOutreach);

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
      setActiveOutreach(null);
      setActiveDroppableId(null);
      return;
    }

    const outreachId = parseInt(active.id as string);
    const columnId = over.id as ColumnId;

    // Only process if we're dropping onto a column and have a valid ID
    if (
      columnId &&
      ["responded", "scheduled", "referral"].includes(columnId) &&
      outreachId
    ) {
      // Get column-specific statuses
      let newStatus: {
        responded: boolean;
        scheduled: boolean;
        referral: boolean;
      };

      if (columnId === "responded") {
        newStatus = {
          responded: true,
          scheduled: false,
          referral: false,
        };
      } else if (columnId === "scheduled") {
        newStatus = {
          responded: false,
          scheduled: true,
          referral: false,
        };
      } else {
        // referral
        newStatus = {
          responded: false,
          scheduled: false,
          referral: true,
        };
      }

      // Update the outreach status
      await handleUpdateStatus(outreachId, newStatus);
    }

    setActiveId(null);
    setActiveOutreach(null);
    setActiveDroppableId(null);
  };

  // Filter outreaches for each column
  const respondedOutreaches = outreaches.filter(
    (outreach) =>
      outreach.responded && !outreach.scheduled && !outreach.referral
  );
  const scheduledOutreaches = outreaches.filter(
    (outreach) => outreach.scheduled && !outreach.referral
  );
  const referralOutreaches = outreaches.filter((outreach) => outreach.referral);

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4 items-center">
        <h1 className="text-2xl font-bold">LinkedIn Outreach</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center hover:bg-blue-600 transition-colors"
        >
          <span className="mr-1 text-xl">+</span> New Contact
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading contacts...</div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {/* Responded Column */}
            <Column
              id="responded"
              title="Responded"
              outreaches={respondedOutreaches}
              color="bg-blue-500"
              onEditOutreach={handleEditOutreach}
            />

            {/* Scheduled Column */}
            <Column
              id="scheduled"
              title="Scheduled"
              outreaches={scheduledOutreaches}
              color="bg-green-500"
              onEditOutreach={handleEditOutreach}
            />

            {/* Referral Column */}
            <Column
              id="referral"
              title="Referral"
              outreaches={referralOutreaches}
              color="bg-purple-500"
              onEditOutreach={handleEditOutreach}
            />
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeId && activeOutreach ? (
              <div className="opacity-80 transform scale-105 shadow-lg">
                <OutreachCard outreach={activeOutreach} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Modal for creating new contacts */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create New Contact</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateOutreach}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={newOutreach.name}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Company *</label>
                <input
                  type="text"
                  name="company"
                  value={newOutreach.company}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-1">LinkedIn URL</label>
                <input
                  type="url"
                  name="linkedInUrl"
                  value={newOutreach.linkedInUrl}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Message</label>
                <textarea
                  name="message"
                  value={newOutreach.message}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={3}
                  placeholder="Enter your outreach message here..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={newOutreach.notes}
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
                  Create Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for editing contacts */}
      {isEditModalOpen && editingOutreach && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Contact</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateOutreach}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={editingOutreach.name}
                  onChange={handleEditInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Company *</label>
                <input
                  type="text"
                  name="company"
                  value={editingOutreach.company}
                  onChange={handleEditInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-1">LinkedIn URL</label>
                <input
                  type="url"
                  name="linkedInUrl"
                  value={editingOutreach.linkedInUrl || ""}
                  onChange={handleEditInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Message</label>
                <textarea
                  name="message"
                  value={editingOutreach.message || ""}
                  onChange={handleEditInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={3}
                  placeholder="Enter your outreach message here..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={editingOutreach.notes || ""}
                  onChange={handleEditInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={3}
                />
              </div>

              <div className="flex justify-between gap-2">
                <button
                  type="button"
                  onClick={handleDeleteOutreach}
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

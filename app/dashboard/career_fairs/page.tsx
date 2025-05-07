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

type CareerFair = {
  id: number;
  event: string;
  date: string;
  location: string | null;
  url: string | null;
  notes: string | null;
  scheduled: boolean;
  attended: boolean;
};

type ColumnId = "scheduled" | "attended";

// Draggable event card component
const DraggableCareerFairCard = ({
  careerFair,
  onEdit,
}: {
  careerFair: CareerFair;
  onEdit: (careerFair: CareerFair) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: careerFair.id.toString(),
      data: { careerFair },
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
        onEdit(careerFair);
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
      onEdit(careerFair);
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

      <h3 className="font-medium text-gray-800">{careerFair.event}</h3>
      <p className="text-sm text-gray-600">Date: {careerFair.date}</p>
      {careerFair.location && (
        <p className="text-sm text-gray-600">Location: {careerFair.location}</p>
      )}
      {careerFair.url && (
        <a
          href={careerFair.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-500 hover:underline"
          onClick={(e) => e.stopPropagation()} // Prevent edit modal when clicking link
        >
          Event Link
        </a>
      )}
      {careerFair.notes && (
        <div className="mt-2 text-sm text-gray-600">
          <p className="font-medium">Notes:</p>
          <p>{careerFair.notes}</p>
        </div>
      )}
    </div>
  );
};

// Regular event card for drag overlay
const CareerFairCard = ({ careerFair }: { careerFair: CareerFair }) => (
  <div className="bg-white p-3 mb-2 rounded shadow">
    <h3 className="font-medium text-gray-800">{careerFair.event}</h3>
    <p className="text-sm text-gray-600">Date: {careerFair.date}</p>
    {careerFair.location && (
      <p className="text-sm text-gray-600">Location: {careerFair.location}</p>
    )}
    {careerFair.url && (
      <a
        href={careerFair.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-500 hover:underline"
      >
        Event Link
      </a>
    )}
    {careerFair.notes && (
      <div className="mt-2 text-sm text-gray-600">
        <p className="font-medium">Notes:</p>
        <p>{careerFair.notes}</p>
      </div>
    )}
  </div>
);

// Column component with droppable area
const Column = ({
  id,
  title,
  careerFairs,
  color,
  onEditCareerFair,
}: {
  id: ColumnId;
  title: string;
  careerFairs: CareerFair[];
  color: string;
  onEditCareerFair: (careerFair: CareerFair) => void;
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
        {careerFairs.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No {title.toLowerCase()} career fairs
          </p>
        ) : (
          careerFairs.map((careerFair) => (
            <DraggableCareerFairCard
              key={careerFair.id}
              careerFair={careerFair}
              onEdit={onEditCareerFair}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default function CareerFairsPage() {
  const router = useRouter();
  const [careerFairs, setCareerFairs] = useState<CareerFair[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeCareerFair, setActiveCareerFair] = useState<CareerFair | null>(
    null
  );
  const [editingCareerFair, setEditingCareerFair] = useState<CareerFair | null>(
    null
  );
  const [activeDroppableId, setActiveDroppableId] = useState<ColumnId | null>(
    null
  );
  const [newCareerFair, setNewCareerFair] = useState({
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
    fetchCareerFairs();
  }, []);

  const fetchCareerFairs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/career_fairs");
      if (response.ok) {
        const data = await response.json();
        setCareerFairs(data);
      }
    } catch (error) {
      console.error("Error fetching career fairs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCareerFair = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/career_fairs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCareerFair),
      });

      if (response.ok) {
        const createdCareerFair = await response.json();
        setCareerFairs([createdCareerFair, ...careerFairs]);
        setNewCareerFair({
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
      console.error("Error creating career fair:", error);
    }
  };

  const handleUpdateCareerFair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCareerFair) return;

    try {
      const response = await fetch("/api/career_fairs", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingCareerFair),
      });

      if (response.ok) {
        // Update local state
        setCareerFairs(
          careerFairs.map((careerFair) =>
            careerFair.id === editingCareerFair.id
              ? editingCareerFair
              : careerFair
          )
        );
        setIsEditModalOpen(false);
        setEditingCareerFair(null);
      }
    } catch (error) {
      console.error("Error updating career fair:", error);
    }
  };

  const handleUpdateStatus = async (
    id: number,
    status: { scheduled: boolean; attended: boolean }
  ) => {
    try {
      const response = await fetch("/api/career_fairs", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...status }),
      });

      if (response.ok) {
        // Update local state without fetching again
        setCareerFairs(
          careerFairs.map((careerFair) =>
            careerFair.id === id ? { ...careerFair, ...status } : careerFair
          )
        );
      }
    } catch (error) {
      console.error("Error updating career fair status:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewCareerFair((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!editingCareerFair) return;

    const { name, value } = e.target;
    setEditingCareerFair((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleEditCareerFair = (careerFair: CareerFair) => {
    // Only open edit modal if we're not currently dragging something
    if (!activeId) {
      setEditingCareerFair(careerFair);
      setIsEditModalOpen(true);
    }
  };

  const handleDeleteCareerFair = async () => {
    if (!editingCareerFair) return;

    try {
      const response = await fetch(
        `/api/career_fairs?id=${editingCareerFair.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Remove from local state
        setCareerFairs(
          careerFairs.filter(
            (careerFair) => careerFair.id !== editingCareerFair.id
          )
        );
        setIsEditModalOpen(false);
        setEditingCareerFair(null);
      }
    } catch (error) {
      console.error("Error deleting career fair:", error);
    }
  };

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    const draggedCareerFair = careerFairs.find(
      (item) => item.id.toString() === active.id
    );
    if (draggedCareerFair) {
      setActiveCareerFair(draggedCareerFair);

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
      setActiveCareerFair(null);
      setActiveDroppableId(null);
      return;
    }

    const careerFairId = parseInt(active.id as string);
    const columnId = over.id as ColumnId;

    // Only process if we're dropping onto a column and have a valid ID
    if (
      columnId &&
      ["scheduled", "attended"].includes(columnId) &&
      careerFairId
    ) {
      // Get column-specific statuses
      let newStatus: {
        scheduled: boolean;
        attended: boolean;
      };

      if (columnId === "scheduled") {
        newStatus = {
          scheduled: true,
          attended: false,
        };
      } else {
        // attended
        newStatus = {
          scheduled: false,
          attended: true,
        };
      }

      // Update local state immediately to prevent UI flicker
      setCareerFairs((prevCareerFairs) =>
        prevCareerFairs.map((careerFair) =>
          careerFair.id === careerFairId
            ? { ...careerFair, ...newStatus }
            : careerFair
        )
      );

      // Then update the server state
      try {
        await fetch("/api/career_fairs", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: careerFairId, ...newStatus }),
        });
      } catch (error) {
        console.error("Error updating career fair status:", error);
        // Revert local state in case of error
        fetchCareerFairs();
      }
    }

    setActiveId(null);
    setActiveCareerFair(null);
    setActiveDroppableId(null);
  };

  // Filter career fairs for each column
  const scheduledCareerFairs = careerFairs.filter(
    (careerFair) => careerFair.scheduled && !careerFair.attended
  );
  const attendedCareerFairs = careerFairs.filter(
    (careerFair) => careerFair.attended
  );

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4 items-center">
        <h1 className="text-2xl font-bold">Career Fairs</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center hover:bg-blue-600 transition-colors"
        >
          <span className="mr-1 text-xl">+</span> New Career Fair
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading career fairs...</div>
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
              careerFairs={scheduledCareerFairs}
              color="bg-blue-500"
              onEditCareerFair={handleEditCareerFair}
            />

            {/* Attended Column */}
            <Column
              id="attended"
              title="Attended"
              careerFairs={attendedCareerFairs}
              color="bg-green-500"
              onEditCareerFair={handleEditCareerFair}
            />
          </div>

          {/* Drag Overlay with animation */}
          <DragOverlay
            dropAnimation={{
              duration: 250,
              easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
            }}
          >
            {activeId && activeCareerFair ? (
              <div className="opacity-80 transform scale-105 shadow-lg">
                <CareerFairCard careerFair={activeCareerFair} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Modal for creating new career fairs */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create New Career Fair</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateCareerFair}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Event Name *</label>
                <input
                  type="text"
                  name="event"
                  value={newCareerFair.event}
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
                  value={newCareerFair.date}
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
                  value={newCareerFair.location}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  name="url"
                  value={newCareerFair.url}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="https://..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={newCareerFair.notes}
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
                  Create Career Fair
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for editing career fairs */}
      {isEditModalOpen && editingCareerFair && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Career Fair</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateCareerFair}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Event Name *</label>
                <input
                  type="text"
                  name="event"
                  value={editingCareerFair.event}
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
                  value={editingCareerFair.date}
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
                  value={editingCareerFair.location || ""}
                  onChange={handleEditInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  name="url"
                  value={editingCareerFair.url || ""}
                  onChange={handleEditInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="https://..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={editingCareerFair.notes || ""}
                  onChange={handleEditInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={3}
                />
              </div>

              <div className="flex justify-between gap-2">
                <button
                  type="button"
                  onClick={handleDeleteCareerFair}
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

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

type Application = {
  id: number;
  company: string;
  hiringManager: string | null;
  msgToManager: string | null;
  recruiter: string | null;
  msgToRecruiter: string | null;
  notes: string | null;
  appliedStatus: boolean;
  msgToRecruiterStatus: boolean;
  msgToManagerStatus: boolean;
  interviewStatus: boolean;
  offerStatus: boolean;
};

type ColumnId =
  | "applied"
  | "msgToRecruiter"
  | "msgToManager"
  | "interview"
  | "offer";

// Draggable application card component
const DraggableApplicationCard = ({
  application,
  onEdit,
}: {
  application: Application;
  onEdit: (application: Application) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: application.id.toString(),
      data: { application },
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
        onEdit(application);
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
      onEdit(application);
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

      <h3 className="font-medium text-gray-800">{application.company}</h3>
      {application.recruiter && (
        <p className="text-sm text-gray-600">
          Recruiter: {application.recruiter}
        </p>
      )}
      {application.hiringManager && (
        <p className="text-sm text-gray-600">
          Hiring Manager: {application.hiringManager}
        </p>
      )}
      {application.notes && (
        <div className="mt-2 text-sm text-gray-600">
          <p className="font-medium">Notes:</p>
          <p>{application.notes}</p>
        </div>
      )}
    </div>
  );
};

// Regular application card for drag overlay
const ApplicationCard = ({ application }: { application: Application }) => (
  <div className="bg-white p-3 mb-2 rounded shadow">
    <h3 className="font-medium text-gray-800">{application.company}</h3>
    {application.recruiter && (
      <p className="text-sm text-gray-600">
        Recruiter: {application.recruiter}
      </p>
    )}
    {application.hiringManager && (
      <p className="text-sm text-gray-600">
        Hiring Manager: {application.hiringManager}
      </p>
    )}
    {application.notes && (
      <div className="mt-2 text-sm text-gray-600">
        <p className="font-medium">Notes:</p>
        <p>{application.notes}</p>
      </div>
    )}
  </div>
);

// Column component with droppable area
const Column = ({
  id,
  title,
  applications,
  color,
  onEditApplication,
}: {
  id: ColumnId;
  title: string;
  applications: Application[];
  color: string;
  onEditApplication: (application: Application) => void;
}) => {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      className="flex flex-col w-full md:w-1/5 min-w-[250px] bg-gray-50 rounded-lg p-2 mx-1 my-2 md:my-0"
      style={{ minHeight: "500px" }}
    >
      <div
        className={`text-center p-2 mb-3 rounded-md font-medium text-white ${color}`}
      >
        {title}
      </div>
      <div
        ref={setNodeRef}
        className="flex-1 p-2 overflow-y-auto"
        style={{ minHeight: "400px" }}
      >
        {applications.map((application) => (
          <DraggableApplicationCard
            key={application.id}
            application={application}
            onEdit={onEditApplication}
          />
        ))}
      </div>
    </div>
  );
};

export default function ApplicationsWithOutreachPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeApplication, setActiveApplication] =
    useState<Application | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    company: "",
    hiringManager: "",
    msgToManager: "",
    recruiter: "",
    msgToRecruiter: "",
    notes: "",
  });
  const [editFormData, setEditFormData] = useState({
    id: 0,
    company: "",
    hiringManager: "" as string | null,
    msgToManager: "" as string | null,
    recruiter: "" as string | null,
    msgToRecruiter: "" as string | null,
    notes: "" as string | null,
    appliedStatus: false,
    msgToRecruiterStatus: false,
    msgToManagerStatus: false,
    interviewStatus: false,
    offerStatus: false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/applications_with_outreach");
      const data = await response.json();
      setApplications(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching applications:", error);
      setLoading(false);
    }
  };

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/applications_with_outreach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setFormData({
          company: "",
          hiringManager: "",
          msgToManager: "",
          recruiter: "",
          msgToRecruiter: "",
          notes: "",
        });
        await fetchApplications();
      } else {
        console.error("Failed to create application");
      }
    } catch (error) {
      console.error("Error creating application:", error);
    }
  };

  const handleUpdateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/applications_with_outreach", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        setShowEditModal(false);
        await fetchApplications();
      } else {
        console.error("Failed to update application");
      }
    } catch (error) {
      console.error("Error updating application:", error);
    }
  };

  const handleUpdateStatus = async (
    id: number,
    status: {
      appliedStatus: boolean;
      msgToRecruiterStatus: boolean;
      msgToManagerStatus: boolean;
      interviewStatus: boolean;
      offerStatus: boolean;
    }
  ) => {
    try {
      const response = await fetch("/api/applications_with_outreach", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          ...status,
        }),
      });

      if (response.ok) {
        await fetchApplications();
      } else {
        console.error("Failed to update application status");
      }
    } catch (error) {
      console.error("Error updating application status:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleEditApplication = (application: Application) => {
    setEditFormData({ ...application });
    setActiveApplication(application);
    setShowEditModal(true);
  };

  const handleDeleteApplication = async () => {
    if (!activeApplication) return;

    try {
      const response = await fetch(
        `/api/applications_with_outreach?id=${activeApplication.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setShowDeleteConfirm(false);
        setShowEditModal(false);
        await fetchApplications();
      } else {
        console.error("Failed to delete application");
      }
    } catch (error) {
      console.error("Error deleting application:", error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const applicationData = active.data.current as { application: Application };

    // Set the active application for the drag overlay
    if (applicationData && applicationData.application) {
      setActiveApplication(applicationData.application);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Optional: can be used for real-time feedback during dragging
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const applicationId = parseInt(active.id.toString());
      const application = applications.find((a) => a.id === applicationId);
      const targetColumn = over.id as ColumnId;

      if (application) {
        // Define status update based on target column
        const newStatus = {
          appliedStatus: targetColumn === "applied",
          msgToRecruiterStatus: targetColumn === "msgToRecruiter",
          msgToManagerStatus: targetColumn === "msgToManager",
          interviewStatus: targetColumn === "interview",
          offerStatus: targetColumn === "offer",
        };

        // Update application status in the database
        await handleUpdateStatus(applicationId, newStatus);
      }
    }

    // Reset active application
    setActiveApplication(null);
  };

  // Group applications by status
  const appliedApplications = applications.filter(
    (a) =>
      a.appliedStatus &&
      !a.msgToRecruiterStatus &&
      !a.msgToManagerStatus &&
      !a.interviewStatus &&
      !a.offerStatus
  );
  const msgToRecruiterApplications = applications.filter(
    (a) =>
      a.msgToRecruiterStatus &&
      !a.msgToManagerStatus &&
      !a.interviewStatus &&
      !a.offerStatus
  );
  const msgToManagerApplications = applications.filter(
    (a) => a.msgToManagerStatus && !a.interviewStatus && !a.offerStatus
  );
  const interviewApplications = applications.filter(
    (a) => a.interviewStatus && !a.offerStatus
  );
  const offerApplications = applications.filter((a) => a.offerStatus);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-6">
        Applications with Outreach
      </h1>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded shadow"
        >
          Add New Application
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col md:flex-row md:overflow-x-auto space-y-4 md:space-y-0 p-2">
          <Column
            id="applied"
            title="Applied"
            applications={appliedApplications}
            color="bg-gray-500"
            onEditApplication={handleEditApplication}
          />
          <Column
            id="msgToRecruiter"
            title="Messaged Recruiter"
            applications={msgToRecruiterApplications}
            color="bg-blue-500"
            onEditApplication={handleEditApplication}
          />
          <Column
            id="msgToManager"
            title="Messaged Hiring Manager"
            applications={msgToManagerApplications}
            color="bg-purple-500"
            onEditApplication={handleEditApplication}
          />
          <Column
            id="interview"
            title="Interview"
            applications={interviewApplications}
            color="bg-orange-500"
            onEditApplication={handleEditApplication}
          />
          <Column
            id="offer"
            title="Offer"
            applications={offerApplications}
            color="bg-green-500"
            onEditApplication={handleEditApplication}
          />
        </div>

        {/* Drag overlay for visual feedback during dragging */}
        <DragOverlay>
          {activeApplication ? (
            <ApplicationCard application={activeApplication} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Application</h2>
            <form onSubmit={handleCreateApplication}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Company *</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Recruiter</label>
                <input
                  type="text"
                  name="recruiter"
                  value={formData.recruiter}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Message to Recruiter
                </label>
                <textarea
                  name="msgToRecruiter"
                  value={formData.msgToRecruiter}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Hiring Manager
                </label>
                <input
                  type="text"
                  name="hiringManager"
                  value={formData.hiringManager}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Message to Hiring Manager
                </label>
                <textarea
                  name="msgToManager"
                  value={formData.msgToManager}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && activeApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Application</h2>
            <form onSubmit={handleUpdateApplication}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Company *</label>
                <input
                  type="text"
                  name="company"
                  value={editFormData.company}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Recruiter</label>
                <input
                  type="text"
                  name="recruiter"
                  value={editFormData.recruiter || ""}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Message to Recruiter
                </label>
                <textarea
                  name="msgToRecruiter"
                  value={editFormData.msgToRecruiter || ""}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Hiring Manager
                </label>
                <input
                  type="text"
                  name="hiringManager"
                  value={editFormData.hiringManager || ""}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Message to Hiring Manager
                </label>
                <textarea
                  name="msgToManager"
                  value={editFormData.msgToManager || ""}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={editFormData.notes || ""}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
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
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-6">
              Are you sure you want to delete this application? This action
              cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteApplication}
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

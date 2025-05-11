"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import {
  DragAndDropBoard,
  ColumnConfig,
  DraggableItem,
} from "@/components/DragAndDrop";

type Application = {
  id: number;
  company: string;
  hiringManager: string | null;
  msgToManager: string | null;
  recruiter: string | null;
  msgToRecruiter: string | null;
  notes: string | null;
  status: string;
};

export default function ApplicationsWithOutreachPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeApplication, setActiveApplication] =
    useState<Application | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newApplication, setNewApplication] = useState<Partial<Application>>({
    company: "",
    hiringManager: "",
    msgToManager: "",
    recruiter: "",
    msgToRecruiter: "",
    notes: "",
    status: "applied",
  });
  const [editApplication, setEditApplication] = useState<Application | null>(
    null
  );

  // Define columns configuration
  const columns: ColumnConfig[] = [
    {
      id: "applied",
      title: "Applied",
      color: "bg-blue-500",
    },
    {
      id: "msgToRecruiter",
      title: "Messaged Recruiter",
      color: "bg-purple-500",
    },
    {
      id: "msgToManager",
      title: "Messaged Manager",
      color: "bg-indigo-500",
    },
    {
      id: "interview",
      title: "Interview",
      color: "bg-yellow-500",
    },
    {
      id: "offer",
      title: "Offer",
      color: "bg-green-500",
    },
  ];

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch("/api/applications_with_outreach");
      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      console.error("Error fetching applications:", error);
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
        body: JSON.stringify(newApplication),
      });

      if (!response.ok) {
        throw new Error("Failed to create application");
      }

      setShowCreateModal(false);
      setNewApplication({
        company: "",
        hiringManager: "",
        msgToManager: "",
        recruiter: "",
        msgToRecruiter: "",
        notes: "",
        status: "applied",
      });
      fetchApplications();
    } catch (error) {
      console.error("Error creating application:", error);
    }
  };

  const handleUpdateApplication = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editApplication) return;

    try {
      const response = await fetch(
        `/api/applications_with_outreach?id=${editApplication.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editApplication),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update application");
      }

      setShowEditModal(false);
      setEditApplication(null);
      fetchApplications();
    } catch (error) {
      console.error("Error updating application:", error);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const application = applications.find((app) => app.id === id);
      if (!application) return;

      const updatedApplication = { ...application, status };

      const response = await fetch(`/api/applications_with_outreach?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedApplication),
      });

      if (!response.ok) {
        throw new Error("Failed to update application status");
      }

      // Update the local state
      setApplications((prevApplications) =>
        prevApplications.map((app) =>
          app.id === id ? { ...app, status } : app
        )
      );
    } catch (error) {
      console.error("Error updating application status:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewApplication((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (editApplication) {
      setEditApplication({ ...editApplication, [name]: value });
    }
  };

  const handleEditApplication = (application: Application) => {
    setEditApplication(application);
    setShowEditModal(true);
  };

  const handleDeleteApplication = async () => {
    if (!editApplication) return;

    try {
      const response = await fetch(
        `/api/applications_with_outreach?id=${editApplication.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete application");
      }

      setShowDeleteModal(false);
      setShowEditModal(false);
      setEditApplication(null);
      fetchApplications();
    } catch (error) {
      console.error("Error deleting application:", error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id.toString());

    // Find the active application
    const foundApplication = applications.find(
      (app) => app.id.toString() === active.id.toString()
    );
    if (foundApplication) {
      setActiveApplication(foundApplication);
    }
  };

  // Render content for application cards
  const renderApplicationContent = (application: Application) => (
    <>
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
    </>
  );

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Applications with Outreach
        </h1>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          onClick={() => setShowCreateModal(true)}
        >
          Add Application
        </button>
      </div>

      {/* Drag and Drop Board */}
      <DragAndDropBoard<Application>
        items={applications}
        columns={columns}
        activeItem={activeApplication}
        onUpdateStatus={handleUpdateStatus}
        onEditItem={handleEditApplication}
        renderContent={renderApplicationContent}
        renderOverlay={(application) => renderApplicationContent(application)}
        onDragStart={handleDragStart}
      />

      {/* Create Application Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Application</h2>
            <form onSubmit={handleCreateApplication}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Company</label>
                <input
                  type="text"
                  name="company"
                  value={newApplication.company}
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
                  value={newApplication.recruiter || ""}
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
                  value={newApplication.msgToRecruiter || ""}
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
                  value={newApplication.hiringManager || ""}
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
                  value={newApplication.msgToManager || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={newApplication.notes || ""}
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

      {/* Edit Application Modal */}
      {showEditModal && editApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Application</h2>
            <form onSubmit={handleUpdateApplication}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Company</label>
                <input
                  type="text"
                  name="company"
                  value={editApplication.company}
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
                  value={editApplication.recruiter || ""}
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
                  value={editApplication.msgToRecruiter || ""}
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
                  value={editApplication.hiringManager || ""}
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
                  value={editApplication.msgToManager || ""}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={editApplication.notes || ""}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
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
              Are you sure you want to delete this application? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
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

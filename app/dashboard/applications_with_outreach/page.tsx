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
import { useDashboardMetrics } from "@/app/contexts/DashboardMetricsContext";

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
  const { refreshMetrics } = useDashboardMetrics();
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

  // Use the modularized column configuration
  const columns = getBoardColumns("applications");

  // Define fields for the create/edit modal
  const applicationFields = [
    {
      name: "company",
      label: "Company",
      type: "text" as const,
      required: true,
    },
    { name: "hiringManager", label: "Hiring Manager", type: "text" as const },
    {
      name: "msgToManager",
      label: "Message to Manager",
      type: "textarea" as const,
      rows: 3,
    },
    { name: "recruiter", label: "Recruiter", type: "text" as const },
    {
      name: "msgToRecruiter",
      label: "Message to Recruiter",
      type: "textarea" as const,
      rows: 3,
    },
    { name: "notes", label: "Notes", type: "textarea" as const, rows: 3 },
  ];

  // Define fields for the card content
  const contentFields = [
    { key: "recruiter", label: "Recruiter", type: "text" as const },
    { key: "hiringManager", label: "Hiring Manager", type: "text" as const },
    {
      key: "msgToManager",
      label: "Message to Manager",
      type: "notes" as const,
    },
    {
      key: "msgToRecruiter",
      label: "Message to Recruiter",
      type: "notes" as const,
    },
    { key: "notes", label: "Notes", type: "notes" as const },
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
      await fetchApplications();
      // Refresh dashboard metrics after creating a new application
      await refreshMetrics();
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
      await fetchApplications();
      // Refresh dashboard metrics after updating application
      await refreshMetrics();
    } catch (error) {
      console.error("Error updating application:", error);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const application = applications.find((app) => app.id === id);
      if (!application) return;

      const updatedApplication = { ...application, status };

      // Note: The UI is already updated by the DragAndDropBoard component
      // We just need to make the API call here

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

      // If successful, update our app state to match
      // The UI is already updated, but we need to keep our state in sync
      setApplications((prevApplications) =>
        prevApplications.map((app) =>
          app.id === id ? { ...app, status } : app
        )
      );
      // Refresh dashboard metrics after updating status
      await refreshMetrics();
    } catch (error) {
      console.error("Error updating application status:", error);
      // No need to revert the UI as the DragAndDropBoard will handle that
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
      await fetchApplications();
      // Refresh dashboard metrics after deleting application
      await refreshMetrics();
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

  // Render content for application cards using our new CardContent component
  const renderApplicationContent = (item: DraggableItem) => {
    const application = item as unknown as Application;
    return (
      <CardContent title="company" item={application} fields={contentFields} />
    );
  };

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

      <DragAndDropBoard
        items={applications}
        columns={columns}
        activeItem={activeApplication}
        onUpdateStatus={handleUpdateStatus}
        onEditItem={handleEditApplication}
        renderContent={renderApplicationContent}
        renderOverlay={renderApplicationContent}
        onDragStart={handleDragStart}
      />

      {/* Use our reusable components for modals */}
      {showCreateModal && (
        <CardCreationModal
          title="Add New Application"
          onSubmit={handleCreateApplication}
          onClose={() => setShowCreateModal(false)}
          fields={applicationFields}
          values={newApplication}
          onChange={handleInputChange}
        />
      )}

      {showEditModal && editApplication && (
        <CardEditModal
          title="Edit Application"
          onSubmit={handleUpdateApplication}
          onClose={() => setShowEditModal(false)}
          onDelete={() => setShowDeleteModal(true)}
          fields={applicationFields}
          values={editApplication}
          onChange={handleEditInputChange}
        />
      )}

      {showDeleteModal && (
        <ConfirmationModal
          title="Delete Application"
          message="Are you sure you want to delete this application? This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDeleteApplication}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}

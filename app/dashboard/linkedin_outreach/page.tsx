"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DragStartEvent } from "@dnd-kit/core";
import {
  DragAndDropBoard,
  DraggableItem,
} from "@/components/DragAndDrop";
import { getBoardColumns } from "@/components/BoardColumns";
import CardCreationModal from "@/components/CardCreationModal";
import CardContent from "@/components/CardContent";
import CardEditModal from "@/components/CardEditModal";
import ConfirmationModal from "@/components/ConfirmationModal";

type Outreach = {
  id: number;
  name: string;
  company: string;
  message: string | null;
  linkedInUrl: string | null;
  notes: string | null;
  status: string;
};

export default function LinkedInOutreachPage() {
  const router = useRouter();
  const [outreaches, setOutreaches] = useState<Outreach[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeOutreach, setActiveOutreach] = useState<Outreach | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newOutreach, setNewOutreach] = useState<Partial<Outreach>>({
    name: "",
    company: "",
    message: "",
    linkedInUrl: "",
    notes: "",
    status: "responded",
  });
  const [editOutreach, setEditOutreach] = useState<Outreach | null>(null);

  // Define columns configuration
  const columns = getBoardColumns("linkedinOutreach");

  // Define fields for the create/edit modal
  const outreachFields = [
    { name: "name", label: "Name", type: "text" as const, required: true },
    {
      name: "company",
      label: "Company",
      type: "text" as const,
      required: true,
    },
    { name: "linkedInUrl", label: "LinkedIn URL", type: "url" as const },
    { name: "message", label: "Message", type: "textarea" as const, rows: 3 },
    { name: "notes", label: "Notes", type: "textarea" as const, rows: 3 },
  ];

  // Define fields for the card content
  const contentFields = [
    { key: "company", label: "Company", type: "text" as const },
    {
      key: "linkedInUrl",
      label: "LinkedIn Profile",
      type: "url" as const,
      linkText: "LinkedIn Profile",
    },
    { key: "message", label: "Message", type: "notes" as const },
    { key: "notes", label: "Notes", type: "notes" as const },
  ];

  useEffect(() => {
    fetchOutreaches();
  }, []);

  const fetchOutreaches = async () => {
    try {
      const response = await fetch("/api/linkedin_outreach");
      if (!response.ok) {
        throw new Error("Failed to fetch outreaches");
      }
      const data = await response.json();
      setOutreaches(data);
    } catch (error) {
      console.error("Error fetching outreaches:", error);
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

      if (!response.ok) {
        throw new Error("Failed to create outreach");
      }

      setShowCreateModal(false);
      setNewOutreach({
        name: "",
        company: "",
        message: "",
        linkedInUrl: "",
        notes: "",
        status: "contacted",
      });
      fetchOutreaches();
    } catch (error) {
      console.error("Error creating outreach:", error);
    }
  };

  const handleUpdateOutreach = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editOutreach) return;

    try {
      const response = await fetch(
        `/api/linkedin_outreach?id=${editOutreach.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editOutreach),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update outreach");
      }

      setShowEditModal(false);
      setEditOutreach(null);
      fetchOutreaches();
    } catch (error) {
      console.error("Error updating outreach:", error);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const outreach = outreaches.find((out) => out.id === id);
      if (!outreach) return;

      const updatedOutreach = { ...outreach, status };

      // Note: The UI is already updated by the DragAndDropBoard component
      // We just need to make the API call here

      const response = await fetch(`/api/linkedin_outreach?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedOutreach),
      });

      if (!response.ok) {
        throw new Error("Failed to update outreach status");
      }

      // If successful, update our app state to match
      // The UI is already updated, but we need to keep our state in sync
      setOutreaches((prevOutreaches) =>
        prevOutreaches.map((out) => (out.id === id ? { ...out, status } : out))
      );
    } catch (error) {
      console.error("Error updating outreach status:", error);
      // No need to revert the UI as the DragAndDropBoard will handle that
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
    const { name, value } = e.target;
    if (editOutreach) {
      setEditOutreach({ ...editOutreach, [name]: value });
    }
  };

  const handleEditOutreach = (outreach: Outreach) => {
    setEditOutreach(outreach);
    setShowEditModal(true);
  };

  const handleDeleteOutreach = async () => {
    if (!editOutreach) return;

    try {
      const response = await fetch(
        `/api/linkedin_outreach?id=${editOutreach.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete outreach");
      }

      setShowDeleteModal(false);
      setShowEditModal(false);
      setEditOutreach(null);
      fetchOutreaches();
    } catch (error) {
      console.error("Error deleting outreach:", error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id.toString());

    // Find the active outreach
    const foundOutreach = outreaches.find(
      (out) => out.id.toString() === active.id.toString()
    );
    if (foundOutreach) {
      setActiveOutreach(foundOutreach);
    }
  };

  // Render content for outreach cards using our new CardContent component
  const renderOutreachContent = (item: DraggableItem) => {
    const outreach = item as unknown as Outreach;
    return <CardContent title="name" item={outreach} fields={contentFields} />;
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">LinkedIn Outreach</h1>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          onClick={() => setShowCreateModal(true)}
        >
          Add Outreach
        </button>
      </div>

      <DragAndDropBoard
        items={outreaches}
        columns={columns}
        activeItem={activeOutreach}
        onUpdateStatus={handleUpdateStatus}
        onEditItem={handleEditOutreach}
        renderContent={renderOutreachContent}
        renderOverlay={renderOutreachContent}
        onDragStart={handleDragStart}
      />

      {/* Use our reusable components for modals */}
      {showCreateModal && (
        <CardCreationModal
          title="Add New Outreach"
          onSubmit={handleCreateOutreach}
          onClose={() => setShowCreateModal(false)}
          fields={outreachFields}
          values={newOutreach}
          onChange={handleInputChange}
        />
      )}

      {showEditModal && editOutreach && (
        <CardEditModal
          title="Edit Outreach"
          onSubmit={handleUpdateOutreach}
          onClose={() => setShowEditModal(false)}
          onDelete={() => setShowDeleteModal(true)}
          fields={outreachFields}
          values={editOutreach}
          onChange={handleEditInputChange}
        />
      )}

      {showDeleteModal && (
        <ConfirmationModal
          title="Delete Outreach"
          message="Are you sure you want to delete this outreach? This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDeleteOutreach}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}

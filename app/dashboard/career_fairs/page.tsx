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

type CareerFair = {
  id: number;
  event: string;
  date: string;
  location: string | null;
  url: string | null;
  notes: string | null;
  status: string;
};

export default function CareerFairsPage() {
  const router = useRouter();
  const [careerFairs, setCareerFairs] = useState<CareerFair[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeCareerFair, setActiveCareerFair] = useState<CareerFair | null>(
    null
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newCareerFair, setNewCareerFair] = useState<Partial<CareerFair>>({
    event: "",
    date: "",
    location: "",
    url: "",
    notes: "",
    status: "scheduled",
  });
  const [editCareerFair, setEditCareerFair] = useState<CareerFair | null>(null);

  // Use the modularized column configuration
  const columns = getBoardColumns("careerFairs");

  // Define fields for the create modal
  const createFields = [
    {
      name: "event",
      label: "Event Name",
      type: "text" as const,
      required: true,
    },
    { name: "date", label: "Date", type: "date" as const, required: true },
    { name: "location", label: "Location", type: "text" as const },
    { name: "url", label: "URL", type: "url" as const },
    { name: "notes", label: "Notes", type: "textarea" as const, rows: 3 },
  ];

  // Define fields for the card content
  const contentFields = [
    { key: "date", label: "Date", type: "text" as const },
    { key: "location", label: "Location", type: "text" as const },
    {
      key: "url",
      label: "Event Link",
      type: "url" as const,
      linkText: "Event Link",
    },
    { key: "notes", label: "Notes", type: "notes" as const },
  ];

  useEffect(() => {
    fetchCareerFairs();
  }, []);

  const fetchCareerFairs = async () => {
    try {
      const response = await fetch("/api/career_fairs");
      if (!response.ok) {
        throw new Error("Failed to fetch career fairs");
      }
      const data = await response.json();
      setCareerFairs(data);
    } catch (error) {
      console.error("Error fetching career fairs:", error);
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

      if (!response.ok) {
        throw new Error("Failed to create career fair");
      }

      setShowCreateModal(false);
      setNewCareerFair({
        event: "",
        date: "",
        location: "",
        url: "",
        notes: "",
        status: "scheduled",
      });
      fetchCareerFairs();
    } catch (error) {
      console.error("Error creating career fair:", error);
    }
  };

  const handleUpdateCareerFair = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editCareerFair) return;

    try {
      const response = await fetch(
        `/api/career_fairs?id=${editCareerFair.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editCareerFair),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update career fair");
      }

      setShowEditModal(false);
      setEditCareerFair(null);
      fetchCareerFairs();
    } catch (error) {
      console.error("Error updating career fair:", error);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const careerFair = careerFairs.find((cf) => cf.id === id);
      if (!careerFair) return;

      const updatedCareerFair = { ...careerFair, status };

      // Note: The UI is already updated by the DragAndDropBoard component
      // We just need to make the API call here

      const response = await fetch(`/api/career_fairs?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedCareerFair),
      });

      if (!response.ok) {
        throw new Error("Failed to update career fair status");
      }

      // If successful, update our app state to match
      // The UI is already updated, but we need to keep our state in sync
      setCareerFairs((prevCareerFairs) =>
        prevCareerFairs.map((cf) => (cf.id === id ? { ...cf, status } : cf))
      );
    } catch (error) {
      console.error("Error updating career fair status:", error);
      // No need to revert the UI as the DragAndDropBoard will handle that
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
    const { name, value } = e.target;
    if (editCareerFair) {
      setEditCareerFair({ ...editCareerFair, [name]: value });
    }
  };

  const handleEditCareerFair = (careerFair: CareerFair) => {
    setEditCareerFair(careerFair);
    setShowEditModal(true);
  };

  const handleDeleteCareerFair = async () => {
    if (!editCareerFair) return;

    try {
      const response = await fetch(
        `/api/career_fairs?id=${editCareerFair.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete career fair");
      }

      setShowDeleteModal(false);
      setShowEditModal(false);
      setEditCareerFair(null);
      fetchCareerFairs();
    } catch (error) {
      console.error("Error deleting career fair:", error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id.toString());

    // Find the active career fair
    const foundCareerFair = careerFairs.find(
      (cf) => cf.id.toString() === active.id.toString()
    );
    if (foundCareerFair) {
      setActiveCareerFair(foundCareerFair);
    }
  };

  // Render content for career fair cards using our new component
  const renderCareerFairContent = (item: DraggableItem) => {
    const careerFair = item as unknown as CareerFair;
    return (
      <CardContent title="event" item={careerFair} fields={contentFields} />
    );
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Career Fairs</h1>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          onClick={() => setShowCreateModal(true)}
        >
          Add Career Fair
        </button>
      </div>

      <DragAndDropBoard
        items={careerFairs}
        columns={columns}
        activeItem={activeCareerFair}
        onUpdateStatus={handleUpdateStatus}
        onEditItem={handleEditCareerFair}
        renderContent={renderCareerFairContent}
        renderOverlay={renderCareerFairContent}
        onDragStart={handleDragStart}
      />

      {/* Use our new reusable components for modals */}
      {showCreateModal && (
        <CardCreationModal
          title="Add New Career Fair"
          onSubmit={handleCreateCareerFair}
          onClose={() => setShowCreateModal(false)}
          fields={createFields}
          values={newCareerFair}
          onChange={handleInputChange}
        />
      )}

      {showEditModal && editCareerFair && (
        <CardEditModal
          title="Edit Career Fair"
          onSubmit={handleUpdateCareerFair}
          onClose={() => setShowEditModal(false)}
          onDelete={() => setShowDeleteModal(true)}
          fields={createFields}
          values={editCareerFair}
          onChange={handleEditInputChange}
        />
      )}

      {showDeleteModal && (
        <ConfirmationModal
          title="Delete Career Fair"
          message="Are you sure you want to delete this career fair? This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDeleteCareerFair}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import {
  DragAndDropBoard,
  ColumnConfig,
  DraggableItem,
} from "@/components/DragAndDrop";
import { getBoardColumns } from "@/components/BoardColumns";

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

  // Render content for career fair cards
  const renderCareerFairContent = (careerFair: CareerFair) => (
    <>
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
    </>
  );

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

      {/* Drag and Drop Board */}
      <DragAndDropBoard<CareerFair>
        items={careerFairs}
        columns={columns}
        activeItem={activeCareerFair}
        onUpdateStatus={handleUpdateStatus}
        onEditItem={handleEditCareerFair}
        renderContent={renderCareerFairContent}
        renderOverlay={(careerFair) => renderCareerFairContent(careerFair)}
        onDragStart={handleDragStart}
      />

      {/* Create Career Fair Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Career Fair</h2>
            <form onSubmit={handleCreateCareerFair}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Event Name</label>
                <input
                  type="text"
                  name="event"
                  value={newCareerFair.event}
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
                  value={newCareerFair.date}
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
                  value={newCareerFair.location || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">URL</label>
                <input
                  type="url"
                  name="url"
                  value={newCareerFair.url || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={newCareerFair.notes || ""}
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

      {/* Edit Career Fair Modal */}
      {showEditModal && editCareerFair && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Career Fair</h2>
            <form onSubmit={handleUpdateCareerFair}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Event Name</label>
                <input
                  type="text"
                  name="event"
                  value={editCareerFair.event}
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
                  value={editCareerFair.date}
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
                  value={editCareerFair.location || ""}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">URL</label>
                <input
                  type="url"
                  name="url"
                  value={editCareerFair.url || ""}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={editCareerFair.notes || ""}
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
              Are you sure you want to delete this career fair? This action
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
                onClick={handleDeleteCareerFair}
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

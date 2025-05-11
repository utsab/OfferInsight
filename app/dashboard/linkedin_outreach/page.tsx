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
        status: "responded",
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

  // Render content for outreach cards
  const renderOutreachContent = (outreach: Outreach) => (
    <>
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
    </>
  );

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

      {/* Drag and Drop Board */}
      <DragAndDropBoard<Outreach>
        items={outreaches}
        columns={columns}
        activeItem={activeOutreach}
        onUpdateStatus={handleUpdateStatus}
        onEditItem={handleEditOutreach}
        renderContent={renderOutreachContent}
        renderOverlay={(outreach) => renderOutreachContent(outreach)}
        onDragStart={handleDragStart}
      />

      {/* Create Outreach Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Outreach</h2>
            <form onSubmit={handleCreateOutreach}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={newOutreach.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Company</label>
                <input
                  type="text"
                  name="company"
                  value={newOutreach.company}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">LinkedIn URL</label>
                <input
                  type="url"
                  name="linkedInUrl"
                  value={newOutreach.linkedInUrl || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Message</label>
                <textarea
                  name="message"
                  value={newOutreach.message || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={newOutreach.notes || ""}
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

      {/* Edit Outreach Modal */}
      {showEditModal && editOutreach && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Outreach</h2>
            <form onSubmit={handleUpdateOutreach}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={editOutreach.name}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Company</label>
                <input
                  type="text"
                  name="company"
                  value={editOutreach.company}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">LinkedIn URL</label>
                <input
                  type="url"
                  name="linkedInUrl"
                  value={editOutreach.linkedInUrl || ""}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Message</label>
                <textarea
                  name="message"
                  value={editOutreach.message || ""}
                  onChange={handleEditInputChange}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={editOutreach.notes || ""}
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
              Are you sure you want to delete this outreach? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOutreach}
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

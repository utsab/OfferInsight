'use client';

import React, { useState, useEffect } from 'react';
import { getApiHeaders } from '@/app/lib/api-helpers';

import { Plus, Trash2, X } from 'lucide-react';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { LinkedinOutreach, LinkedinOutreachColumnId, BoardTimeFilter, LinkedinOutreachStatus } from './types';
import { linkedinOutreachStatusToColumn, linkedinOutreachColumnToStatus } from './types';
import { CardDateMeta, DroppableColumn, DeleteModal } from './shared';

// ===== DATE FIELD EDITING TOGGLE START =====
// Toggle this flag to enable editing dateCreated and dateModified in create/edit modals for testing and debugging.
const ENABLE_DATE_FIELD_EDITING = false;
// ===== DATE FIELD EDITING TOGGLE END =====

type CoffeeChatsTabProps = {
  filteredLinkedinOutreachColumns: Record<LinkedinOutreachColumnId, LinkedinOutreach[]>;
  linkedinOutreachColumns: Record<LinkedinOutreachColumnId, LinkedinOutreach[]>;
  setLinkedinOutreachColumns: React.Dispatch<React.SetStateAction<Record<LinkedinOutreachColumnId, LinkedinOutreach[]>>>;
  isLoadingLinkedinOutreach: boolean;
  linkedinOutreachFilter: BoardTimeFilter;
  setLinkedinOutreachFilter: (filter: BoardTimeFilter) => void;
  setIsLinkedinOutreachModalOpen: (open: boolean) => void;
  setEditingLinkedinOutreach: (outreach: LinkedinOutreach | null) => void;
  sensors: any;
  handleLinkedinOutreachDragStart: (event: any) => void;
  handleLinkedinOutreachDragOver: (event: any) => void;
  handleLinkedinOutreachDragEnd: (event: any) => void;
  activeLinkedinOutreachId: string | null;
  getLinkedinOutreachColumnOfItem: (id: string) => LinkedinOutreachColumnId | null;
  isLinkedinOutreachModalOpen: boolean;
  editingLinkedinOutreach: LinkedinOutreach | null;
  setIsDeletingLinkedinOutreach: (id: number | null) => void;
  isDeletingLinkedinOutreach: number | null;
  fetchLinkedinOutreach: () => Promise<void>;
  isDraggingLinkedinOutreachRef: React.MutableRefObject<boolean>;
  userIdParam: string | null;
};

function SortableLinkedinOutreachCard(props: { 
  card: LinkedinOutreach;
  activeLinkedinOutreachId: string | null;
  setEditingLinkedinOutreach: (outreach: LinkedinOutreach) => void;
  setIsLinkedinOutreachModalOpen: (open: boolean) => void;
  setIsDeletingLinkedinOutreach: (id: number) => void;
  isDraggingLinkedinOutreachRef: React.MutableRefObject<boolean>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(props.card.id) });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : undefined,
  } as React.CSSProperties;

  const handleClick = (e: React.MouseEvent) => {
    if (props.activeLinkedinOutreachId === String(props.card.id)) {
      return;
    }
    setTimeout(() => {
      if (!props.isDraggingLinkedinOutreachRef.current && !isDragging && props.activeLinkedinOutreachId !== String(props.card.id)) {
        props.setEditingLinkedinOutreach(props.card);
        props.setIsLinkedinOutreachModalOpen(true);
      }
    }, 50);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    props.setIsDeletingLinkedinOutreach(props.card.id);
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      onClick={handleClick}
      className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-pointer hover:border-electric-blue transition-colors group relative"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="text-white font-medium mb-1">{props.card.name}</div>
          <div className="text-gray-400 text-xs mb-1">{props.card.company}</div>
          {props.card.linkedInUrl && (
            <div className="text-xs mb-1">
              <a
                href={props.card.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-electric-blue hover:text-sky-300 underline"
              >
                LinkedIn Profile
              </a>
            </div>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleDelete}
            className="p-1 hover:bg-red-600 rounded text-gray-300 hover:text-white"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {props.card.message && (
        <div className="text-gray-400 text-xs mb-2 line-clamp-2">{props.card.message}</div>
      )}
      {props.card.notes && (
        <div className="text-gray-400 text-xs mb-2 line-clamp-2">{props.card.notes}</div>
      )}
      {props.card.recievedReferral && (
        <div className="text-green-400 text-xs mb-2">✓ Referral Received</div>
      )}
      <CardDateMeta created={props.card.dateCreated} modified={props.card.dateModified} />
    </div>
  );
}

// Linkedin outreach modal component
function LinkedinOutreachModal({ 
  linkedinOutreach, 
  onClose, 
  onSave,
  defaultStatus
}: { 
  linkedinOutreach: LinkedinOutreach | null; 
  onClose: () => void; 
  onSave: (data: Partial<LinkedinOutreach>) => void;
  defaultStatus?: LinkedinOutreachStatus;
}) {
  // ===== DATE CREATED EDITING: Helper function to convert ISO date to local date string =====
  const toLocalDate = (value: string) => {
    try {
      const date = new Date(value);
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  type LinkedinOutreachFormData = {
    name: string;
    company: string;
    message: string;
    linkedInUrl: string;
    notes: string;
    status: LinkedinOutreachStatus;
    recievedReferral: boolean;
    dateCreated: string; // ===== DATE FIELD EDITING: Added for testing/debugging =====
    dateModified: string; // ===== DATE FIELD EDITING: Added for testing/debugging =====
  };

  const [formData, setFormData] = useState<LinkedinOutreachFormData>({
    name: linkedinOutreach?.name || '',
    company: linkedinOutreach?.company || '',
    message: linkedinOutreach?.message || '',
    linkedInUrl: linkedinOutreach?.linkedInUrl || '',
    notes: linkedinOutreach?.notes || '',
    status: linkedinOutreach ? linkedinOutreach.status : (defaultStatus || 'outreachRequestSent'),
    recievedReferral: linkedinOutreach?.recievedReferral || false,
    dateCreated: linkedinOutreach?.dateCreated ? toLocalDate(linkedinOutreach.dateCreated) : '', // ===== DATE FIELD EDITING =====
    dateModified: linkedinOutreach?.dateModified ? toLocalDate(linkedinOutreach.dateModified) : '', // ===== DATE FIELD EDITING =====
  });

  // Update form data when linkedin outreach changes
  useEffect(() => {
    if (linkedinOutreach) {
      setFormData({
        name: linkedinOutreach.name || '',
        company: linkedinOutreach.company || '',
        message: linkedinOutreach.message || '',
        linkedInUrl: linkedinOutreach.linkedInUrl || '',
        notes: linkedinOutreach.notes || '',
        status: linkedinOutreach.status,
        recievedReferral: linkedinOutreach.recievedReferral || false,
        dateCreated: linkedinOutreach.dateCreated ? toLocalDate(linkedinOutreach.dateCreated) : '', // ===== DATE FIELD EDITING =====
        dateModified: linkedinOutreach.dateModified ? toLocalDate(linkedinOutreach.dateModified) : '', // ===== DATE FIELD EDITING =====
      });
      } else {
      setFormData({
        name: '',
        company: '',
        message: '',
        linkedInUrl: '',
        notes: '',
        status: defaultStatus || 'outreachRequestSent',
        recievedReferral: false,
        dateCreated: '', // ===== DATE FIELD EDITING =====
        dateModified: '', // ===== DATE FIELD EDITING =====
      });
    }
  }, [linkedinOutreach, defaultStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.company.trim()) {
      alert('Name and company are required');
      return;
    }
    // ===== DATE FIELD EDITING: Convert date strings to ISO DateTime if provided =====
    const { dateCreated, dateModified, ...restFormData } = formData;
    const submitData: Partial<LinkedinOutreach> = { ...restFormData };
    if (ENABLE_DATE_FIELD_EDITING) {
      if (dateCreated) {
        try {
          const date = new Date(dateCreated);
          if (!isNaN(date.getTime())) {
            submitData.dateCreated = date.toISOString();
          }
        } catch (error) {
          console.error('Error parsing dateCreated:', error);
        }
      }
      if (dateModified !== undefined) {
        try {
          if (dateModified) {
            const date = new Date(dateModified);
            if (!isNaN(date.getTime())) {
              submitData.dateModified = date.toISOString();
            }
          } else {
            submitData.dateModified = null;
          }
        } catch (error) {
          console.error('Error parsing dateModified:', error);
        }
      }
    }
    onSave(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">
            {linkedinOutreach ? 'Edit Coffee Chat' : 'Create New Coffee Chat'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-semibold mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400"
                placeholder="Person's name"
                required
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Company *</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400"
                placeholder="Company name"
                required
              />
            </div>
          </div>

          {linkedinOutreach && (
            <>
              <div>
                <label className="block text-white font-semibold mb-2">LinkedIn URL</label>
                <input
                  type="url"
                  value={formData.linkedInUrl}
                  onChange={(e) => setFormData({ ...formData, linkedInUrl: e.target.value })}
                  className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400 min-h-[100px]"
                  placeholder="Message sent to the person"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="text-white font-semibold whitespace-nowrap">Status:</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as LinkedinOutreachStatus })}
                  className="flex-1 bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
                >
                  <option value="outreachRequestSent">Outreach Request Sent</option>
                  <option value="accepted">Request Accepted</option>
                  <option value="followedUp">Followed Up</option>
                  <option value="linkedinOutreach">Coffee Chat</option>
                </select>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400 min-h-[100px]"
                  placeholder="Additional notes"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="recievedReferral"
                  checked={formData.recievedReferral}
                  onChange={(e) => setFormData({ ...formData, recievedReferral: e.target.checked })}
                  className="w-4 h-4 bg-gray-700 border border-light-steel-blue rounded text-electric-blue focus:ring-electric-blue"
                />
                <label htmlFor="recievedReferral" className="ml-2 text-white font-semibold">
                  Received Referral
                </label>
              </div>
            </>
          )}

          {/* ===== DATE FIELD EDITING: Show dateCreated and dateModified fields when toggle is enabled ===== */}
          {ENABLE_DATE_FIELD_EDITING && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-semibold mb-2">Date Created (Testing/Debug)</label>
                <input
                  type="date"
                  value={formData.dateCreated}
                  onChange={(e) => setFormData({ ...formData, dateCreated: e.target.value })}
                  className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">Date Modified (Testing/Debug)</label>
                <input
                  type="date"
                  value={formData.dateModified}
                  onChange={(e) => setFormData({ ...formData, dateModified: e.target.value })}
                  className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-electric-blue hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
            >
              {linkedinOutreach ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CoffeeChatsTab({
  filteredLinkedinOutreachColumns,
  linkedinOutreachColumns,
  setLinkedinOutreachColumns,
  isLoadingLinkedinOutreach,
  linkedinOutreachFilter,
  setLinkedinOutreachFilter,
  setIsLinkedinOutreachModalOpen,
  setEditingLinkedinOutreach,
  sensors,
  handleLinkedinOutreachDragStart,
  handleLinkedinOutreachDragOver,
  handleLinkedinOutreachDragEnd,
  activeLinkedinOutreachId,
  getLinkedinOutreachColumnOfItem,
  isLinkedinOutreachModalOpen,
  editingLinkedinOutreach,
  setIsDeletingLinkedinOutreach,
  isDeletingLinkedinOutreach,
  fetchLinkedinOutreach,
  isDraggingLinkedinOutreachRef,
  userIdParam,
}: CoffeeChatsTabProps) {
  const [defaultStatus, setDefaultStatus] = React.useState<LinkedinOutreachStatus | undefined>(undefined);
  
  return (
    <section className="bg-gray-800 border border-light-steel-blue rounded-lg p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h4 className="text-xl font-bold text-white">Coffee Chats</h4>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span>Show:</span>
          <button
            onClick={() => setLinkedinOutreachFilter('modifiedThisMonth')}
            className={`px-3 py-1 rounded-md border transition-colors ${
              linkedinOutreachFilter === 'modifiedThisMonth'
                ? 'bg-electric-blue text-white border-electric-blue'
                : 'bg-gray-700 text-gray-300 border-transparent hover:border-light-steel-blue'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setLinkedinOutreachFilter('allTime')}
            className={`px-3 py-1 rounded-md border transition-colors ${
              linkedinOutreachFilter === 'allTime'
                ? 'bg-electric-blue text-white border-electric-blue'
                : 'bg-gray-700 text-gray-300 border-transparent hover:border-light-steel-blue'
            }`}
          >
            All Time
          </button>
        </div>
        <button 
          onClick={() => {
            setDefaultStatus(undefined);
            setEditingLinkedinOutreach(null);
            setIsLinkedinOutreachModalOpen(true);
          }}
          className="bg-electric-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
        >
          <Plus className="mr-2" />New Outreach
        </button>
      </div>
      {isLoadingLinkedinOutreach ? (
        <div className="text-center py-8 text-gray-400">Loading coffee chats...</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleLinkedinOutreachDragStart} onDragOver={handleLinkedinOutreachDragOver} onDragEnd={handleLinkedinOutreachDragEnd}>
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <h5 className="text-white font-semibold mb-4 flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                Outreach Request Sent ({filteredLinkedinOutreachColumns.outreach.length})
              </h5>
              <SortableContext items={filteredLinkedinOutreachColumns.outreach.map(c => String(c.id))} strategy={rectSortingStrategy}>
                <DroppableColumn 
                  id="outreach"
                  onAddCard={() => {
                    setDefaultStatus(linkedinOutreachColumnToStatus.outreach);
                    setEditingLinkedinOutreach(null);
                    setIsLinkedinOutreachModalOpen(true);
                  }}
                >
                  {filteredLinkedinOutreachColumns.outreach.map(card => (
                    <SortableLinkedinOutreachCard 
                      key={card.id} 
                      card={card}
                      activeLinkedinOutreachId={activeLinkedinOutreachId}
                      setEditingLinkedinOutreach={setEditingLinkedinOutreach}
                      setIsLinkedinOutreachModalOpen={setIsLinkedinOutreachModalOpen}
                      setIsDeletingLinkedinOutreach={setIsDeletingLinkedinOutreach}
                      isDraggingLinkedinOutreachRef={isDraggingLinkedinOutreachRef}
                    />
                  ))}
                </DroppableColumn>
              </SortableContext>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h5 className="text-white font-semibold mb-4 flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                Request Accepted ({filteredLinkedinOutreachColumns.accepted.length})
              </h5>
              <SortableContext items={filteredLinkedinOutreachColumns.accepted.map(c => String(c.id))} strategy={rectSortingStrategy}>
                <DroppableColumn 
                  id="accepted"
                  onAddCard={() => {
                    setDefaultStatus(linkedinOutreachColumnToStatus.accepted);
                    setEditingLinkedinOutreach(null);
                    setIsLinkedinOutreachModalOpen(true);
                  }}
                >
                  {filteredLinkedinOutreachColumns.accepted.map(card => (
                    <SortableLinkedinOutreachCard 
                      key={card.id} 
                      card={card}
                      activeLinkedinOutreachId={activeLinkedinOutreachId}
                      setEditingLinkedinOutreach={setEditingLinkedinOutreach}
                      setIsLinkedinOutreachModalOpen={setIsLinkedinOutreachModalOpen}
                      setIsDeletingLinkedinOutreach={setIsDeletingLinkedinOutreach}
                      isDraggingLinkedinOutreachRef={isDraggingLinkedinOutreachRef}
                    />
                  ))}
                </DroppableColumn>
              </SortableContext>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h5 className="text-white font-semibold mb-4 flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                Followed Up ({filteredLinkedinOutreachColumns.followedUpLinkedin.length})
              </h5>
              <SortableContext items={filteredLinkedinOutreachColumns.followedUpLinkedin.map(c => String(c.id))} strategy={rectSortingStrategy}>
                <DroppableColumn 
                  id="followedUpLinkedin"
                  onAddCard={() => {
                    setDefaultStatus(linkedinOutreachColumnToStatus.followedUpLinkedin);
                    setEditingLinkedinOutreach(null);
                    setIsLinkedinOutreachModalOpen(true);
                  }}
                >
                  {filteredLinkedinOutreachColumns.followedUpLinkedin.map(card => (
                    <SortableLinkedinOutreachCard 
                      key={card.id} 
                      card={card}
                      activeLinkedinOutreachId={activeLinkedinOutreachId}
                      setEditingLinkedinOutreach={setEditingLinkedinOutreach}
                      setIsLinkedinOutreachModalOpen={setIsLinkedinOutreachModalOpen}
                      setIsDeletingLinkedinOutreach={setIsDeletingLinkedinOutreach}
                      isDraggingLinkedinOutreachRef={isDraggingLinkedinOutreachRef}
                    />
                  ))}
                </DroppableColumn>
              </SortableContext>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h5 className="text-white font-semibold mb-4 flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                Coffee Chat ({filteredLinkedinOutreachColumns.linkedinOutreach.length})
              </h5>
              <SortableContext items={filteredLinkedinOutreachColumns.linkedinOutreach.map(c => String(c.id))} strategy={rectSortingStrategy}>
                <DroppableColumn 
                  id="linkedinOutreach"
                  onAddCard={() => {
                    setDefaultStatus(linkedinOutreachColumnToStatus.linkedinOutreach);
                    setEditingLinkedinOutreach(null);
                    setIsLinkedinOutreachModalOpen(true);
                  }}
                >
                  {filteredLinkedinOutreachColumns.linkedinOutreach.map(card => (
                    <SortableLinkedinOutreachCard 
                      key={card.id} 
                      card={card}
                      activeLinkedinOutreachId={activeLinkedinOutreachId}
                      setEditingLinkedinOutreach={setEditingLinkedinOutreach}
                      setIsLinkedinOutreachModalOpen={setIsLinkedinOutreachModalOpen}
                      setIsDeletingLinkedinOutreach={setIsDeletingLinkedinOutreach}
                      isDraggingLinkedinOutreachRef={isDraggingLinkedinOutreachRef}
                    />
                  ))}
                </DroppableColumn>
              </SortableContext>
            </div>
          </div>
          <DragOverlay>
            {activeLinkedinOutreachId ? (() => {
              const col = getLinkedinOutreachColumnOfItem(activeLinkedinOutreachId);
              if (!col) return null;
              const card = linkedinOutreachColumns[col].find(c => String(c.id) === activeLinkedinOutreachId);
              if (!card) return null;
              return (
                <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3">
                  <div className="text-white font-medium mb-1">{card.name}</div>
                  <div className="text-gray-400 text-xs mb-1">{card.company}</div>
                  <div className="text-xs text-yellow-400">
                    {(() => {
                      const date = new Date(card.dateCreated);
                      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      return `${monthNames[date.getUTCMonth()]} ${date.getUTCDate()}`;
                    })()}
                  </div>
                </div>
              );
            })() : null}
          </DragOverlay>
        </DndContext>
      )}
      
      {/* Create/Edit Modal */}
      {isLinkedinOutreachModalOpen && (
        <LinkedinOutreachModal
          linkedinOutreach={editingLinkedinOutreach}
          defaultStatus={defaultStatus}
          onClose={() => {
            setIsLinkedinOutreachModalOpen(false);
            setEditingLinkedinOutreach(null);
            setDefaultStatus(undefined);
          }}
          onSave={async (data: Partial<LinkedinOutreach>) => {
            try {
              const url = userIdParam ? `/api/linkedin_outreach?userId=${userIdParam}` : '/api/linkedin_outreach';
              let updatedOutreach: LinkedinOutreach;
              if (editingLinkedinOutreach) {
                const response = await fetch(url, {
                  method: 'PUT',
                  headers: getApiHeaders(),
                  body: JSON.stringify({ ...data, id: editingLinkedinOutreach.id }),
                });
                if (!response.ok) throw new Error('Failed to update LinkedIn outreach entry');
                updatedOutreach = await response.json() as LinkedinOutreach;
                
                // Optimistically update the state immediately
                setLinkedinOutreachColumns(prev => {
                  const newColumns = { ...prev };
                  const targetColumn = linkedinOutreachStatusToColumn[updatedOutreach.status] ?? 'outreach';
                  
                  // Find the old item's column and index
                  let oldColumn: LinkedinOutreachColumnId | null = null;
                  let oldIndex = -1;
                  Object.keys(newColumns).forEach(colId => {
                    const col = colId as LinkedinOutreachColumnId;
                    const index = newColumns[col].findIndex(outreach => outreach.id === editingLinkedinOutreach.id);
                    if (index !== -1) {
                      oldColumn = col;
                      oldIndex = index;
                    }
                  });
                  
                  if (oldColumn !== null && oldIndex !== -1) {
                    // Create a new object reference to ensure React detects the change
                    const updatedCard = { ...updatedOutreach };
                    if (oldColumn === targetColumn) {
                      // Same column: update in place
                      newColumns[targetColumn] = [
                        ...newColumns[targetColumn].slice(0, oldIndex),
                        updatedCard,
                        ...newColumns[targetColumn].slice(oldIndex + 1)
                      ];
                    } else {
                      // Different column: remove from old, add to new
                      // Use type assertion to help TypeScript understand oldColumn is not null here
                      const sourceColumn = oldColumn as LinkedinOutreachColumnId;
                      const sourceArray = newColumns[sourceColumn];
                      newColumns[sourceColumn] = [
                        ...sourceArray.slice(0, oldIndex),
                        ...sourceArray.slice(oldIndex + 1)
                      ];
                      newColumns[targetColumn] = [...newColumns[targetColumn], updatedCard];
                    }
                  } else {
                    // Not found (shouldn't happen), just add to target column
                    const updatedCard = { ...updatedOutreach };
                    newColumns[targetColumn] = [...newColumns[targetColumn], updatedCard];
                  }
                  
                  return newColumns;
                });
              } else {
                const response = await fetch(url, {
                  method: 'POST',
                  headers: getApiHeaders(),
                  body: JSON.stringify(data),
                });
                if (!response.ok) throw new Error('Failed to create LinkedIn outreach entry');
                updatedOutreach = await response.json() as LinkedinOutreach;
                
                // Optimistically update the state immediately
                setLinkedinOutreachColumns(prev => {
                  const newColumns = { ...prev };
                  const targetColumn = linkedinOutreachStatusToColumn[updatedOutreach.status] ?? 'outreach';
                  newColumns[targetColumn] = [...newColumns[targetColumn], updatedOutreach];
                  return newColumns;
                });
              }
              setIsLinkedinOutreachModalOpen(false);
              setEditingLinkedinOutreach(null);
              // No need to refetch - we already have the updated item from the API response
              // The optimistic update is sufficient since we're using the server's response data
            } catch (error) {
              console.error('Error saving LinkedIn outreach entry:', error);
              alert('Failed to save coffee chat. Please try again.');
              // Refresh data on error to restore correct state
              await fetchLinkedinOutreach();
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeletingLinkedinOutreach !== null && (
        <DeleteModal
          onConfirm={async () => {
            try {
              const url = userIdParam ? `/api/linkedin_outreach?id=${isDeletingLinkedinOutreach}&userId=${userIdParam}` : `/api/linkedin_outreach?id=${isDeletingLinkedinOutreach}`;
              const response = await fetch(url, {
                method: 'DELETE',
              });
              if (!response.ok) throw new Error('Failed to delete LinkedIn outreach entry');
              await fetchLinkedinOutreach();
              setIsDeletingLinkedinOutreach(null);
            } catch (error) {
              console.error('Error deleting LinkedIn outreach entry:', error);
              alert('Failed to delete coffee chat. Please try again.');
              setIsDeletingLinkedinOutreach(null);
            }
          }}
          onCancel={() => setIsDeletingLinkedinOutreach(null)}
        />
      )}
    </section>
  );
}

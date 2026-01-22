'use client';

import React, { useState, useEffect } from 'react';
import { getApiHeaders } from '@/app/lib/api-helpers';
import { Plus, Trash2, X, ChevronDown } from 'lucide-react';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { OpenSourceEntry, OpenSourceColumnId, BoardTimeFilter, OpenSourceStatus } from './types';
import { openSourceStatusToColumn } from './types';
import { DroppableColumn, DeleteModal, formatModalDate, toLocalDateString } from './shared';
import partnershipsData from '@/partnerships/partnerships.json';

// ===== DATE FIELD EDITING TOGGLE START =====
const ENABLE_DATE_FIELD_EDITING = false;
// ===== DATE FIELD EDITING TOGGLE END =====

type OpenSourceTabProps = {
  filteredOpenSourceColumns: Record<OpenSourceColumnId, OpenSourceEntry[]>;
  openSourceColumns: Record<OpenSourceColumnId, OpenSourceEntry[]>;
  setOpenSourceColumns: React.Dispatch<React.SetStateAction<Record<OpenSourceColumnId, OpenSourceEntry[]>>>;
  isLoading: boolean;
  openSourceFilter: BoardTimeFilter;
  setOpenSourceFilter: (filter: BoardTimeFilter) => void;
  setIsModalOpen: (open: boolean) => void;
  setEditingEntry: (entry: OpenSourceEntry | null) => void;
  sensors: any;
  handleOpenSourceDragStart: (event: any) => void;
  handleOpenSourceDragOver: (event: any) => void;
  handleOpenSourceDragEnd: (event: any) => void;
  activeOpenSourceId: string | null;
  getOpenSourceColumnOfItem: (id: string) => OpenSourceColumnId | null;
  isModalOpen: boolean;
  editingEntry: OpenSourceEntry | null;
  setIsDeleting: (id: number | null) => void;
  isDeleting: number | null;
  fetchOpenSourceEntries: () => Promise<void>;
  userIdParam: string | null;
  selectedPartnership: string | null;
  setSelectedPartnership: (name: string | null) => void;
};

function SortableOpenSourceCard(props: { 
  card: OpenSourceEntry;
  activeOpenSourceId: string | null;
  setEditingEntry: (entry: OpenSourceEntry) => void;
  setIsModalOpen: (open: boolean) => void;
  setIsDeleting: (id: number) => void;
  isDraggingOpenSourceRef: React.MutableRefObject<boolean>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(props.card.id) });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : undefined,
  } as React.CSSProperties;

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging || props.isDraggingOpenSourceRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (props.activeOpenSourceId === String(props.card.id)) {
      return;
    }
    setTimeout(() => {
      if (!props.isDraggingOpenSourceRef.current && !isDragging && props.activeOpenSourceId !== String(props.card.id)) {
        props.setEditingEntry(props.card);
        props.setIsModalOpen(true);
      }
    }, 50);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    props.setIsDeleting(props.card.id);
  };

  return (
    <div 
      ref={setNodeRef} 
      style={{ ...style, touchAction: 'none' }} 
      {...attributes} 
      {...listeners}
      onClick={handleClick}
      className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-pointer hover:border-electric-blue transition-colors group relative"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="text-white font-medium mb-1">{props.card.title || 'Untitled'}</div>
          <div className="text-gray-400 text-xs mb-1">Partnership: {props.card.partnershipName}</div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleDelete}
            className="p-1 hover:bg-red-600 rounded text-gray-300 hover:text-white"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {props.card.description && (
        <div className="text-gray-300 text-xs mb-2 line-clamp-2">{props.card.description}</div>
      )}
    </div>
  );
}

// OpenSource Modal Component
function OpenSourceModal({ 
  entry, 
  onClose, 
  onSave,
  onDelete,
  selectedPartnership
}: { 
  entry: OpenSourceEntry | null; 
  onClose: () => void; 
  onSave: (data: Partial<OpenSourceEntry>) => void;
  onDelete?: () => void;
  selectedPartnership: string | null;
}) {

  type OpenSourceFormData = {
    partnershipName: string;
    title: string;
    description: string;
    url: string;
    notes: string;
    status: OpenSourceStatus;
    dateCreated: string;
    dateModified: string;
  };

  const [formData, setFormData] = useState<OpenSourceFormData>({
    partnershipName: entry?.partnershipName || selectedPartnership || '',
    title: entry?.title || '',
    description: entry?.description || '',
    url: entry?.url || '',
    notes: entry?.notes || '',
    status: entry?.status || 'plan',
    dateCreated: entry?.dateCreated ? toLocalDateString(entry.dateCreated) : '',
    dateModified: entry?.dateModified ? toLocalDateString(entry.dateModified) : '',
  });

  useEffect(() => {
    if (entry) {
      setFormData({
        partnershipName: entry.partnershipName || '',
        title: entry.title || '',
        description: entry.description || '',
        url: entry.url || '',
        notes: entry.notes || '',
        status: entry.status ?? 'plan',
        dateCreated: entry.dateCreated ? toLocalDateString(entry.dateCreated) : '',
        dateModified: entry.dateModified ? toLocalDateString(entry.dateModified) : '',
      });
    } else {
      setFormData({
        partnershipName: selectedPartnership || '',
        title: '',
        description: '',
        url: '',
        notes: '',
        status: 'plan',
        dateCreated: '',
        dateModified: '',
      });
    }
  }, [entry, selectedPartnership]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partnershipName.trim()) {
      alert('Partnership name is required');
      return;
    }
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }
    const { dateCreated, dateModified, ...restFormData } = formData;
    const submitData: Partial<OpenSourceEntry> = { 
      ...restFormData,
    };
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

  const partnershipNames = partnershipsData.partnerships.map(p => p.name);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">
            {entry ? 'Edit Open Source Entry' : 'Create New Open Source Entry'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white font-semibold mb-2">Partnership *</label>
            <select
              value={formData.partnershipName}
              onChange={(e) => setFormData({ ...formData, partnershipName: e.target.value })}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
              required
            >
              <option value="">Select a partnership</option>
              {partnershipNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400"
              placeholder="Enter title"
              required
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400 min-h-[80px]"
              placeholder="Enter description"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">URL</label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400 min-h-[80px]"
              placeholder="Enter notes"
            />
          </div>

          {ENABLE_DATE_FIELD_EDITING && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {entry && (
            <div className="text-xs text-gray-400 pt-2 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <span>Created: {formatModalDate(entry.dateCreated)}</span>
                <span>Modified: {formatModalDate(entry.dateModified)}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between sm:justify-end gap-3 pt-4">
            {entry && onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onDelete();
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors md:hidden order-3 sm:order-1"
              >
                <Trash2 className="inline mr-2 w-4 h-4" />Delete
              </button>
            )}
            <div className="flex gap-3 order-1 sm:order-2">
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
                {entry ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OpenSourceTab({
  filteredOpenSourceColumns,
  openSourceColumns,
  setOpenSourceColumns,
  isLoading,
  openSourceFilter,
  setOpenSourceFilter,
  setIsModalOpen,
  setEditingEntry,
  sensors,
  handleOpenSourceDragStart,
  handleOpenSourceDragOver,
  handleOpenSourceDragEnd,
  activeOpenSourceId,
  getOpenSourceColumnOfItem,
  isModalOpen,
  editingEntry,
  setIsDeleting,
  isDeleting,
  fetchOpenSourceEntries,
  isDraggingOpenSourceRef,
  userIdParam,
  selectedPartnership,
  setSelectedPartnership,
}: OpenSourceTabProps & { isDraggingOpenSourceRef: React.MutableRefObject<boolean> }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const partnershipNames = partnershipsData.partnerships.map(p => p.name);

  return (
    <section className="bg-gray-800 border border-light-steel-blue rounded-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4 mb-6">
        <h4 className="text-xl font-bold text-white">Open Source Contributions</h4>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span>Show:</span>
          <button
            onClick={() => setOpenSourceFilter('modifiedThisMonth')}
            className={`px-3 py-1 rounded-md border transition-colors ${
              openSourceFilter === 'modifiedThisMonth'
                ? 'bg-electric-blue text-white border-electric-blue'
                : 'bg-gray-700 text-gray-300 border-transparent hover:border-light-steel-blue'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setOpenSourceFilter('allTime')}
            className={`px-3 py-1 rounded-md border transition-colors ${
              openSourceFilter === 'allTime'
                ? 'bg-electric-blue text-white border-electric-blue'
                : 'bg-gray-700 text-gray-300 border-transparent hover:border-light-steel-blue'
            }`}
          >
            All Time
          </button>
        </div>
        <button 
          onClick={() => {
            setEditingEntry(null);
            setIsModalOpen(true);
          }}
          className="bg-electric-blue hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold transition-colors flex items-center text-sm sm:text-base"
        >
          <Plus className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />Add Entry
        </button>
      </div>

      {/* Partnership Dropdown */}
      <div className="mb-6">
        <label className="block text-white font-semibold mb-2">Filter by Partnership</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full sm:w-auto min-w-[200px] bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white flex items-center justify-between hover:border-electric-blue transition-colors"
          >
            <span>{selectedPartnership || 'All Partnerships'}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {isDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute z-20 mt-1 w-full sm:w-auto min-w-[200px] bg-gray-700 border border-light-steel-blue rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedPartnership(null);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-600 transition-colors ${
                    selectedPartnership === null ? 'bg-gray-600 text-electric-blue' : 'text-white'
                  }`}
                >
                  All Partnerships
                </button>
                {partnershipNames.map(name => (
                  <button
                    key={name}
                    onClick={() => {
                      setSelectedPartnership(name);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-600 transition-colors ${
                      selectedPartnership === name ? 'bg-gray-600 text-electric-blue' : 'text-white'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading open source entries...</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleOpenSourceDragStart} onDragOver={handleOpenSourceDragOver} onDragEnd={handleOpenSourceDragEnd}>
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="grid grid-cols-5 gap-3 min-w-[800px]">
              <div className="bg-gray-700 rounded-lg p-2">
                <h5 className="text-white font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  Plan ({filteredOpenSourceColumns.plan.length})
                </h5>
                <SortableContext items={filteredOpenSourceColumns.plan.map(c => c.id)} strategy={rectSortingStrategy}>
                  <DroppableColumn 
                    id="plan"
                    onAddCard={() => {
                      setEditingEntry(null);
                      setIsModalOpen(true);
                    }}
                    hasCardsToRight={
                      filteredOpenSourceColumns.babyStep.length > 0 ||
                      filteredOpenSourceColumns.inProgress.length > 0 ||
                      filteredOpenSourceColumns.done.length > 0
                    }
                  >
                    {filteredOpenSourceColumns.plan.map(card => (
                      <SortableOpenSourceCard 
                        key={card.id} 
                        card={card}
                        activeOpenSourceId={activeOpenSourceId}
                        setEditingEntry={setEditingEntry}
                        setIsModalOpen={setIsModalOpen}
                        setIsDeleting={setIsDeleting}
                        isDraggingOpenSourceRef={isDraggingOpenSourceRef}
                      />
                    ))}
                  </DroppableColumn>
                </SortableContext>
              </div>

              <div className="bg-gray-700 rounded-lg p-2">
                <h5 className="text-white font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  Baby Step ({filteredOpenSourceColumns.babyStep.length})
                </h5>
                <SortableContext items={filteredOpenSourceColumns.babyStep.map(c => c.id)} strategy={rectSortingStrategy}>
                  <DroppableColumn 
                    id="babyStep"
                    hasCardsToRight={
                      filteredOpenSourceColumns.inProgress.length > 0 ||
                      filteredOpenSourceColumns.done.length > 0
                    }
                  >
                    {filteredOpenSourceColumns.babyStep.map(card => (
                      <SortableOpenSourceCard 
                        key={card.id} 
                        card={card}
                        activeOpenSourceId={activeOpenSourceId}
                        setEditingEntry={setEditingEntry}
                        setIsModalOpen={setIsModalOpen}
                        setIsDeleting={setIsDeleting}
                        isDraggingOpenSourceRef={isDraggingOpenSourceRef}
                      />
                    ))}
                  </DroppableColumn>
                </SortableContext>
              </div>

              <div className="bg-gray-700 rounded-lg p-2">
                <h5 className="text-white font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                  In Progress ({filteredOpenSourceColumns.inProgress.length})
                </h5>
                <SortableContext items={filteredOpenSourceColumns.inProgress.map(c => c.id)} strategy={rectSortingStrategy}>
                  <DroppableColumn 
                    id="inProgress"
                    hasCardsToRight={filteredOpenSourceColumns.done.length > 0}
                  >
                    {filteredOpenSourceColumns.inProgress.map(card => (
                      <SortableOpenSourceCard 
                        key={card.id} 
                        card={card}
                        activeOpenSourceId={activeOpenSourceId}
                        setEditingEntry={setEditingEntry}
                        setIsModalOpen={setIsModalOpen}
                        setIsDeleting={setIsDeleting}
                        isDraggingOpenSourceRef={isDraggingOpenSourceRef}
                      />
                    ))}
                  </DroppableColumn>
                </SortableContext>
              </div>

              <div className="bg-gray-700 rounded-lg p-2">
                <h5 className="text-white font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  Done ({filteredOpenSourceColumns.done.length})
                </h5>
                <SortableContext items={filteredOpenSourceColumns.done.map(c => c.id)} strategy={rectSortingStrategy}>
                  <DroppableColumn 
                    id="done"
                    hasCardsToRight={false}
                  >
                    {filteredOpenSourceColumns.done.map(card => (
                      <SortableOpenSourceCard 
                        key={card.id} 
                        card={card}
                        activeOpenSourceId={activeOpenSourceId}
                        setEditingEntry={setEditingEntry}
                        setIsModalOpen={setIsModalOpen}
                        setIsDeleting={setIsDeleting}
                        isDraggingOpenSourceRef={isDraggingOpenSourceRef}
                      />
                    ))}
                  </DroppableColumn>
                </SortableContext>
              </div>

              {/* Progress Column - Stats Only */}
              <div className="bg-gray-700 rounded-lg p-2">
                <h5 className="text-white font-semibold mb-4 flex items-center">
                  <div className="w-3 h-3 bg-electric-blue rounded-full mr-2"></div>
                  Progress
                </h5>
                <div className="space-y-4">
                  <div className="text-white">
                    <div className="text-sm text-gray-400 mb-1">Total Entries</div>
                    <div className="text-2xl font-bold">
                      {filteredOpenSourceColumns.plan.length + 
                       filteredOpenSourceColumns.babyStep.length + 
                       filteredOpenSourceColumns.inProgress.length + 
                       filteredOpenSourceColumns.done.length}
                    </div>
                  </div>
                  <div className="text-white">
                    <div className="text-sm text-gray-400 mb-1">Completed</div>
                    <div className="text-2xl font-bold text-green-400">
                      {filteredOpenSourceColumns.done.length}
                    </div>
                  </div>
                  <div className="text-white">
                    <div className="text-sm text-gray-400 mb-1">In Progress</div>
                    <div className="text-2xl font-bold text-purple-400">
                      {filteredOpenSourceColumns.inProgress.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DragOverlay style={{ touchAction: 'none' }}>
            {activeOpenSourceId ? (() => {
              const col = getOpenSourceColumnOfItem(activeOpenSourceId);
              if (!col) return null;
              const card = openSourceColumns[col].find(c => String(c.id) === activeOpenSourceId);
              if (!card) return null;
              return (
                <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3" style={{ touchAction: 'none' }}>
                  <div className="text-white font-medium mb-1">{card.title || 'Untitled'}</div>
                  <div className="text-gray-400 text-xs mb-1">Partnership: {card.partnershipName}</div>
                </div>
              );
            })() : null}
          </DragOverlay>
        </DndContext>
      )}
      
      {/* Create/Edit Modal */}
      {isModalOpen && (
        <OpenSourceModal
          entry={editingEntry}
          onClose={() => {
            setIsModalOpen(false);
            setEditingEntry(null);
          }}
          onDelete={() => {
            if (editingEntry) {
              setIsModalOpen(false);
              setIsDeleting(editingEntry.id);
            }
          }}
          onSave={async (data: Partial<OpenSourceEntry>) => {
            try {
              // TODO: Replace with actual API endpoint when available
              const url = userIdParam ? `/api/open_source?userId=${userIdParam}` : '/api/open_source';
              let updatedEntry: OpenSourceEntry;
              if (editingEntry) {
                const response = await fetch(url, {
                  method: 'PUT',
                  headers: getApiHeaders(),
                  body: JSON.stringify({ ...data, id: editingEntry.id }),
                });
                if (!response.ok) throw new Error('Failed to update open source entry');
                updatedEntry = await response.json() as OpenSourceEntry;
                
                setOpenSourceColumns(prev => {
                  const newColumns: Record<OpenSourceColumnId, OpenSourceEntry[]> = {
                    plan: [...prev.plan],
                    babyStep: [...prev.babyStep],
                    inProgress: [...prev.inProgress],
                    done: [...prev.done],
                  };
                  const targetColumn = openSourceStatusToColumn[updatedEntry.status] || 'plan';
                  
                  let oldColumn: OpenSourceColumnId | null = null;
                  let oldIndex = -1;
                  Object.keys(newColumns).forEach(colId => {
                    const col = colId as OpenSourceColumnId;
                    const index = newColumns[col].findIndex(entry => entry.id === editingEntry.id);
                    if (index !== -1) {
                      oldColumn = col;
                      oldIndex = index;
                    }
                  });
                  
                  if (oldColumn !== null && oldIndex !== -1) {
                    const updatedCard: OpenSourceEntry = { ...updatedEntry };
                    if (oldColumn === targetColumn) {
                      newColumns[targetColumn] = [
                        ...newColumns[targetColumn].slice(0, oldIndex),
                        updatedCard,
                        ...newColumns[targetColumn].slice(oldIndex + 1)
                      ];
                    } else {
                      const sourceColumn = oldColumn as OpenSourceColumnId;
                      const sourceArray = newColumns[sourceColumn];
                      newColumns[sourceColumn] = [
                        ...sourceArray.slice(0, oldIndex),
                        ...sourceArray.slice(oldIndex + 1)
                      ];
                      newColumns[targetColumn] = [...newColumns[targetColumn], updatedCard];
                    }
                  } else {
                    const updatedCard: OpenSourceEntry = { ...updatedEntry };
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
                if (!response.ok) throw new Error('Failed to create open source entry');
                const responseData = await response.json();
                updatedEntry = (responseData.entry || responseData) as OpenSourceEntry;
                
                setOpenSourceColumns(prev => {
                  const newColumns: Record<OpenSourceColumnId, OpenSourceEntry[]> = {
                    plan: [...prev.plan],
                    babyStep: [...prev.babyStep],
                    inProgress: [...prev.inProgress],
                    done: [...prev.done],
                  };
                  const targetColumn = openSourceStatusToColumn[updatedEntry.status] || 'plan';
                  const newCard: OpenSourceEntry = { ...updatedEntry };
                  newColumns[targetColumn] = [...newColumns[targetColumn], newCard];
                  return newColumns;
                });
              }
              setIsModalOpen(false);
              setEditingEntry(null);
            } catch (error) {
              console.error('Error saving open source entry:', error);
              alert('Failed to save open source entry. Please try again.');
              await fetchOpenSourceEntries();
            }
          }}
          selectedPartnership={selectedPartnership}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleting !== null && (
        <DeleteModal
          onConfirm={async () => {
            try {
              // TODO: Replace with actual API endpoint when available
              const url = userIdParam ? `/api/open_source?id=${isDeleting}&userId=${userIdParam}` : `/api/open_source?id=${isDeleting}`;
              const response = await fetch(url, {
                method: 'DELETE',
              });
              if (!response.ok) throw new Error('Failed to delete open source entry');
              await fetchOpenSourceEntries();
              setIsDeleting(null);
            } catch (error) {
              console.error('Error deleting open source entry:', error);
              alert('Failed to delete open source entry. Please try again.');
              setIsDeleting(null);
            }
          }}
          onCancel={() => setIsDeleting(null)}
        />
      )}
    </section>
  );
}

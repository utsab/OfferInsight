'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getApiHeaders } from '@/app/lib/api-helpers';

import { Plus, Trash2, X } from 'lucide-react';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { LeetEntry, LeetColumnId, BoardTimeFilter, LeetStatus } from './types';
import { leetStatusToColumn, leetColumnToStatus } from './types';
import { DroppableColumn, DeleteModal, formatModalDate, toLocalDateString } from './shared';

// ===== DATE FIELD EDITING TOGGLE START =====
// Toggle this flag to enable editing dateCreated and dateModified in create/edit modals for testing and debugging.
const ENABLE_DATE_FIELD_EDITING = false;
// ===== DATE FIELD EDITING TOGGLE END =====

// Helper function to get difficulty badge styling
const getDifficultyBadgeClass = (difficulty: string | null | undefined): string => {
  if (!difficulty) return '';
  const diff = difficulty.toLowerCase();
  if (diff === 'easy') {
    return 'bg-cyan-500 text-gray-900';
  } else if (diff === 'medium') {
    return 'bg-yellow-500 text-gray-900';
  } else if (diff === 'hard') {
    return 'bg-pink-500 text-gray-900';
  }
  return 'bg-gray-500 text-white';
};

type LeetCodeTabProps = {
  filteredLeetColumns: Record<LeetColumnId, LeetEntry[]>;
  leetColumns: Record<LeetColumnId, LeetEntry[]>;
  setLeetColumns: React.Dispatch<React.SetStateAction<Record<LeetColumnId, LeetEntry[]>>>;
  isLoadingLeet: boolean;
  leetFilter: BoardTimeFilter;
  setLeetFilter: (filter: BoardTimeFilter) => void;
  setIsLeetModalOpen: (open: boolean) => void;
  setEditingLeet: (entry: LeetEntry | null) => void;
  sensors: any;
  handleLeetDragStart: (event: any) => void;
  handleLeetDragOver: (event: any) => void;
  handleLeetDragEnd: (event: any) => void;
  activeLeetId: string | null;
  getLeetColumnOfItem: (id: string) => LeetColumnId | null;
  isLeetModalOpen: boolean;
  editingLeet: LeetEntry | null;
  setIsDeletingLeet: (id: number | null) => void;
  isDeletingLeet: number | null;
  fetchLeetEntries: () => Promise<void>;
  isDraggingLeetRef: React.MutableRefObject<boolean>;
  userIdParam: string | null;
};

function SortableLeetCard(props: { 
  card: LeetEntry;
  activeLeetId: string | null;
  setEditingLeet: (entry: LeetEntry) => void;
  setIsLeetModalOpen: (open: boolean) => void;
  setIsDeletingLeet: (id: number) => void;
  isDraggingLeetRef: React.MutableRefObject<boolean>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(props.card.id) });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : undefined,
  } as React.CSSProperties;

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click during drag
    if (isDragging || props.isDraggingLeetRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (props.activeLeetId === String(props.card.id)) {
      return;
    }
    setTimeout(() => {
      if (!props.isDraggingLeetRef.current && !isDragging && props.activeLeetId !== String(props.card.id)) {
        props.setEditingLeet(props.card);
        props.setIsLeetModalOpen(true);
      }
    }, 50);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    props.setIsDeletingLeet(props.card.id);
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
          <div className="text-white font-medium mb-1">{props.card.problem?.trim() || 'Untitled Problem'}</div>
          <div className="text-gray-400 text-xs mb-1">
            {props.card.problemType ? props.card.problemType : '—'}
          </div>
          {props.card.difficulty && (
            <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${getDifficultyBadgeClass(props.card.difficulty)} uppercase tracking-wide font-semibold`}>
              {props.card.difficulty}
            </span>
          )}
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
      {props.card.url && (
        <div className="text-gray-500 text-xs mb-2">
          <a
            href={props.card.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="hover:text-electric-blue underline"
          >
            Problem Link
          </a>
        </div>
      )}
      {props.card.reflection && (
        <div className="text-gray-400 text-xs mb-2 line-clamp-3">{props.card.reflection}</div>
      )}
    </div>
  );
}

function LeetModal({
  entry,
  onClose,
  onSave,
  defaultStatus,
  onDelete
}: {
  entry: LeetEntry | null;
  onClose: () => void;
  onSave: (data: Partial<LeetEntry>) => void;
  defaultStatus?: LeetStatus;
  onDelete?: () => void;
}) {

  type LeetFormData = {
    problem: string;
    problemType: string;
    difficulty: string;
    url: string;
    reflection: string;
    status: LeetStatus;
    dateCreated: string; // ===== DATE FIELD EDITING: Added for testing/debugging =====
    dateModified: string; // ===== DATE FIELD EDITING: Added for testing/debugging =====
  };

  const [formData, setFormData] = useState<LeetFormData>({
    problem: entry?.problem ?? '',
    problemType: entry?.problemType ?? '',
    difficulty: entry?.difficulty ?? 'Easy',
    url: entry?.url ?? '',
    reflection: entry?.reflection ?? '',
    status: entry?.status ?? (defaultStatus || 'planned'),
    dateCreated: entry?.dateCreated ? toLocalDateString(entry.dateCreated) : '', // ===== DATE FIELD EDITING =====
    dateModified: entry?.dateModified ? toLocalDateString(entry.dateModified) : '', // ===== DATE FIELD EDITING =====
  });
  const [isLeetHelpOpen, setIsLeetHelpOpen] = useState(false);
  const tooltipRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!isLeetHelpOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsLeetHelpOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLeetHelpOpen]);

  // ===== DATE FIELD EDITING: Update form data when entry changes =====
  useEffect(() => {
    if (entry) {
      setFormData({
        problem: entry.problem ?? '',
        problemType: entry.problemType ?? '',
        difficulty: entry.difficulty ?? 'Easy',
        url: entry.url ?? '',
        reflection: entry.reflection ?? '',
        status: entry.status ?? 'planned',
        dateCreated: entry.dateCreated ? toLocalDateString(entry.dateCreated) : '',
        dateModified: entry.dateModified ? toLocalDateString(entry.dateModified) : '',
      });
    } else {
      setFormData({
        problem: '',
        problemType: '',
        difficulty: 'Easy',
        url: '',
        reflection: '',
        status: defaultStatus || 'planned',
        dateCreated: '',
        dateModified: '',
      });
    }
  }, [entry, defaultStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.problem.trim()) {
      alert('Problem name is required');
      return;
    }

    // ===== DATE FIELD EDITING: Convert date strings to ISO DateTime if provided =====
    const submitData: Partial<LeetEntry> = {
      problem: formData.problem.trim(),
      problemType: formData.problemType ? formData.problemType.trim() : null,
      difficulty: formData.difficulty ? formData.difficulty.trim() : null,
      url: formData.url ? formData.url.trim() : null,
      reflection: formData.reflection ? formData.reflection.trim() : null,
      status: formData.status,
    };
    if (ENABLE_DATE_FIELD_EDITING) {
      if (formData.dateCreated) {
        try {
          const date = new Date(formData.dateCreated);
          if (!isNaN(date.getTime())) {
            submitData.dateCreated = date.toISOString();
          }
        } catch (error) {
          console.error('Error parsing dateCreated:', error);
        }
      }
      if (formData.dateModified !== undefined) {
        try {
          if (formData.dateModified) {
            const date = new Date(formData.dateModified);
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
      <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">{entry ? 'Edit Problem' : 'Log New Problem'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white font-semibold mb-2">Problem *</label>
            <input
              type="text"
              value={formData.problem}
              onChange={(e) => setFormData(prev => ({ ...prev, problem: e.target.value }))}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400"
              placeholder="Problem title"
              required
            />
          </div>

          <div>
            <label className={`block font-semibold mb-2 ${entry ? 'text-white' : 'text-gray-500'}`}>Problem URL</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              disabled={!entry}
              className={`w-full border rounded-lg px-4 py-2 placeholder-gray-400 ${
                entry 
                  ? 'bg-gray-700 border-light-steel-blue text-white' 
                  : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'
              }`}
              placeholder="https://leetcode.com/problems/..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block font-semibold mb-2 ${entry ? 'text-white' : 'text-gray-500'}`}>
                <span className="flex items-center gap-2">
                  Data Structure / Algorithm
                  {entry && (
                    <span ref={tooltipRef} className="relative inline-flex items-center">
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setIsLeetHelpOpen((prev: boolean) => !prev)}
                        onFocus={() => setIsLeetHelpOpen(true)}
                        onBlur={() => setIsLeetHelpOpen(false)}
                        className="w-4 h-4 flex items-center justify-center rounded-full bg-electric-blue text-gray-900 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-electric-blue/60"
                        aria-label="What data structure or algorithm was used?"
                      >
                        ?
                      </button>
                      {isLeetHelpOpen && (
                        <div className="absolute left-1/2 -translate-x-1/2 mt-3 w-72 px-3 py-2 rounded-lg bg-gray-900 text-white text-xs shadow-lg z-10">
                          What data structure, algorithm, or other problem solving technique was needed to solve this problem?
                        </div>
                      )}
                    </span>
                  )}
                </span>
              </label>
              <input
                type="text"
                value={formData.problemType}
                onChange={(e) => setFormData(prev => ({ ...prev, problemType: e.target.value }))}
                disabled={!entry}
                className={`w-full border rounded-lg px-4 py-2 placeholder-gray-400 ${
                  entry 
                    ? 'bg-gray-700 border-light-steel-blue text-white' 
                    : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'
                }`}
                placeholder="Arrays, DP, Graphs, ..."
              />
            </div>
            <div>
              <label className={`block font-semibold mb-2 ${entry ? 'text-white' : 'text-gray-500'}`}>Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                disabled={!entry}
                className={`w-full border rounded-lg px-4 py-2 ${
                  entry 
                    ? 'bg-gray-700 border-light-steel-blue text-white' 
                    : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'
                }`}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className={`block font-semibold mb-2 ${entry ? 'text-white' : 'text-gray-500'}`}>Signal / Cue</label>
            <textarea
              value={formData.reflection}
              onChange={(e) => setFormData(prev => ({ ...prev, reflection: e.target.value }))}
              disabled={!entry}
              className={`w-full border rounded-lg px-4 py-2 placeholder-gray-400 min-h-[120px] ${
                entry 
                  ? 'bg-gray-700 border-light-steel-blue text-white' 
                  : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'
              }`}
              placeholder="Was there anything in the original problem description that signaled to you that this problem requires the data structure/algorithm you listed above?"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className={`font-semibold whitespace-nowrap ${entry ? 'text-white' : 'text-gray-500'}`}>Status:</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as LeetStatus }))}
              disabled={!entry}
              className={`flex-1 border rounded-lg px-4 py-2 ${
                entry 
                  ? 'bg-gray-700 border-light-steel-blue text-white' 
                  : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'
              }`}
            >
              <option value="planned">Planned</option>
              <option value="solved">Solved</option>
              <option value="reflected">Reflected</option>
            </select>
          </div>

          {/* ===== DATE FIELD EDITING: Show dateCreated and dateModified fields when toggle is enabled ===== */}
          {ENABLE_DATE_FIELD_EDITING && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-semibold mb-2">Date Created (Testing/Debug)</label>
                <input
                  type="date"
                  value={formData.dateCreated}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateCreated: e.target.value }))}
                  className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">Date Modified (Testing/Debug)</label>
                <input
                  type="date"
                  value={formData.dateModified}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateModified: e.target.value }))}
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

export default function LeetCodeTab({
  filteredLeetColumns,
  leetColumns,
  setLeetColumns,
  isLoadingLeet,
  leetFilter,
  setLeetFilter,
  setIsLeetModalOpen,
  setEditingLeet,
  sensors,
  handleLeetDragStart,
  handleLeetDragOver,
  handleLeetDragEnd,
  activeLeetId,
  getLeetColumnOfItem,
  isLeetModalOpen,
  editingLeet,
  setIsDeletingLeet,
  isDeletingLeet,
  fetchLeetEntries,
  isDraggingLeetRef,
  userIdParam,
}: LeetCodeTabProps) {
  const [defaultStatus, setDefaultStatus] = React.useState<LeetStatus | undefined>(undefined);
  
  return (
    <section className="bg-gray-800 border border-light-steel-blue rounded-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4 mb-6">
        <h4 className="text-xl font-bold text-white">LeetCode Progress</h4>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span>Show:</span>
          <button
            onClick={() => setLeetFilter('modifiedThisMonth')}
            className={`px-3 py-1 rounded-md border transition-colors ${
              leetFilter === 'modifiedThisMonth'
                ? 'bg-electric-blue text-white border-electric-blue'
                : 'bg-gray-700 text-gray-300 border-transparent hover:border-light-steel-blue'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setLeetFilter('allTime')}
            className={`px-3 py-1 rounded-md border transition-colors ${
              leetFilter === 'allTime'
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
            setEditingLeet(null);
            setIsLeetModalOpen(true);
          }}
          className="bg-electric-blue hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold transition-colors flex items-center text-sm sm:text-base w-full sm:w-auto"
        >
          <Plus className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />Log Practice
        </button>
      </div>
      {isLoadingLeet ? (
        <div className="text-center py-8 text-gray-400">Loading problems...</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleLeetDragStart} onDragOver={handleLeetDragOver} onDragEnd={handleLeetDragEnd}>
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="grid grid-cols-3 gap-6 min-w-[480px]">
            <div className="bg-gray-700 rounded-lg p-4">
              <h5 className="text-white font-semibold mb-4 flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                Planned ({filteredLeetColumns.planned.length})
              </h5>
              <SortableContext items={filteredLeetColumns.planned.map(entry => String(entry.id))} strategy={rectSortingStrategy}>
                <DroppableColumn 
                  id="planned"
                  onAddCard={() => {
                    setDefaultStatus(leetColumnToStatus.planned);
                    setEditingLeet(null);
                    setIsLeetModalOpen(true);
                  }}
                >
                  {filteredLeetColumns.planned.map(entry => (
                    <SortableLeetCard 
                      key={entry.id} 
                      card={entry}
                      activeLeetId={activeLeetId}
                      setEditingLeet={setEditingLeet}
                      setIsLeetModalOpen={setIsLeetModalOpen}
                      setIsDeletingLeet={setIsDeletingLeet}
                      isDraggingLeetRef={isDraggingLeetRef}
                    />
                  ))}
                </DroppableColumn>
              </SortableContext>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h5 className="text-white font-semibold mb-4 flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                Solved ({filteredLeetColumns.solved.length})
              </h5>
              <SortableContext items={filteredLeetColumns.solved.map(entry => String(entry.id))} strategy={rectSortingStrategy}>
                <DroppableColumn 
                  id="solved"
                >
                  {filteredLeetColumns.solved.map(entry => (
                    <SortableLeetCard 
                      key={entry.id} 
                      card={entry}
                      activeLeetId={activeLeetId}
                      setEditingLeet={setEditingLeet}
                      setIsLeetModalOpen={setIsLeetModalOpen}
                      setIsDeletingLeet={setIsDeletingLeet}
                      isDraggingLeetRef={isDraggingLeetRef}
                    />
                  ))}
                </DroppableColumn>
              </SortableContext>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h5 className="text-white font-semibold mb-4 flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                Reflected ({filteredLeetColumns.reflected.length})
              </h5>
              <SortableContext items={filteredLeetColumns.reflected.map(entry => String(entry.id))} strategy={rectSortingStrategy}>
                <DroppableColumn 
                  id="reflected"
                >
                  {filteredLeetColumns.reflected.map(entry => (
                    <SortableLeetCard 
                      key={entry.id} 
                      card={entry}
                      activeLeetId={activeLeetId}
                      setEditingLeet={setEditingLeet}
                      setIsLeetModalOpen={setIsLeetModalOpen}
                      setIsDeletingLeet={setIsDeletingLeet}
                      isDraggingLeetRef={isDraggingLeetRef}
                    />
                  ))}
                </DroppableColumn>
              </SortableContext>
            </div>
          </div>
          </div>
          <DragOverlay style={{ touchAction: 'none' }}>
            {activeLeetId ? (() => {
              const col = getLeetColumnOfItem(activeLeetId);
              if (!col) return null;
              const card = leetColumns[col].find(entry => String(entry.id) === activeLeetId);
              if (!card) return null;
              return (
                <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3" style={{ touchAction: 'none' }}>
                  <div className="text-white font-medium mb-1">{card.problem?.trim() || 'Untitled Problem'}</div>
                  <div className="text-gray-400 text-xs mb-1">{card.problemType || '—'}</div>
                  {card.difficulty && (
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${getDifficultyBadgeClass(card.difficulty)} uppercase tracking-wide font-semibold`}>
                      {card.difficulty}
                    </span>
                  )}
                </div>
              );
            })() : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Create/Edit Modal */}
      {isLeetModalOpen && (
        <LeetModal
          entry={editingLeet}
          defaultStatus={defaultStatus}
          onClose={() => {
            setIsLeetModalOpen(false);
            setEditingLeet(null);
            setDefaultStatus(undefined);
          }}
          onDelete={() => {
            if (editingLeet) {
              setIsLeetModalOpen(false);
              setIsDeletingLeet(editingLeet.id);
            }
          }}
          onSave={async (data: Partial<LeetEntry>) => {
            try {
              const url = userIdParam ? `/api/leetcode?userId=${userIdParam}` : '/api/leetcode';
              let updatedEntry: LeetEntry;
              if (editingLeet) {
                const response = await fetch(url, {
                  method: 'PUT',
                  headers: getApiHeaders(),
                  body: JSON.stringify({ ...data, id: editingLeet.id }),
                });
                if (!response.ok) throw new Error('Failed to update problem');
                updatedEntry = await response.json() as LeetEntry;
                
                // Optimistically update the state immediately
                setLeetColumns(prev => {
                  const newColumns = { ...prev };
                  const targetColumn = leetStatusToColumn[updatedEntry.status] || 'planned';
                  
                  // Find the old item's column and index
                  let oldColumn: LeetColumnId | null = null;
                  let oldIndex = -1;
                  Object.keys(newColumns).forEach(colId => {
                    const col = colId as LeetColumnId;
                    const index = newColumns[col].findIndex(entry => entry.id === editingLeet.id);
                    if (index !== -1) {
                      oldColumn = col;
                      oldIndex = index;
                    }
                  });
                  
                  if (oldColumn !== null && oldIndex !== -1) {
                    // Create a new object reference to ensure React detects the change
                    const updatedCard = { ...updatedEntry };
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
                      const sourceColumn = oldColumn as LeetColumnId;
                      const sourceArray = newColumns[sourceColumn];
                      newColumns[sourceColumn] = [
                        ...sourceArray.slice(0, oldIndex),
                        ...sourceArray.slice(oldIndex + 1)
                      ];
                      newColumns[targetColumn] = [...newColumns[targetColumn], updatedCard];
                    }
                  } else {
                    // Not found (shouldn't happen), just add to target column
                    const updatedCard = { ...updatedEntry };
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
                if (!response.ok) throw new Error('Failed to create problem');
                updatedEntry = await response.json() as LeetEntry;
                
                // Optimistically update the state immediately
                setLeetColumns(prev => {
                  const newColumns = { ...prev };
                  const targetColumn = leetStatusToColumn[updatedEntry.status] || 'planned';
                  newColumns[targetColumn] = [...newColumns[targetColumn], updatedEntry];
                  return newColumns;
                });
              }
              setIsLeetModalOpen(false);
              setEditingLeet(null);
              // No need to refetch - we already have the updated item from the API response
              // The optimistic update is sufficient since we're using the server's response data
            } catch (error) {
              console.error('Error saving LeetCode problem:', error);
              alert('Failed to save problem. Please try again.');
              // Refresh data on error to restore correct state
              await fetchLeetEntries();
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeletingLeet !== null && (
        <DeleteModal
          onConfirm={async () => {
            try {
              const url = userIdParam ? `/api/leetcode?id=${isDeletingLeet}&userId=${userIdParam}` : `/api/leetcode?id=${isDeletingLeet}`;
              const response = await fetch(url, {
                method: 'DELETE',
              });
              if (!response.ok) throw new Error('Failed to delete problem');
              await fetchLeetEntries();
              setIsDeletingLeet(null);
            } catch (error) {
              console.error('Error deleting LeetCode problem:', error);
              alert('Failed to delete problem. Please try again.');
              setIsDeletingLeet(null);
            }
          }}
          onCancel={() => setIsDeletingLeet(null)}
        />
      )}
    </section>
  );
}

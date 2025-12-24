'use client';

import React, { useState, useEffect } from 'react';
import { getApiHeaders } from '@/app/lib/api-helpers';

import { Plus, Trash2, X } from 'lucide-react';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Application, ApplicationColumnId, BoardTimeFilter, ApplicationStatus } from './types';
import { applicationStatusToColumn, applicationColumnToStatus } from './types';
import { CardDateMeta, DroppableColumn, DeleteModal } from './shared';

// ===== DATE FIELD EDITING TOGGLE START =====
// Toggle this flag to enable editing dateCreated and dateModified in create/edit modals for testing and debugging.
const ENABLE_DATE_FIELD_EDITING = false;
// ===== DATE FIELD EDITING TOGGLE END =====

type ApplicationsTabProps = {
  filteredAppColumns: Record<ApplicationColumnId, Application[]>;
  appColumns: Record<ApplicationColumnId, Application[]>;
  setAppColumns: React.Dispatch<React.SetStateAction<Record<ApplicationColumnId, Application[]>>>;
  isLoading: boolean;
  applicationsFilter: BoardTimeFilter;
  setApplicationsFilter: (filter: BoardTimeFilter) => void;
  setIsModalOpen: (open: boolean) => void;
  setEditingApp: (app: Application | null) => void;
  sensors: any;
  handleApplicationsDragStart: (event: any) => void;
  handleApplicationsDragOver: (event: any) => void;
  handleApplicationsDragEnd: (event: any) => void;
  activeAppId: string | null;
  getApplicationColumnOfItem: (id: string) => ApplicationColumnId | null;
  isModalOpen: boolean;
  editingApp: Application | null;
  setIsDeleting: (id: number | null) => void;
  isDeleting: number | null;
  fetchApplications: () => Promise<void>;
  userIdParam: string | null;
};

function SortableAppCard(props: { 
  card: Application;
  activeAppId: string | null;
  setEditingApp: (app: Application) => void;
  setIsModalOpen: (open: boolean) => void;
  setIsDeleting: (id: number) => void;
  isDraggingAppRef: React.MutableRefObject<boolean>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(props.card.id) });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : undefined,
  } as React.CSSProperties;

  const handleClick = (e: React.MouseEvent) => {
    if (props.activeAppId === String(props.card.id)) {
      return;
    }
    setTimeout(() => {
      if (!props.isDraggingAppRef.current && !isDragging && props.activeAppId !== String(props.card.id)) {
        props.setEditingApp(props.card);
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
      style={style} 
      {...attributes} 
      {...listeners}
      onClick={handleClick}
      className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-pointer hover:border-electric-blue transition-colors group relative"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="text-white font-medium mb-1">{props.card.company}</div>
          {props.card.hiringManager && (
            <div className="text-gray-400 text-xs mb-1">HM: {props.card.hiringManager}</div>
          )}
          {props.card.recruiter && (
            <div className="text-gray-400 text-xs mb-1">Recruiter: {props.card.recruiter}</div>
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
      {(props.card.msgToManager || props.card.msgToRecruiter) && (
        <div className="text-green-400 text-xs mb-2">
          {props.card.msgToManager && '✓ Messaged HM'}
          {props.card.msgToManager && props.card.msgToRecruiter && ' • '}
          {props.card.msgToRecruiter && '✓ Messaged Recruiter'}
        </div>
      )}
      {props.card.notes && (
        <div className="text-gray-400 text-xs mb-2 line-clamp-2">{props.card.notes}</div>
      )}
      <CardDateMeta created={props.card.dateCreated} modified={props.card.dateModified} />
    </div>
  );
}

// Application Modal Component
function ApplicationModal({ 
  application, 
  onClose, 
  onSave,
  defaultStatus
}: { 
  application: Application | null; 
  onClose: () => void; 
  onSave: (data: Partial<Application>) => void;
  defaultStatus?: ApplicationStatus;
}) {
  // ===== DATE CREATED EDITING: Helper function to convert ISO date to local date string =====
  const toLocalDate = (value: string) => {
    try {
      const date = new Date(value);
      // Check if fingerprinting is active
      const testDate = new Date('2024-01-01T12:00:00Z');
      const fingerprintingDetected = testDate.getHours() === testDate.getUTCHours() && 
                                      testDate.getHours() === 12;
      
      const year = fingerprintingDetected ? date.getUTCFullYear() : date.getFullYear();
      const month = fingerprintingDetected ? date.getUTCMonth() : date.getMonth();
      const day = fingerprintingDetected ? date.getUTCDate() : date.getDate();
      
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  type ApplicationFormData = {
    company: string;
    hiringManager: string;
    msgToManager: string;
    recruiter: string;
    msgToRecruiter: string;
    notes: string;
    status: ApplicationStatus;
    dateCreated: string; // ===== DATE FIELD EDITING: Added for testing/debugging =====
    dateModified: string; // ===== DATE FIELD EDITING: Added for testing/debugging =====
  };

  const [formData, setFormData] = useState<ApplicationFormData>({
    company: application?.company || '',
    hiringManager: application?.hiringManager || '',
    msgToManager: application?.msgToManager || '',
    recruiter: application?.recruiter || '',
    msgToRecruiter: application?.msgToRecruiter || '',
    notes: application?.notes || '',
    status: application?.status || defaultStatus || 'applied',
    dateCreated: application?.dateCreated ? toLocalDate(application.dateCreated) : '', // ===== DATE FIELD EDITING =====
    dateModified: application?.dateModified ? toLocalDate(application.dateModified) : '', // ===== DATE FIELD EDITING =====
  });

  // Update form data when application changes
  useEffect(() => {
    if (application) {
      setFormData({
        company: application.company || '',
        hiringManager: application.hiringManager || '',
        msgToManager: application.msgToManager || '',
        recruiter: application.recruiter || '',
        msgToRecruiter: application.msgToRecruiter || '',
        notes: application.notes || '',
        status: application.status ?? 'applied',
        dateCreated: application.dateCreated ? toLocalDate(application.dateCreated) : '', // ===== DATE FIELD EDITING =====
        dateModified: application.dateModified ? toLocalDate(application.dateModified) : '', // ===== DATE FIELD EDITING =====
      });
      } else {
      setFormData({
        company: '',
        hiringManager: '',
        msgToManager: '',
        recruiter: '',
        msgToRecruiter: '',
        notes: '',
        status: defaultStatus || 'applied',
        dateCreated: '', // ===== DATE FIELD EDITING =====
        dateModified: '', // ===== DATE FIELD EDITING =====
      });
    }
  }, [application, defaultStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company.trim()) {
      alert('Company name is required');
      return;
    }
    // ===== DATE FIELD EDITING: Convert date strings to ISO DateTime if provided =====
    const { dateCreated, dateModified, ...restFormData } = formData;
    const submitData: Partial<Application> = { ...restFormData };
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
            {application ? 'Edit Application' : 'Create New Application'}
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
            <label className="block text-white font-semibold mb-2">Company *</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400"
              placeholder="Enter company name"
              required
            />
          </div>

          {application && (
            <>
              <div className="flex items-center gap-4">
                <label className="text-white font-semibold whitespace-nowrap">Hiring Manager:</label>
                <input
                  type="text"
                  value={formData.hiringManager}
                  onChange={(e) => setFormData({ ...formData, hiringManager: e.target.value })}
                  className="flex-1 bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400"
                  placeholder="Hiring manager name"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Message to Hiring Manager</label>
                <textarea
                  value={formData.msgToManager}
                  onChange={(e) => setFormData({ ...formData, msgToManager: e.target.value })}
                  className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400 min-h-[80px]"
                  placeholder="Enter message sent to hiring manager"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="text-white font-semibold whitespace-nowrap">Recruiter:</label>
                <input
                  type="text"
                  value={formData.recruiter}
                  onChange={(e) => setFormData({ ...formData, recruiter: e.target.value })}
                  className="flex-1 bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400"
                  placeholder="Recruiter name"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Message to Recruiter</label>
                <textarea
                  value={formData.msgToRecruiter}
                  onChange={(e) => setFormData({ ...formData, msgToRecruiter: e.target.value })}
                  className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400 min-h-[80px]"
                  placeholder="Enter message sent to recruiter"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="text-white font-semibold whitespace-nowrap">Status:</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ApplicationStatus })}
                  className="flex-1 bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
                >
                  <option value="applied">Applied</option>
                  <option value="messagedHiringManager">Messaged Hiring Manager</option>
                  <option value="messagedRecruiter">Messaged Recruiter</option>
                  <option value="followedUp">Followed Up</option>
                  <option value="interview">Interview</option>
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
              {application ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ApplicationsTab({
  filteredAppColumns,
  appColumns,
  setAppColumns,
  isLoading,
  applicationsFilter,
  setApplicationsFilter,
  setIsModalOpen,
  setEditingApp,
  sensors,
  handleApplicationsDragStart,
  handleApplicationsDragOver,
  handleApplicationsDragEnd,
  activeAppId,
  getApplicationColumnOfItem,
  isModalOpen,
  editingApp,
  setIsDeleting,
  isDeleting,
  fetchApplications,
  isDraggingAppRef,
  userIdParam,
}: ApplicationsTabProps & { isDraggingAppRef: React.MutableRefObject<boolean> }) {
  const [defaultStatus, setDefaultStatus] = React.useState<ApplicationStatus | undefined>(undefined);
  
  return (
    <section className="bg-gray-800 border border-light-steel-blue rounded-lg p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h4 className="text-xl font-bold text-white">High Quality Applications</h4>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span>Show:</span>
          <button
            onClick={() => setApplicationsFilter('modifiedThisMonth')}
            className={`px-3 py-1 rounded-md border transition-colors ${
              applicationsFilter === 'modifiedThisMonth'
                ? 'bg-electric-blue text-white border-electric-blue'
                : 'bg-gray-700 text-gray-300 border-transparent hover:border-light-steel-blue'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setApplicationsFilter('allTime')}
            className={`px-3 py-1 rounded-md border transition-colors ${
              applicationsFilter === 'allTime'
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
            setEditingApp(null);
            setIsModalOpen(true);
          }}
          className="bg-electric-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
        >
          <Plus className="mr-2" />Add Application
        </button>
      </div>
      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading applications...</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleApplicationsDragStart} onDragOver={handleApplicationsDragOver} onDragEnd={handleApplicationsDragEnd}>
          <div className="grid grid-cols-5 gap-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <h5 className="text-white font-semibold mb-4 flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                Applied ({filteredAppColumns.applied.length})
              </h5>
              <SortableContext items={filteredAppColumns.applied.map(c => c.id)} strategy={rectSortingStrategy}>
                <DroppableColumn 
                  id="applied"
                  onAddCard={() => {
                    setDefaultStatus(applicationColumnToStatus.applied);
                    setEditingApp(null);
                    setIsModalOpen(true);
                  }}
                >
                  {filteredAppColumns.applied.map(card => (
                    <SortableAppCard 
                      key={card.id} 
                      card={card}
                      activeAppId={activeAppId}
                      setEditingApp={setEditingApp}
                      setIsModalOpen={setIsModalOpen}
                      setIsDeleting={setIsDeleting}
                      isDraggingAppRef={isDraggingAppRef}
                    />
                  ))}
                </DroppableColumn>
              </SortableContext>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h5 className="text-white font-semibold mb-4 flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                Messaged Hiring Manager ({filteredAppColumns.messagedHiringManager.length})
              </h5>
              <SortableContext items={filteredAppColumns.messagedHiringManager.map(c => c.id)} strategy={rectSortingStrategy}>
                <DroppableColumn 
                  id="messagedHiringManager"
                  onAddCard={() => {
                    setDefaultStatus(applicationColumnToStatus.messagedHiringManager);
                    setEditingApp(null);
                    setIsModalOpen(true);
                  }}
                >
                  {filteredAppColumns.messagedHiringManager.map(card => (
                    <SortableAppCard 
                      key={card.id} 
                      card={card}
                      activeAppId={activeAppId}
                      setEditingApp={setEditingApp}
                      setIsModalOpen={setIsModalOpen}
                      setIsDeleting={setIsDeleting}
                      isDraggingAppRef={isDraggingAppRef}
                    />
                  ))}
                </DroppableColumn>
              </SortableContext>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h5 className="text-white font-semibold mb-4 flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                Messaged Recruiter ({filteredAppColumns.messagedRecruiter.length})
              </h5>
              <SortableContext items={filteredAppColumns.messagedRecruiter.map(c => c.id)} strategy={rectSortingStrategy}>
                <DroppableColumn 
                  id="messagedRecruiter"
                  onAddCard={() => {
                    setDefaultStatus(applicationColumnToStatus.messagedRecruiter);
                    setEditingApp(null);
                    setIsModalOpen(true);
                  }}
                >
                  {filteredAppColumns.messagedRecruiter.map(card => (
                    <SortableAppCard 
                      key={card.id} 
                      card={card}
                      activeAppId={activeAppId}
                      setEditingApp={setEditingApp}
                      setIsModalOpen={setIsModalOpen}
                      setIsDeleting={setIsDeleting}
                      isDraggingAppRef={isDraggingAppRef}
                    />
                  ))}
                </DroppableColumn>
              </SortableContext>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h5 className="text-white font-semibold mb-4 flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                Followed Up ({filteredAppColumns.followedUp.length})
              </h5>
              <SortableContext items={filteredAppColumns.followedUp.map(c => c.id)} strategy={rectSortingStrategy}>
                <DroppableColumn 
                  id="followedUp"
                  onAddCard={() => {
                    setDefaultStatus(applicationColumnToStatus.followedUp);
                    setEditingApp(null);
                    setIsModalOpen(true);
                  }}
                >
                  {filteredAppColumns.followedUp.map(card => (
                    <SortableAppCard 
                      key={card.id} 
                      card={card}
                      activeAppId={activeAppId}
                      setEditingApp={setEditingApp}
                      setIsModalOpen={setIsModalOpen}
                      setIsDeleting={setIsDeleting}
                      isDraggingAppRef={isDraggingAppRef}
                    />
                  ))}
                </DroppableColumn>
              </SortableContext>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h5 className="text-white font-semibold mb-4 flex items-center">
                <div className="w-3 h-3 bg-pink-500 rounded-full mr-2"></div>
                Interview ({filteredAppColumns.interview.length})
              </h5>
              <SortableContext items={filteredAppColumns.interview.map(c => c.id)} strategy={rectSortingStrategy}>
                <DroppableColumn 
                  id="interview"
                  onAddCard={() => {
                    setDefaultStatus(applicationColumnToStatus.interview);
                    setEditingApp(null);
                    setIsModalOpen(true);
                  }}
                >
                  {filteredAppColumns.interview.map(card => (
                    <SortableAppCard 
                      key={card.id} 
                      card={card}
                      activeAppId={activeAppId}
                      setEditingApp={setEditingApp}
                      setIsModalOpen={setIsModalOpen}
                      setIsDeleting={setIsDeleting}
                      isDraggingAppRef={isDraggingAppRef}
                    />
                  ))}
                </DroppableColumn>
              </SortableContext>
            </div>
          </div>
          <DragOverlay>
            {activeAppId ? (() => {
              const col = getApplicationColumnOfItem(activeAppId);
              if (!col) return null;
              const card = appColumns[col].find(c => String(c.id) === activeAppId);
              if (!card) return null;
              return (
                <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3">
                  <div className="text-white font-medium mb-1">{card.company}</div>
                  {card.hiringManager && (
                    <div className="text-gray-400 text-xs mb-1">HM: {card.hiringManager}</div>
                  )}
                  {card.recruiter && (
                    <div className="text-gray-400 text-xs mb-1">Recruiter: {card.recruiter}</div>
                  )}
                  <div className="text-xs text-yellow-400">
                    {(() => {
                      const date = new Date(card.dateCreated);
                      const testDate = new Date('2024-01-01T12:00:00Z');
                      const fingerprintingDetected = testDate.getHours() === testDate.getUTCHours() && 
                                                      testDate.getHours() === 12;
                      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      const month = monthNames[fingerprintingDetected ? date.getUTCMonth() : date.getMonth()];
                      const day = fingerprintingDetected ? date.getUTCDate() : date.getDate();
                      return `${month} ${day}`;
                    })()}
                  </div>
                </div>
              );
            })() : null}
          </DragOverlay>
        </DndContext>
      )}
      
      {/* Create/Edit Modal */}
      {isModalOpen && (
        <ApplicationModal
          application={editingApp}
          defaultStatus={defaultStatus}
          onClose={() => {
            setIsModalOpen(false);
            setEditingApp(null);
            setDefaultStatus(undefined);
          }}
          onSave={async (data: Partial<Application>) => {
            try {
              const url = userIdParam ? `/api/applications_with_outreach?userId=${userIdParam}` : '/api/applications_with_outreach';
              let updatedApp: Application;
              if (editingApp) {
                const response = await fetch(url, {
                  method: 'PUT',
                  headers: getApiHeaders(),
                  body: JSON.stringify({ ...data, id: editingApp.id }),
                });
                if (!response.ok) throw new Error('Failed to update application');
                updatedApp = await response.json() as Application;
                
                // Optimistically update the state immediately
                setAppColumns(prev => {
                  // Create completely new arrays for all columns to ensure React detects the change
                  const newColumns: Record<ApplicationColumnId, Application[]> = {
                    applied: [...prev.applied],
                    messagedRecruiter: [...prev.messagedRecruiter],
                    messagedHiringManager: [...prev.messagedHiringManager],
                    followedUp: [...prev.followedUp],
                    interview: [...prev.interview],
                  };
                  const targetColumn = applicationStatusToColumn[updatedApp.status] || 'applied';
                  
                  // Find the old item's column and index
                  let oldColumn: ApplicationColumnId | null = null;
                  let oldIndex = -1;
                  Object.keys(newColumns).forEach(colId => {
                    const col = colId as ApplicationColumnId;
                    const index = newColumns[col].findIndex(app => app.id === editingApp.id);
                    if (index !== -1) {
                      oldColumn = col;
                      oldIndex = index;
                    }
                  });
                  
                  if (oldColumn !== null && oldIndex !== -1) {
                    // Create a new object reference to ensure React detects the change
                    const updatedCard: Application = { ...updatedApp };
                    if (oldColumn === targetColumn) {
                      // Same column: update in place with new array reference
                      newColumns[targetColumn] = [
                        ...newColumns[targetColumn].slice(0, oldIndex),
                        updatedCard,
                        ...newColumns[targetColumn].slice(oldIndex + 1)
                      ];
                    } else {
                      // Different column: remove from old, add to new
                      // Use type assertion to help TypeScript understand oldColumn is not null here
                      const sourceColumn = oldColumn as ApplicationColumnId;
                      const sourceArray = newColumns[sourceColumn];
                      newColumns[sourceColumn] = [
                        ...sourceArray.slice(0, oldIndex),
                        ...sourceArray.slice(oldIndex + 1)
                      ];
                      newColumns[targetColumn] = [...newColumns[targetColumn], updatedCard];
                    }
                  } else {
                    // Not found (shouldn't happen), just add to target column
                    const updatedCard: Application = { ...updatedApp };
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
                if (!response.ok) throw new Error('Failed to create application');
                const responseData = await response.json();
                updatedApp = (responseData.application || responseData) as Application;
                
                // Optimistically update the state immediately
                setAppColumns(prev => {
                  // Create completely new arrays for all columns to ensure React detects the change
                  const newColumns: Record<ApplicationColumnId, Application[]> = {
                    applied: [...prev.applied],
                    messagedRecruiter: [...prev.messagedRecruiter],
                    messagedHiringManager: [...prev.messagedHiringManager],
                    followedUp: [...prev.followedUp],
                    interview: [...prev.interview],
                  };
                  const targetColumn = applicationStatusToColumn[updatedApp.status] || 'applied';
                  const newCard: Application = { ...updatedApp };
                  newColumns[targetColumn] = [...newColumns[targetColumn], newCard];
                  return newColumns;
                });
              }
              setIsModalOpen(false);
              setEditingApp(null);
              // No need to refetch - we already have the updated item from the API response
              // The optimistic update is sufficient since we're using the server's response data
            } catch (error) {
              console.error('Error saving application:', error);
              alert('Failed to save application. Please try again.');
              // Refresh data on error to restore correct state
              await fetchApplications();
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleting !== null && (
        <DeleteModal
          onConfirm={async () => {
            try {
              const url = userIdParam ? `/api/applications_with_outreach?id=${isDeleting}&userId=${userIdParam}` : `/api/applications_with_outreach?id=${isDeleting}`;
              const response = await fetch(url, {
                method: 'DELETE',
              });
              if (!response.ok) throw new Error('Failed to delete application');
              await fetchApplications();
              setIsDeleting(null);
            } catch (error) {
              console.error('Error deleting application:', error);
              alert('Failed to delete application. Please try again.');
              setIsDeleting(null);
            }
          }}
          onCancel={() => setIsDeleting(null)}
        />
      )}
    </section>
  );
}


'use client';

import React, { useState, useEffect } from 'react';
import { getApiHeaders } from '@/app/lib/api-helpers';

import { Plus, Trash2, X, Lock, PlayCircle } from 'lucide-react';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Application, ApplicationColumnId, BoardTimeFilter, ApplicationStatus } from './types';
import { applicationStatusToColumn } from './types';
import { DroppableColumn, DeleteModal, formatModalDate, toLocalDateString } from './shared';

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
    // Prevent click during drag
    if (isDragging || props.isDraggingAppRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
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
      style={{ ...style, touchAction: 'none' }} 
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
      {(props.card.msgToManager || props.card.msgToRecruiter) && (
        <div className="text-green-400 text-xs mb-2">
          {props.card.msgToManager && '✓ Messaged HM'}
          {props.card.msgToManager && props.card.msgToRecruiter && ' • '}
          {props.card.msgToRecruiter && '✓ Messaged Recruiter'}
        </div>
      )}
    </div>
  );
}

// Lock Tooltip Component - centered in unified blur area
function LockTooltip() {
  return (
    <div className="flex md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 md:absolute md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:z-10 items-center gap-2 bg-gray-900 border border-light-steel-blue rounded-lg px-3 py-2 shadow-lg whitespace-nowrap justify-center md:pointer-events-none">
      <Lock className="w-4 h-4 text-electric-blue flex-shrink-0" />
      <span className="text-sm text-white">Drag card to next column to unlock next step</span>
    </div>
  );
}

// Video Modal Component - displays YouTube video in a modal overlay
function VideoModal({ videoUrl, isOpen, onClose }: { videoUrl: string; isOpen: boolean; onClose: () => void }) {
  // Convert YouTube watch URL to embed format
  const getEmbedUrl = (url: string) => {
    // Extract video ID from various YouTube URL formats
    const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (videoIdMatch && videoIdMatch[1]) {
      return `https://www.youtube.com/embed/${videoIdMatch[1]}`;
    }
    return url; // Fallback to original URL if extraction fails
  };

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
          aria-label="Close video"
        >
          <X size={24} />
        </button>
        <iframe
          src={getEmbedUrl(videoUrl)}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video player"
        />
      </div>
    </div>
  );
}

// Helper Message Component - shows video link based on current column
function HelperMessage({ status }: { status?: ApplicationStatus | null }) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const videoUrl = 'https://www.youtube.com/watch?v=UgZrVViUQLk';

  const getMessage = () => {
    if (!status) return 'apply';
    switch (status) {
      case 'apply':
        return 'apply';
      case 'messageHiringManager':
        return 'message hiring manager';
      case 'messageRecruiter':
        return 'message recruiter';
      case 'followUp':
        return 'follow up';
      case 'interview':
        return 'interview';
      default:
        return 'apply';
    }
  };

  return (
    <>
      <div className="text-center py-3">
        <button
          type="button"
          onClick={() => setIsVideoOpen(true)}
          className="inline-flex items-center gap-2 text-white font-semibold hover:text-electric-blue transition-colors cursor-pointer underline"
        >
          <PlayCircle className="w-5 h-5 text-electric-blue flex-shrink-0" />
          <span>Helper video: How to {getMessage()}</span>
        </button>
      </div>
      <VideoModal videoUrl={videoUrl} isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} />
    </>
  );
}

// Application Modal Component
function ApplicationModal({ 
  application, 
  onClose, 
  onSave,
  onDelete
}: { 
  application: Application | null; 
  onClose: () => void; 
  onSave: (data: Partial<Application>) => void;
  onDelete?: () => void;
}) {

  type ApplicationFormData = {
    company: string;
    linkToJobPosting: string;
    hiringManager: string;
    msgToManager: string;
    recruiter: string;
    msgToRecruiter: string;
    status: ApplicationStatus;
    dateCreated: string; // ===== DATE FIELD EDITING: Added for testing/debugging =====
    dateModified: string; // ===== DATE FIELD EDITING: Added for testing/debugging =====
  };

  const [formData, setFormData] = useState<ApplicationFormData>({
    company: application?.company || '',
    linkToJobPosting: application?.linkToJobPosting || '',
    hiringManager: application?.hiringManager || '',
    msgToManager: application?.msgToManager || '',
    recruiter: application?.recruiter || '',
    msgToRecruiter: application?.msgToRecruiter || '',
    status: application?.status || 'apply',
    dateCreated: application?.dateCreated ? toLocalDateString(application.dateCreated) : '', // ===== DATE FIELD EDITING =====
    dateModified: application?.dateModified ? toLocalDateString(application.dateModified) : '', // ===== DATE FIELD EDITING =====
  });

  // Update form data when application changes
  useEffect(() => {
    if (application) {
      setFormData({
        company: application.company || '',
        linkToJobPosting: application.linkToJobPosting || '',
        hiringManager: application.hiringManager || '',
        msgToManager: application.msgToManager || '',
        recruiter: application.recruiter || '',
        msgToRecruiter: application.msgToRecruiter || '',
        status: application.status ?? 'apply',
        dateCreated: application.dateCreated ? toLocalDateString(application.dateCreated) : '', // ===== DATE FIELD EDITING =====
        dateModified: application.dateModified ? toLocalDateString(application.dateModified) : '', // ===== DATE FIELD EDITING =====
      });
      } else {
      setFormData({
        company: '',
        linkToJobPosting: '',
        hiringManager: '',
        msgToManager: '',
        recruiter: '',
        msgToRecruiter: '',
        status: 'apply',
        dateCreated: '', // ===== DATE FIELD EDITING =====
        dateModified: '', // ===== DATE FIELD EDITING =====
      });
    }
  }, [application]);

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
      <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-0" onClick={(e) => e.stopPropagation()}>
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

          <div>
            <label className="block text-white font-semibold mb-2">Link to Job Posting</label>
            <input
              type="url"
              value={formData.linkToJobPosting}
              onChange={(e) => setFormData({ ...formData, linkToJobPosting: e.target.value })}
              className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400"
              placeholder="https://..."
            />
          </div>

          {/* Helper message for create mode or 'apply' status */}
          {(!application || application?.status === 'apply') && (
            <HelperMessage status={application?.status || 'apply'} />
          )}

          {!application ? (
            // Create mode: Show only Hiring Manager (blurred), hide Recruiter
            <div className="relative group py-4">
              <div className="blur-sm space-y-4">
                <div className="flex items-center gap-4">
                  <label className="font-semibold whitespace-nowrap text-white">Hiring Manager:</label>
                  <input
                    type="text"
                    value={formData.hiringManager}
                    onChange={(e) => setFormData({ ...formData, hiringManager: e.target.value })}
                    className="flex-1 border rounded-lg px-4 py-2 placeholder-gray-400 bg-gray-700 border-light-steel-blue text-white"
                    placeholder="Hiring manager name"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2 text-white">Message to Hiring Manager</label>
                  <textarea
                    value={formData.msgToManager}
                    onChange={(e) => setFormData({ ...formData, msgToManager: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 placeholder-gray-400 min-h-[80px] bg-gray-700 border-light-steel-blue text-white"
                    placeholder="Enter message sent to hiring manager"
                  />
                </div>
              </div>
              <LockTooltip />
            </div>
          ) : (
            <>
              {/* Hiring Manager fields */}
              {application?.status === 'apply' ? (
                // Status 'apply': Show Hiring Manager blurred (unlocks in next column)
                <div className="relative group py-4">
                  <div className="blur-sm space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="font-semibold whitespace-nowrap text-white">Hiring Manager:</label>
                      <input
                        type="text"
                        value={formData.hiringManager}
                        onChange={(e) => setFormData({ ...formData, hiringManager: e.target.value })}
                        className="flex-1 border rounded-lg px-4 py-2 placeholder-gray-400 bg-gray-700 border-light-steel-blue text-white"
                        placeholder="Hiring manager name"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2 text-white">Message to Hiring Manager</label>
                      <textarea
                        value={formData.msgToManager}
                        onChange={(e) => setFormData({ ...formData, msgToManager: e.target.value })}
                        className="w-full border rounded-lg px-4 py-2 placeholder-gray-400 min-h-[80px] bg-gray-700 border-light-steel-blue text-white"
                        placeholder="Enter message sent to hiring manager"
                      />
                    </div>
                  </div>
                  <LockTooltip />
                </div>
              ) : (
                // Status 'messageHiringManager' or beyond: Show Hiring Manager unblurred
                <>
                  <div className="flex items-center gap-4">
                    <label className="font-semibold whitespace-nowrap text-white">Hiring Manager:</label>
                    <input
                      type="text"
                      value={formData.hiringManager}
                      onChange={(e) => setFormData({ ...formData, hiringManager: e.target.value })}
                      className="flex-1 border rounded-lg px-4 py-2 placeholder-gray-400 bg-gray-700 border-light-steel-blue text-white"
                      placeholder="Hiring manager name"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2 text-white">Message to Hiring Manager</label>
                    <textarea
                      value={formData.msgToManager}
                      onChange={(e) => setFormData({ ...formData, msgToManager: e.target.value })}
                      className="w-full border rounded-lg px-4 py-2 placeholder-gray-400 min-h-[80px] bg-gray-700 border-light-steel-blue text-white"
                      placeholder="Enter message sent to hiring manager"
                    />
                  </div>
                </>
              )}

              {/* Helper message between revealed and blurred sections */}
              {application?.status === 'messageHiringManager' && (
                <HelperMessage status={application.status} />
              )}

              {/* Recruiter fields */}
              {application?.status === 'apply' ? (
                // Status 'apply': Hide Recruiter (won't unlock in next column)
                null
              ) : application?.status === 'messageHiringManager' ? (
                // Status 'messageHiringManager': Show Recruiter blurred (unlocks in next column)
                <div className="relative group py-4">
                  <div className="blur-sm space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="font-semibold whitespace-nowrap text-white">Recruiter:</label>
                      <input
                        type="text"
                        value={formData.recruiter}
                        onChange={(e) => setFormData({ ...formData, recruiter: e.target.value })}
                        className="flex-1 border rounded-lg px-4 py-2 placeholder-gray-400 bg-gray-700 border-light-steel-blue text-white"
                        placeholder="Recruiter name"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2 text-white">Message to Recruiter</label>
                      <textarea
                        value={formData.msgToRecruiter}
                        onChange={(e) => setFormData({ ...formData, msgToRecruiter: e.target.value })}
                        className="w-full border rounded-lg px-4 py-2 placeholder-gray-400 min-h-[80px] bg-gray-700 border-light-steel-blue text-white"
                        placeholder="Enter message sent to recruiter"
                      />
                    </div>
                  </div>
                  <LockTooltip />
                </div>
              ) : (
                // Status 'messageRecruiter' or beyond: Show Recruiter unblurred
                <>
                  <div className="flex items-center gap-4">
                    <label className="font-semibold whitespace-nowrap text-white">Recruiter:</label>
                    <input
                      type="text"
                      value={formData.recruiter}
                      onChange={(e) => setFormData({ ...formData, recruiter: e.target.value })}
                      className="flex-1 border rounded-lg px-4 py-2 placeholder-gray-400 bg-gray-700 border-light-steel-blue text-white"
                      placeholder="Recruiter name"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2 text-white">Message to Recruiter</label>
                    <textarea
                      value={formData.msgToRecruiter}
                      onChange={(e) => setFormData({ ...formData, msgToRecruiter: e.target.value })}
                      className="w-full border rounded-lg px-4 py-2 placeholder-gray-400 min-h-[80px] bg-gray-700 border-light-steel-blue text-white"
                      placeholder="Enter message sent to recruiter"
                    />
                  </div>
                </>
              )}

            </>
          )}

          {/* ===== DATE FIELD EDITING: Show dateCreated and dateModified fields when toggle is enabled ===== */}
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

          {/* Helper message at bottom when all sections are revealed */}
          {application && (application.status === 'messageRecruiter' || application.status === 'followUp' || application.status === 'interview') && (
            <HelperMessage status={application.status} />
          )}

          {application && (
            <div className="text-xs text-gray-400 pt-2 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <span>Created: {formatModalDate(application.dateCreated)}</span>
                <span>Modified: {formatModalDate(application.dateModified)}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between sm:justify-end gap-3 pt-4">
            {application && onDelete && (
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
                {application ? 'Update' : 'Create'}
              </button>
            </div>
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
  return (
    <section className="bg-gray-800 border border-light-steel-blue rounded-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4 mb-6">
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
            setEditingApp(null);
            setIsModalOpen(true);
          }}
          className="bg-electric-blue hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold transition-colors flex items-center text-sm sm:text-base"
        >
          <Plus className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />Add Application
        </button>
      </div>
      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading applications...</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleApplicationsDragStart} onDragOver={handleApplicationsDragOver} onDragEnd={handleApplicationsDragEnd}>
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="grid grid-cols-5 gap-6 min-w-[800px]">
            <div className="bg-gray-700 rounded-lg p-4">
              <h5 className="text-white font-semibold mb-4 flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                Apply ({filteredAppColumns.apply.length})
              </h5>
              <SortableContext items={filteredAppColumns.apply.map(c => c.id)} strategy={rectSortingStrategy}>
                <DroppableColumn 
                  id="apply"
                  onAddCard={() => {
                    setEditingApp(null);
                    setIsModalOpen(true);
                  }}
                >
                  {filteredAppColumns.apply.map(card => (
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
                Message Hiring Manager ({filteredAppColumns.messageHiringManager.length})
              </h5>
              <SortableContext items={filteredAppColumns.messageHiringManager.map(c => c.id)} strategy={rectSortingStrategy}>
                <DroppableColumn 
                  id="messageHiringManager"
                >
                  {filteredAppColumns.messageHiringManager.map(card => (
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
                Message Recruiter ({filteredAppColumns.messageRecruiter.length})
              </h5>
              <SortableContext items={filteredAppColumns.messageRecruiter.map(c => c.id)} strategy={rectSortingStrategy}>
                <DroppableColumn 
                  id="messageRecruiter"
                >
                  {filteredAppColumns.messageRecruiter.map(card => (
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
                Follow up ({filteredAppColumns.followUp.length})
              </h5>
              <SortableContext items={filteredAppColumns.followUp.map(c => c.id)} strategy={rectSortingStrategy}>
                <DroppableColumn 
                  id="followUp"
                >
                  {filteredAppColumns.followUp.map(card => (
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
          </div>
          <DragOverlay style={{ touchAction: 'none' }}>
            {activeAppId ? (() => {
              const col = getApplicationColumnOfItem(activeAppId);
              if (!col) return null;
              const card = appColumns[col].find(c => String(c.id) === activeAppId);
              if (!card) return null;
              return (
                <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3" style={{ touchAction: 'none' }}>
                  <div className="text-white font-medium mb-1">{card.company}</div>
                  {card.hiringManager && (
                    <div className="text-gray-400 text-xs mb-1">HM: {card.hiringManager}</div>
                  )}
                  {card.recruiter && (
                    <div className="text-gray-400 text-xs mb-1">Recruiter: {card.recruiter}</div>
                  )}
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
          onClose={() => {
            setIsModalOpen(false);
            setEditingApp(null);
          }}
          onDelete={() => {
            if (editingApp) {
              setIsModalOpen(false);
              setIsDeleting(editingApp.id);
            }
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
                    apply: [...prev.apply],
                    messageRecruiter: [...prev.messageRecruiter],
                    messageHiringManager: [...prev.messageHiringManager],
                    followUp: [...prev.followUp],
                    interview: [...prev.interview],
                  };
                  const targetColumn = applicationStatusToColumn[updatedApp.status] || 'apply';
                  
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
                    apply: [...prev.apply],
                    messageRecruiter: [...prev.messageRecruiter],
                    messageHiringManager: [...prev.messageHiringManager],
                    followUp: [...prev.followUp],
                    interview: [...prev.interview],
                  };
                  const targetColumn = applicationStatusToColumn[updatedApp.status] || 'apply';
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


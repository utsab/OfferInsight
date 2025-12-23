'use client';

import { getHeadersWithTimezone } from '@/app/lib/api-helpers';

import { Plus, Trash2 } from 'lucide-react';
import { DndContext, closestCenter, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Application, ApplicationColumnId, BoardTimeFilter } from './types';
import { CardDateMeta } from './shared';

type ApplicationsTabProps = {
  filteredAppColumns: Record<ApplicationColumnId, Application[]>;
  appColumns: Record<ApplicationColumnId, Application[]>;
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
  ApplicationModal: React.ComponentType<any>;
  DeleteModal: React.ComponentType<any>;
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

function DroppableColumn(props: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: props.id });
  return (
    <div ref={setNodeRef} className={`space-y-3 min-h-32 ${isOver ? 'outline outline-2 outline-electric-blue/60 outline-offset-2 bg-gray-600/40' : ''}`}>
      {props.children}
      <div className="h-2"></div>
    </div>
  );
}

export default function ApplicationsTab({
  filteredAppColumns,
  appColumns,
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
  ApplicationModal,
  DeleteModal,
  isModalOpen,
  editingApp,
  setIsDeleting,
  isDeleting,
  fetchApplications,
  isDraggingAppRef,
  userIdParam,
}: ApplicationsTabProps & { isDraggingAppRef: React.MutableRefObject<boolean> }) {
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
                <DroppableColumn id="applied">
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
                <DroppableColumn id="messagedHiringManager">
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
                <DroppableColumn id="messagedRecruiter">
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
                <DroppableColumn id="followedUp">
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
                <DroppableColumn id="interview">
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
                  <div className="text-xs text-yellow-400">{new Date(card.dateCreated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
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
          onSave={async (data: Partial<Application>) => {
            try {
              const url = userIdParam ? `/api/applications_with_outreach?userId=${userIdParam}` : '/api/applications_with_outreach';
              if (editingApp) {
                const response = await fetch(url, {
                  method: 'PUT',
                  headers: getHeadersWithTimezone(),
                  body: JSON.stringify({ ...data, id: editingApp.id }),
                });
                if (!response.ok) throw new Error('Failed to update application');
              } else {
                const response = await fetch(url, {
                  method: 'POST',
                  headers: getHeadersWithTimezone(),
                  body: JSON.stringify(data),
                });
                if (!response.ok) throw new Error('Failed to create application');
              }
              await fetchApplications();
              setIsModalOpen(false);
              setEditingApp(null);
            } catch (error) {
              console.error('Error saving application:', error);
              alert('Failed to save application. Please try again.');
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


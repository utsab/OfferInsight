'use client';

import { getHeadersWithTimezone } from '@/app/lib/api-helpers';

import { Plus, Trash2 } from 'lucide-react';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { LinkedinOutreach, LinkedinOutreachColumnId, BoardTimeFilter } from './types';
import { CardDateMeta, DroppableColumn } from './shared';

type CoffeeChatsTabProps = {
  filteredLinkedinOutreachColumns: Record<LinkedinOutreachColumnId, LinkedinOutreach[]>;
  linkedinOutreachColumns: Record<LinkedinOutreachColumnId, LinkedinOutreach[]>;
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
  LinkedinOutreachModal: React.ComponentType<any>;
  DeleteModal: React.ComponentType<any>;
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

export default function CoffeeChatsTab({
  filteredLinkedinOutreachColumns,
  linkedinOutreachColumns,
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
  LinkedinOutreachModal,
  DeleteModal,
  isLinkedinOutreachModalOpen,
  editingLinkedinOutreach,
  setIsDeletingLinkedinOutreach,
  isDeletingLinkedinOutreach,
  fetchLinkedinOutreach,
  isDraggingLinkedinOutreachRef,
  userIdParam,
}: CoffeeChatsTabProps) {
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
                <DroppableColumn id="outreach">
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
                <DroppableColumn id="accepted">
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
                <DroppableColumn id="followedUpLinkedin">
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
                <DroppableColumn id="linkedinOutreach">
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
                  <div className="text-xs text-yellow-400">{new Date(card.dateCreated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
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
          onClose={() => {
            setIsLinkedinOutreachModalOpen(false);
            setEditingLinkedinOutreach(null);
          }}
          onSave={async (data: Partial<LinkedinOutreach>) => {
            try {
              const url = userIdParam ? `/api/linkedin_outreach?userId=${userIdParam}` : '/api/linkedin_outreach';
              if (editingLinkedinOutreach) {
                const response = await fetch(url, {
                  method: 'PUT',
                  headers: getHeadersWithTimezone(),
                  body: JSON.stringify({ ...data, id: editingLinkedinOutreach.id }),
                });
                if (!response.ok) throw new Error('Failed to update LinkedIn outreach entry');
              } else {
                const response = await fetch(url, {
                  method: 'POST',
                  headers: getHeadersWithTimezone(),
                  body: JSON.stringify(data),
                });
                if (!response.ok) throw new Error('Failed to create LinkedIn outreach entry');
              }
              await fetchLinkedinOutreach();
              setIsLinkedinOutreachModalOpen(false);
              setEditingLinkedinOutreach(null);
            } catch (error) {
              console.error('Error saving LinkedIn outreach entry:', error);
              alert('Failed to save coffee chat. Please try again.');
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

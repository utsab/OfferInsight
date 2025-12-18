'use client';

import { Plus, Trash2 } from 'lucide-react';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { LeetEntry, LeetColumnId, BoardTimeFilter } from './types';
import { CardDateMeta, DroppableColumn } from './shared';

type LeetCodeTabProps = {
  filteredLeetColumns: Record<LeetColumnId, LeetEntry[]>;
  leetColumns: Record<LeetColumnId, LeetEntry[]>;
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
  LeetModal: React.ComponentType<any>;
  DeleteModal: React.ComponentType<any>;
  isLeetModalOpen: boolean;
  editingLeet: LeetEntry | null;
  setIsDeletingLeet: (id: number | null) => void;
  isDeletingLeet: number | null;
  fetchLeetEntries: () => Promise<void>;
  isDraggingLeetRef: React.MutableRefObject<boolean>;
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
      style={style}
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
            <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-electric-blue/20 text-electric-blue uppercase tracking-wide">
              {props.card.difficulty}
            </span>
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
      <CardDateMeta created={props.card.dateCreated} completed={props.card.dateCompleted} className="mt-3" />
    </div>
  );
}

export default function LeetCodeTab({
  filteredLeetColumns,
  leetColumns,
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
  LeetModal,
  DeleteModal,
  isLeetModalOpen,
  editingLeet,
  setIsDeletingLeet,
  isDeletingLeet,
  fetchLeetEntries,
  isDraggingLeetRef,
}: LeetCodeTabProps) {
  return (
    <section className="bg-gray-800 border border-light-steel-blue rounded-lg p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h4 className="text-xl font-bold text-white">LeetCode Progress</h4>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span>Show:</span>
          <button
            onClick={() => setLeetFilter('createdThisMonth')}
            className={`px-3 py-1 rounded-md border transition-colors ${
              leetFilter === 'createdThisMonth'
                ? 'bg-electric-blue text-white border-electric-blue'
                : 'bg-gray-700 text-gray-300 border-transparent hover:border-light-steel-blue'
            }`}
          >
            Created This Month
          </button>
          <button
            onClick={() => setLeetFilter('completedThisMonth')}
            className={`px-3 py-1 rounded-md border transition-colors ${
              leetFilter === 'completedThisMonth'
                ? 'bg-electric-blue text-white border-electric-blue'
                : 'bg-gray-700 text-gray-300 border-transparent hover:border-light-steel-blue'
            }`}
          >
            Completed This Month
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
            setEditingLeet(null);
            setIsLeetModalOpen(true);
          }}
          className="bg-electric-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
        >
          <Plus className="mr-2" />Log Practice
        </button>
      </div>
      {isLoadingLeet ? (
        <div className="text-center py-8 text-gray-400">Loading problems...</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleLeetDragStart} onDragOver={handleLeetDragOver} onDragEnd={handleLeetDragEnd}>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <h5 className="text-white font-semibold mb-4 flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                Planned ({filteredLeetColumns.planned.length})
              </h5>
              <SortableContext items={filteredLeetColumns.planned.map(entry => String(entry.id))} strategy={rectSortingStrategy}>
                <DroppableColumn id="planned">
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
                <DroppableColumn id="solved">
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
                <DroppableColumn id="reflected">
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
          <DragOverlay>
            {activeLeetId ? (() => {
              const col = getLeetColumnOfItem(activeLeetId);
              if (!col) return null;
              const card = leetColumns[col].find(entry => String(entry.id) === activeLeetId);
              if (!card) return null;
              return (
                <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3">
                  <div className="text-white font-medium mb-1">{card.problem?.trim() || 'Untitled Problem'}</div>
                  <div className="text-gray-400 text-xs mb-1">{card.problemType || '—'}</div>
                  {card.difficulty && (
                    <div className="text-[10px] text-electric-blue uppercase">{card.difficulty}</div>
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
          onClose={() => {
            setIsLeetModalOpen(false);
            setEditingLeet(null);
          }}
          onSave={async (data: Partial<LeetEntry>) => {
            try {
              if (editingLeet) {
                const response = await fetch('/api/leetcode', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ...data, id: editingLeet.id }),
                });
                if (!response.ok) throw new Error('Failed to update problem');
              } else {
                const response = await fetch('/api/leetcode', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data),
                });
                if (!response.ok) throw new Error('Failed to create problem');
              }
              await fetchLeetEntries();
              setIsLeetModalOpen(false);
              setEditingLeet(null);
            } catch (error) {
              console.error('Error saving LeetCode problem:', error);
              alert('Failed to save problem. Please try again.');
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeletingLeet !== null && (
        <DeleteModal
          onConfirm={async () => {
            try {
              const response = await fetch(`/api/leetcode?id=${isDeletingLeet}`, {
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

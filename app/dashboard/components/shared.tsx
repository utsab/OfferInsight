'use client';

import { useDroppable } from '@dnd-kit/core';

// Shared components used across multiple tabs

export function CardDateMeta({
  created,
  modified,
  className,
}: {
  created?: string | null;
  modified?: string | null;
  className?: string;
}) {
  const formatCardDate = (value?: string | null) => {
    if (!value) return '-';
    try {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '-';
    }
  };

  return (
    <div className={className ? className : 'mt-3'}>
      <div className="flex items-center justify-between text-[10px] tracking-wider text-gray-400 mb-1">
        <span>CREATED:</span>
        <span>MODIFIED:</span>
      </div>
      <div className="flex items-center justify-between text-xs text-yellow-400">
        <span>{formatCardDate(created)}</span>
        <span>{formatCardDate(modified)}</span>
      </div>
    </div>
  );
}

export function DroppableColumn(props: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: props.id });
  return (
    <div ref={setNodeRef} className={`space-y-3 min-h-32 ${isOver ? 'outline outline-2 outline-electric-blue/60 outline-offset-2 bg-gray-650/40' : ''}`}>
      {props.children}
      {/* When empty, provide space to drop */}
      <div className="h-2"></div>
    </div>
  );
}


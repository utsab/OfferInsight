'use client';

import { Plus } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';

// Delete Confirmation Modal
export function DeleteModal({ 
  onConfirm, 
  onCancel 
}: { 
  onConfirm: () => void; 
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-white mb-4">Delete Item</h3>
        <p className="text-gray-300 mb-6">Are you sure you want to delete this item? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

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
      // Parse the UTC date string from the database
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return '-';
      
      // Get the timezone offset from the browser
      // getTimezoneOffset() returns minutes to ADD to local time to get UTC
      // PST (UTC-8): offset = 480
      // EST (UTC+5): offset = -300
      const detectedOffset = new Date().getTimezoneOffset();
      
      // If browser reports offset 0 (UTC), try to calculate actual offset
      // by comparing local time components to UTC time components
      let actualOffset = detectedOffset;
      if (detectedOffset === 0) {
        const now = new Date();
        const localHours = now.getHours();
        const utcHoursNow = now.getUTCHours();
        const localMinutes = now.getMinutes();
        const utcMinutesNow = now.getUTCMinutes();
        
        // Calculate hour difference, accounting for day rollover
        let hourDiff = localHours - utcHoursNow;
        let minuteDiff = localMinutes - utcMinutesNow;
        
        // Handle day rollover (e.g., local is 23:00, UTC is 07:00 next day)
        if (hourDiff > 12) hourDiff -= 24;
        if (hourDiff < -12) hourDiff += 24;
        
        // Convert to minutes offset
        // Note: getTimezoneOffset() returns positive for timezones behind UTC
        // So if local is behind UTC, offset should be positive
        actualOffset = -(hourDiff * 60 + minuteDiff);
      }
      
      // Convert UTC date to local time
      // getTimezoneOffset() returns minutes to ADD to local to get UTC
      // So: UTC = local + offset, therefore: local = UTC - offset
      const utcTime = date.getTime();
      const localTime = utcTime - (actualOffset * 60000);
      const localDate = new Date(localTime);
      
      // Extract local date components
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[localDate.getMonth()];
      const day = localDate.getDate();
      
      return `${month} ${day}`;
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

export function DroppableColumn(props: { id: string; children: React.ReactNode; onAddCard?: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: props.id });
  return (
    <div ref={setNodeRef} className={`space-y-3 min-h-32 ${isOver ? 'outline outline-2 outline-electric-blue/60 outline-offset-2 bg-gray-650/40' : ''}`}>
      {props.children}
      {props.onAddCard && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            props.onAddCard?.();
          }}
          className="w-full mt-2 py-2 px-3 text-sm text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg border border-dashed border-gray-600 hover:border-electric-blue transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Add Card
        </button>
      )}
      {/* When empty, provide space to drop */}
      <div className="h-2"></div>
    </div>
  );
}


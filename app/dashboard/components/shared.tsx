'use client';

import { Plus, Lock, X, PlayCircle } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import React, { useState, useEffect } from 'react';

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

// Helper function to format dates for display in modals
export function formatModalDate(value?: string | null): string {
  if (!value) return '-';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `${month} ${day}, ${year}`;
  } catch {
    return '-';
  }
}

// Helper function to convert ISO date string to local date string (YYYY-MM-DD format)
// Used for date input fields in modals
export function toLocalDateString(value: string): string {
  try {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

// Helper function to get local date parts (month, day, year) from ISO date string
export function getLocalDateParts(value: string): { year: number; month: number; day: number } {
  try {
    const date = new Date(value);
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
    };
  } catch {
    return { year: 0, month: 0, day: 0 };
  }
}

// Helper function to get local time parts (hours, minutes) from ISO date string
export function getLocalTimeParts(value: string): { hours: number; minutes: number } {
  try {
    const date = new Date(value);
    return {
      hours: date.getHours(),
      minutes: date.getMinutes(),
    };
  } catch {
    return { hours: 0, minutes: 0 };
  }
}

// Helper function to format date with full month name (e.g., "January 15, 2024")
export function formatDateWithFullMonth(value: string | Date): string {
  try {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `${month} ${day}, ${year}`;
  } catch {
    return '—';
  }
}

// Lock Tooltip Component - centered in unified blur area
export function LockTooltip() {
  return (
    <div className="flex md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 md:absolute md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:z-10 items-center gap-2 bg-gray-900 border border-light-steel-blue rounded-lg px-3 py-2 shadow-lg whitespace-nowrap justify-center md:pointer-events-none">
      <Lock className="w-4 h-4 text-electric-blue flex-shrink-0" />
      <span className="text-sm text-white">Drag card to next column to unlock next step</span>
    </div>
  );
}

// Video Modal Component - displays YouTube video in a modal overlay
export function VideoModal({ videoUrl, isOpen, onClose }: { videoUrl: string; isOpen: boolean; onClose: () => void }) {
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

export function DroppableColumn(props: { id: string; children: React.ReactNode; onAddCard?: () => void; showLockIcon?: boolean; hasCardsToRight?: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: props.id });
  const [showTooltip, setShowTooltip] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const showLock = props.showLockIcon !== false; // Default to true if not specified
  
  // Detect if device is primarily touch-based (mobile/tablet)
  // We check for touch AND small screen to avoid false positives on touchscreen laptops
  useEffect(() => {
    const checkTouchDevice = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
      // Consider it a touch device only if it has touch AND is a small screen
      setIsTouchDevice(hasTouch && isSmallScreen);
    };
    checkTouchDevice();
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    mediaQuery.addEventListener('change', checkTouchDevice);
    return () => mediaQuery.removeEventListener('change', checkTouchDevice);
  }, []);
  
  // Check if column is empty (no cards, only potentially the Add Card button)
  const childrenArray = React.Children.toArray(props.children);
  const isEmpty = childrenArray.length === 0;
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Only toggle on touch devices; on desktop, hover handles it
    if (isTouchDevice) {
      setShowTooltip(prev => !prev);
    }
  };
  
  // Don't show lock if there are cards in columns to the right (progress indication)
  const shouldShowLock = isEmpty && !props.onAddCard && showLock && !props.hasCardsToRight;
  
  return (
    <div ref={setNodeRef} className={`space-y-3 min-h-32 relative ${isOver ? 'outline outline-2 outline-electric-blue/60 outline-offset-2 bg-gray-650/40' : ''}`}>
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
      
      {/* Lock icon and tooltip for empty columns (but not for first column, and only if showLockIcon is true, and no cards to the right) */}
      {shouldShowLock && (
        <div className="absolute inset-x-0 top-[40%] flex justify-center">
          <div 
            className="relative group cursor-pointer"
            onClick={handleClick}
          >
            <Lock className="w-12 h-12 text-gray-500" />
            {/* Tooltip - visible on hover (desktop) or when showTooltip is true (mobile toggle) */}
            <div 
              className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 px-3 py-2 bg-gray-900 border border-light-steel-blue rounded-lg shadow-lg whitespace-nowrap z-10 pointer-events-none transition-opacity duration-200 ${
                isTouchDevice
                  ? (showTooltip ? 'opacity-100 visible' : 'opacity-0 invisible')
                  : 'opacity-0 invisible md:group-hover:opacity-100 md:group-hover:visible'
              }`}
            >
              <span className="text-sm text-white">Drag card to this column to unlock this step</span>
              {/* Tooltip arrow */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0 border-4 border-transparent border-b-gray-900"></div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[1px] border-4 border-transparent border-b-light-steel-blue"></div>
            </div>
          </div>
        </div>
      )}
      
      {/* When empty, provide space to drop */}
      <div className="h-2"></div>
    </div>
  );
}


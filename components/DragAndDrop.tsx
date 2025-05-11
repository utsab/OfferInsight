"use client";

import React, { useState, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

// Generic type to represent any item that can be dragged between columns
export type DraggableItem = {
  id: number;
  status: string;
  [key: string]: any;
};

// Generic type for column IDs
export type ColumnConfig = {
  id: string;
  title: string;
  color: string;
};

// Draggable card component
export const DraggableCard = <T extends DraggableItem>({
  item,
  onEdit,
  renderContent,
}: {
  item: T;
  onEdit: (item: T) => void;
  renderContent: (item: T) => React.ReactNode;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: item.id.toString(),
      data: { item },
    });

  // Track if we have a pending click
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isClicking, setIsClicking] = useState(false);
  const [mouseDownTime, setMouseDownTime] = useState<number | null>(null);

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1,
        cursor: isDragging ? "grabbing" : "pointer",
      }
    : {
        cursor: "pointer",
      };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Clear any existing timeouts
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }

    // Set clicking state to true
    setIsClicking(true);
    setMouseDownTime(Date.now());

    // Start a timer to initiate drag if the mouse is held down
    longPressTimeoutRef.current = setTimeout(() => {
      // This will initiate the drag after the delay
      if (listeners && listeners.onMouseDown) {
        const syntheticEvent = new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          clientX: e.clientX,
          clientY: e.clientY,
        });

        // Now we're ready to start dragging
        e.target.dispatchEvent(syntheticEvent);
      }
    }, 100); // 100ms delay for faster drag initiation
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // Clear the long press timer
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    const mouseUpTime = Date.now();
    const mouseDownDuration = mouseDownTime ? mouseUpTime - mouseDownTime : 0;

    // If press was short (less than 100ms), consider it a click
    if (isClicking && mouseDownDuration < 100 && !isDragging) {
      clickTimeoutRef.current = setTimeout(() => {
        onEdit(item);
      }, 50);
    }

    // Reset clicking state
    setIsClicking(false);
    setMouseDownTime(null);
  };

  // Touch handling for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    // Track touch start time
    setMouseDownTime(Date.now());
    setIsClicking(true);

    // Set a timeout to distinguish between tap and drag
    longPressTimeoutRef.current = setTimeout(() => {
      // Add visual feedback for long press
      const target = e.currentTarget as HTMLElement;
      target.classList.add("touch-dragging");

      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 100);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Clear the long press timer
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    const touchEndTime = Date.now();
    const touchDuration = mouseDownTime ? touchEndTime - mouseDownTime : 0;

    // If it was a short tap (not a drag), open the edit modal
    if (isClicking && touchDuration < 100 && !isDragging) {
      e.currentTarget.classList.remove("touch-dragging");
      onEdit(item);
    }

    // Reset state
    setIsClicking(false);
    setMouseDownTime(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // If finger moves significantly, cancel the click and let dnd-kit handle the drag
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      className="bg-white p-3 mb-2 rounded shadow hover:shadow-md transition-shadow relative group"
    >
      {/* Drag handle icon that appears on hover */}
      <div className="absolute -left-1 top-0 bottom-0 w-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <GripVertical size={16} className="text-gray-400 drag-handle" />
      </div>

      {renderContent(item)}
    </div>
  );
};

// Regular card for drag overlay
export const StaticCard = <T extends DraggableItem>({
  item,
  renderContent,
}: {
  item: T;
  renderContent: (item: T) => React.ReactNode;
}) => (
  <div className="bg-white p-3 mb-2 rounded shadow">{renderContent(item)}</div>
);

// Column component with droppable area
export const Column = <T extends DraggableItem>({
  id,
  title,
  items,
  color,
  onEditItem,
  renderContent,
}: {
  id: string;
  title: string;
  items: T[];
  color: string;
  onEditItem: (item: T) => void;
  renderContent: (item: T) => React.ReactNode;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div className="w-full md:w-80 flex-shrink-0 p-2">
      <div
        className={`rounded-t-lg p-2 ${color} text-white text-center font-semibold`}
      >
        <h2 className="text-sm md:text-base lg:text-lg">{title}</h2>
        <div className="mt-1 text-xs md:text-sm">
          {items.length} {items.length === 1 ? "item" : "items"}
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`bg-gray-100 p-2 rounded-b-lg min-h-[10rem] transition-colors ${
          isOver ? "bg-gray-200" : ""
        }`}
        style={{ minHeight: "200px" }}
      >
        {items.map((item) => (
          <DraggableCard
            key={item.id}
            item={item}
            onEdit={onEditItem}
            renderContent={renderContent}
          />
        ))}
      </div>
    </div>
  );
};

// Main drag and drop board component
export const DragAndDropBoard = <T extends DraggableItem>({
  items,
  columns,
  activeItem,
  onUpdateStatus,
  onEditItem,
  renderContent,
  renderOverlay,
  onDragStart,
  onDragEnd,
}: {
  items: T[];
  columns: ColumnConfig[];
  activeItem: T | null;
  onUpdateStatus: (id: number, status: string) => Promise<void>;
  onEditItem: (item: T) => void;
  renderContent: (item: T) => React.ReactNode;
  renderOverlay: (item: T) => React.ReactNode;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (onDragStart) {
      onDragStart(event);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const newStatus = over.id.toString();
      const itemId = parseInt(active.id.toString());

      await onUpdateStatus(itemId, newStatus);
    }

    if (onDragEnd) {
      onDragEnd(event);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4 max-w-full">
        {columns.map((column) => {
          const columnItems = items.filter((item) => item.status === column.id);

          return (
            <Column
              key={column.id}
              id={column.id}
              title={column.title}
              items={columnItems}
              color={column.color}
              onEditItem={onEditItem}
              renderContent={renderContent}
            />
          );
        })}
      </div>

      <DragOverlay>{activeItem ? renderOverlay(activeItem) : null}</DragOverlay>
    </DndContext>
  );
};

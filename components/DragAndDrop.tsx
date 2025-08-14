"use client";

import React, { useState, useRef, useEffect } from "react";
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

// Draggable card component - simplified for better responsiveness
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

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 1000 : 1,
        cursor: isDragging ? "grabbing" : "grab",
      }
    : {
        cursor: "grab",
      };

  const handleClick = (e: React.MouseEvent) => {
    // Only handle click if not dragging
    if (!isDragging) {
      onEdit(item);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className="bg-white p-3 mb-2 rounded shadow hover:shadow-md transition-shadow relative group select-none"
    >
      {/* Drag handle icon that appears on hover */}
      <div className="absolute -left-1 top-0 bottom-0 w-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <GripVertical size={16} className="text-gray-400" />
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
}) => {
  return (
    <div className="bg-white p-3 rounded shadow opacity-90 transform rotate-3">
      {renderContent(item)}
    </div>
  );
};

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
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div className="flex flex-col min-w-[280px] max-w-[300px] flex-shrink-0">
      <div
        className={`px-4 py-2 rounded-t-lg text-white font-semibold text-center ${color}`}
      >
        {title} ({items.length})
      </div>
      <div
        ref={setNodeRef}
        className="flex-1 min-h-[200px] p-3 bg-gray-100 rounded-b-lg"
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
  // Add local state to manage items during drag operations
  const [localItems, setLocalItems] = useState<T[]>(items);

  // Update local items when props change
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  // Optimized sensor configuration for smooth dragging like Trello
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Start drag after 8px movement - responsive like Trello
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

      // Optimistically update the UI immediately
      setLocalItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, status: newStatus } : item
        )
      );

      try {
        // Then make the API call
        await onUpdateStatus(itemId, newStatus);
      } catch (error) {
        // If the API call fails, revert to the previous state
        console.error("Error updating status:", error);
        setLocalItems(items); // Revert to the original items from props
      }
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
          // Use the local items state instead of props
          const columnItems = localItems.filter(
            (item) => item.status === column.id
          );

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
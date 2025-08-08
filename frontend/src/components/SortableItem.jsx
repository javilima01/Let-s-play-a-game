// src/components/SortableItem.jsx
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * Wraps each sortable element, adding necessary touch-action style to
 * prevent page scrolling on mobile when dragging.
 */
export default function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    touchAction: 'none',      // disable native touch scrolling while dragging
    transform: CSS.Transform.toString(transform),
    transition,
    listStyle: 'none',
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </li>
  );
}

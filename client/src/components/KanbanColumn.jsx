import { useDroppable } from '@dnd-kit/core';

export default function KanbanColumn({ id, label, count, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className="kanban-column"
      style={isOver ? { outline: '2px dashed var(--primary)' } : undefined}
    >
      <h4>
        {label} · {count}
      </h4>
      {children}
    </div>
  );
}

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function KanbanCard({ wp, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: wp.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card${isDragging ? ' dragging' : ''}`}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (!isDragging) onClick?.(e);
      }}
    >
      <div className="title">{wp.title}</div>
      <div className="meta">
        <span className={`priority ${wp.priority}`}>{wp.priority}</span>
        <span>
          {wp.assignee ? wp.assignee.name : 'Unassigned'}
          {wp.dueDate ? ` · due ${wp.dueDate.slice(0, 10)}` : ''}
        </span>
      </div>
    </div>
  );
}

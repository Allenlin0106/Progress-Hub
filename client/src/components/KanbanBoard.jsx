import { useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api/client.js';
import KanbanColumn from './KanbanColumn.jsx';
import KanbanCard from './KanbanCard.jsx';
import WorkPackageForm from './WorkPackageForm.jsx';

const COLUMNS = [
  { id: 'NEW', label: 'New' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'DONE', label: 'Done' },
];

export default function KanbanBoard({ projectId, workPackages, members, loading }) {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const grouped = useMemo(() => {
    const map = { NEW: [], IN_PROGRESS: [], DONE: [] };
    for (const wp of workPackages) map[wp.status]?.push(wp);
    for (const key of Object.keys(map)) map[key].sort((a, b) => a.position - b.position);
    return map;
  }, [workPackages]);

  const moveMutation = useMutation({
    mutationFn: ({ id, status, position }) =>
      apiFetch(`/work-packages/${id}/move`, { method: 'PATCH', body: { status, position } }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['workPackages', projectId] });
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['workPackages', projectId] });
    qc.invalidateQueries({ queryKey: ['project', projectId] });
  };

  const createMutation = useMutation({
    mutationFn: (values) =>
      apiFetch(`/projects/${projectId}/work-packages`, { method: 'POST', body: values }),
    onSuccess: () => {
      invalidate();
      setCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }) =>
      apiFetch(`/work-packages/${id}`, { method: 'PUT', body: values }),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });

  function findContainer(itemId) {
    for (const col of COLUMNS) {
      if (grouped[col.id].some((wp) => wp.id === itemId)) return col.id;
    }
    return null;
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over) return;

    const activeId = Number(active.id);
    const fromStatus = findContainer(activeId);
    if (!fromStatus) return;

    const overIdRaw = String(over.id);
    let toStatus;
    let targetIndex;

    if (COLUMNS.some((c) => c.id === overIdRaw)) {
      toStatus = overIdRaw;
      targetIndex = grouped[toStatus].length;
    } else {
      const overId = Number(overIdRaw);
      toStatus = findContainer(overId);
      if (!toStatus) return;
      targetIndex = grouped[toStatus].findIndex((wp) => wp.id === overId);
      if (targetIndex < 0) targetIndex = grouped[toStatus].length;
    }

    if (fromStatus === toStatus) {
      const currentIndex = grouped[fromStatus].findIndex((wp) => wp.id === activeId);
      if (currentIndex === targetIndex) return;
      const reordered = arrayMove(grouped[fromStatus], currentIndex, targetIndex);
      const finalIndex = reordered.findIndex((wp) => wp.id === activeId);
      moveMutation.mutate({ id: activeId, status: fromStatus, position: finalIndex });
    } else {
      moveMutation.mutate({ id: activeId, status: toStatus, position: targetIndex });
    }
  }

  return (
    <>
      <div className="filters">
        <div style={{ flex: 1 }} />
        <button className="primary" onClick={() => setCreating(true)}>
          New work package
        </button>
      </div>

      {loading && <div className="loading">Loading board…</div>}

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="kanban">
          {COLUMNS.map((col) => (
            <KanbanColumn key={col.id} id={col.id} label={col.label} count={grouped[col.id].length}>
              <SortableContext
                items={grouped[col.id].map((wp) => wp.id)}
                strategy={verticalListSortingStrategy}
              >
                {grouped[col.id].map((wp) => (
                  <KanbanCard key={wp.id} wp={wp} onClick={() => setEditing(wp)} />
                ))}
              </SortableContext>
            </KanbanColumn>
          ))}
        </div>
      </DndContext>

      {creating && (
        <WorkPackageForm
          members={members}
          onClose={() => setCreating(false)}
          onSubmit={(v) => createMutation.mutateAsync(v)}
          submitting={createMutation.isPending}
          error={createMutation.error?.message}
        />
      )}

      {editing && (
        <WorkPackageForm
          initial={editing}
          members={members}
          onClose={() => setEditing(null)}
          onSubmit={(v) => updateMutation.mutateAsync({ id: editing.id, values: v })}
          submitting={updateMutation.isPending}
          error={updateMutation.error?.message}
        />
      )}
    </>
  );
}

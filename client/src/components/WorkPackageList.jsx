import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api/client.js';
import WorkPackageForm from './WorkPackageForm.jsx';

const STATUSES = ['NEW', 'IN_PROGRESS', 'DONE'];

export default function WorkPackageList({ projectId, workPackages, members, loading }) {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);

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

  const deleteMutation = useMutation({
    mutationFn: (id) => apiFetch(`/work-packages/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  const filtered = useMemo(() => {
    return workPackages.filter((wp) => {
      if (statusFilter && wp.status !== statusFilter) return false;
      if (assigneeFilter === 'unassigned' && wp.assigneeId != null) return false;
      if (assigneeFilter && assigneeFilter !== 'unassigned' && wp.assigneeId !== Number(assigneeFilter))
        return false;
      return true;
    });
  }, [workPackages, statusFilter, assigneeFilter]);

  return (
    <>
      <div className="filters">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 160 }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          style={{ width: 220 }}
        >
          <option value="">All assignees</option>
          <option value="unassigned">Unassigned</option>
          {members.map((m) => (
            <option key={m.user.id} value={m.user.id}>
              {m.user.name}
            </option>
          ))}
        </select>
        <div style={{ flex: 1 }} />
        <button className="primary" onClick={() => setCreating(true)}>
          New work package
        </button>
      </div>

      {loading && <div className="loading">Loading…</div>}

      {!loading && filtered.length === 0 && <div className="card empty">No work packages.</div>}

      {!loading && filtered.length > 0 && (
        <table className="wp-list">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Assignee</th>
              <th>Due</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((wp) => (
              <tr key={wp.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{wp.title}</div>
                  {wp.description && (
                    <div style={{ color: 'var(--muted)', fontSize: 12 }}>{wp.description}</div>
                  )}
                </td>
                <td>{wp.status.replace('_', ' ')}</td>
                <td>
                  <span className={`priority ${wp.priority}`}>{wp.priority}</span>
                </td>
                <td>{wp.assignee ? wp.assignee.name : <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                <td>{wp.dueDate ? wp.dueDate.slice(0, 10) : '—'}</td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={() => setEditing(wp)}>Edit</button>
                  <button
                    className="danger"
                    style={{ marginLeft: 6 }}
                    onClick={() => {
                      if (window.confirm('Delete this work package?')) deleteMutation.mutate(wp.id);
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

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

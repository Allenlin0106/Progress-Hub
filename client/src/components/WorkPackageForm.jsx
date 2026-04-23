import { useState } from 'react';

const STATUSES = ['NEW', 'IN_PROGRESS', 'DONE'];
const PRIORITIES = ['LOW', 'NORMAL', 'HIGH'];

export default function WorkPackageForm({ initial, members, onClose, onSubmit, submitting, error }) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [status, setStatus] = useState(initial?.status ?? 'NEW');
  const [priority, setPriority] = useState(initial?.priority ?? 'NORMAL');
  const [assigneeId, setAssigneeId] = useState(
    initial?.assigneeId != null ? String(initial.assigneeId) : '',
  );
  const [dueDate, setDueDate] = useState(initial?.dueDate ? initial.dueDate.slice(0, 10) : '');

  async function handleSubmit(e) {
    e.preventDefault();
    await onSubmit({
      title,
      description: description || null,
      status,
      priority,
      assigneeId: assigneeId ? Number(assigneeId) : null,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <header>
          <h3>{initial ? 'Edit work package' : 'New work package'}</h3>
        </header>

        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />

        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={5000}
        />

        <div className="row">
          <div style={{ flex: 1 }}>
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="row">
          <div style={{ flex: 1 }}>
            <label>Assignee</label>
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.name} ({m.user.email})
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <footer>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </footer>
      </form>
    </div>
  );
}

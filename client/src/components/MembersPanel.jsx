import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api/client.js';

export default function MembersPanel({ projectId, members, canManage, loading }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState('');

  const invalidate = () => qc.invalidateQueries({ queryKey: ['members', projectId] });

  const addMutation = useMutation({
    mutationFn: (value) =>
      apiFetch(`/projects/${projectId}/members`, { method: 'POST', body: { email: value } }),
    onSuccess: () => {
      setEmail('');
      invalidate();
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId) =>
      apiFetch(`/projects/${projectId}/members/${userId}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <div className="card">
      {canManage && (
        <form
          className="row"
          style={{ marginBottom: 16 }}
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) addMutation.mutate(email.trim());
          }}
        >
          <input
            type="email"
            placeholder="Invite by email (user must be registered)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="primary" disabled={addMutation.isPending}>
            {addMutation.isPending ? 'Adding…' : 'Add'}
          </button>
        </form>
      )}
      {addMutation.error && <div className="error">{addMutation.error.message}</div>}

      <div className="members-list">
        {members.map((m) => (
          <div key={m.id} className="row">
            <div>
              <div style={{ fontWeight: 600 }}>{m.user.name}</div>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>{m.user.email}</div>
            </div>
            <div className="row" style={{ alignItems: 'center' }}>
              <span className={`badge ${m.role}`}>{m.role}</span>
              {canManage && m.role !== 'OWNER' && (
                <button
                  className="danger"
                  onClick={() => {
                    if (window.confirm(`Remove ${m.user.name} from this project?`)) {
                      removeMutation.mutate(m.user.id);
                    }
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

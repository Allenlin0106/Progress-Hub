import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api/client.js';
import ProjectFormModal from '../components/ProjectFormModal.jsx';

export default function ProjectsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiFetch('/projects'),
  });

  const createMutation = useMutation({
    mutationFn: (values) => apiFetch('/projects', { method: 'POST', body: values }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      setShowForm(false);
    },
  });

  const projects = data?.projects ?? [];

  return (
    <>
      <div className="toolbar">
        <h2>Projects</h2>
        <button className="primary" onClick={() => setShowForm(true)}>
          New project
        </button>
      </div>

      {isLoading && <div className="loading">Loading projects…</div>}
      {error && <div className="error">{error.message}</div>}

      {!isLoading && projects.length === 0 && (
        <div className="card empty">No projects yet. Create your first one.</div>
      )}

      <div className="project-grid">
        {projects.map((p) => (
          <Link to={`/projects/${p.id}`} key={p.id} className="card project-card">
            <h3>{p.name}</h3>
            <div className="meta">{p.description || 'No description'}</div>
            <div className="meta" style={{ marginTop: 'auto' }}>
              {p._count.workPackages} tasks · {p._count.members} members
            </div>
          </Link>
        ))}
      </div>

      {showForm && (
        <ProjectFormModal
          onClose={() => setShowForm(false)}
          onSubmit={(v) => createMutation.mutateAsync(v)}
          submitting={createMutation.isPending}
          error={createMutation.error?.message}
        />
      )}
    </>
  );
}

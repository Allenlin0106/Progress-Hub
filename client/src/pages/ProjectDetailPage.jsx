import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api/client.js';
import KanbanBoard from '../components/KanbanBoard.jsx';
import WorkPackageList from '../components/WorkPackageList.jsx';
import MembersPanel from '../components/MembersPanel.jsx';
import ProjectFormModal from '../components/ProjectFormModal.jsx';

const TABS = [
  { id: 'kanban', label: 'Kanban' },
  { id: 'list', label: 'List' },
  { id: 'members', label: 'Members' },
];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const projectId = Number(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState('kanban');
  const [editing, setEditing] = useState(false);

  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiFetch(`/projects/${projectId}`),
  });

  const membersQuery = useQuery({
    queryKey: ['members', projectId],
    queryFn: () => apiFetch(`/projects/${projectId}/members`),
  });

  const workPackagesQuery = useQuery({
    queryKey: ['workPackages', projectId],
    queryFn: () => apiFetch(`/projects/${projectId}/work-packages`),
  });

  const updateProject = useMutation({
    mutationFn: (values) =>
      apiFetch(`/projects/${projectId}`, { method: 'PUT', body: values }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      setEditing(false);
    },
  });

  const deleteProject = useMutation({
    mutationFn: () => apiFetch(`/projects/${projectId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      navigate('/projects', { replace: true });
    },
  });

  if (projectQuery.isLoading) return <div className="loading">Loading…</div>;
  if (projectQuery.error) return <div className="error">{projectQuery.error.message}</div>;

  const project = projectQuery.data.project;
  const role = projectQuery.data.role;
  const members = membersQuery.data?.members ?? [];
  const workPackages = workPackagesQuery.data?.workPackages ?? [];
  const isOwner = role === 'OWNER';

  return (
    <>
      <div className="toolbar">
        <div>
          <h2 style={{ marginBottom: 4 }}>{project.name}</h2>
          <div style={{ color: 'var(--muted)' }}>
            {project.description || 'No description'}
          </div>
        </div>
        {isOwner && (
          <div className="row">
            <button onClick={() => setEditing(true)}>Edit</button>
            <button
              className="danger"
              onClick={() => {
                if (window.confirm('Delete this project and all its work packages?')) {
                  deleteProject.mutate();
                }
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'kanban' && (
        <KanbanBoard
          projectId={projectId}
          workPackages={workPackages}
          members={members}
          loading={workPackagesQuery.isLoading}
        />
      )}
      {tab === 'list' && (
        <WorkPackageList
          projectId={projectId}
          workPackages={workPackages}
          members={members}
          loading={workPackagesQuery.isLoading}
        />
      )}
      {tab === 'members' && (
        <MembersPanel
          projectId={projectId}
          members={members}
          canManage={isOwner}
          loading={membersQuery.isLoading}
        />
      )}

      {editing && (
        <ProjectFormModal
          initial={project}
          onClose={() => setEditing(false)}
          onSubmit={(v) => updateProject.mutateAsync(v)}
          submitting={updateProject.isPending}
          error={updateProject.error?.message}
        />
      )}
    </>
  );
}

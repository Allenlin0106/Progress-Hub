import { useState } from 'react';

export default function ProjectFormModal({ initial, onClose, onSubmit, submitting, error }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');

  async function handleSubmit(e) {
    e.preventDefault();
    await onSubmit({ name, description: description || null });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <header>
          <h3>{initial ? 'Edit project' : 'New project'}</h3>
        </header>
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={2000}
        />
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

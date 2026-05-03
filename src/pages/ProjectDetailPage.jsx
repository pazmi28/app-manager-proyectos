import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useProjects from '../hooks/useProjects';
import useChecklist from '../hooks/useChecklist';
import ChecklistItem from '../components/projects/ChecklistItem';

const METHOD_LABELS = {
  'metodologia_v5.1': { label: 'metodologia_v5.1', cls: 'mt-method' },
  'free': { label: 'avance libre', cls: 'mt-free' },
  null: { label: 'sin asignar', cls: 'mt-none' },
};

const STATUS_LABELS = {
  active: { label: 'activo', cls: 'st-active' },
  paused: { label: 'pausado', cls: 'st-paused' },
  done: { label: 'completado', cls: 'st-done' },
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, loading: projLoading, updateProject, archiveProject, deleteProject } = useProjects();
  const project = projects.find(p => p.id === id);

  const {
    itemsByPhase, loading: clLoading, ready: clReady, doneCount, totalCount,
    progress, generateChecklist, toggleItem, togglePhaseNotApplicable, updateNotes,
  } = useChecklist(id);

  // Estado del formulario de edición
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Inicializar formulario cuando project carga
  useEffect(() => {
    if (project) {
      setEditForm({
        name: project.name ?? '',
        stack: project.stack ?? '',
        status: project.status ?? 'active',
        methodology: project.methodology ?? null,
        repoUrl: project.repoUrl ?? '',
        vercelUrl: project.vercelUrl ?? '',
      });
    }
  }, [project?.id]); // eslint-disable-line

  // Generar checklist automáticamente si no existe aún
  useEffect(() => {
    if (!project || project.methodology !== 'metodologia_v5.1') return;
    if (!clReady) return;
    if (totalCount === 0) {
      generateChecklist();
    }
  }, [clReady, totalCount, project?.id, project?.methodology]); // eslint-disable-line

  // Sincronizar progreso de checklist al proyecto
  useEffect(() => {
    if (!project || project.methodology !== 'metodologia_v5.1') return;
    if (clLoading || totalCount === 0) return;
    if (project.progress !== progress) {
      updateProject(id, { progress });
    }
  }, [progress, clLoading, totalCount]); // eslint-disable-line

  async function handleSaveEdit() {
    if (!editForm.name?.trim()) return;
    setSaving(true);
    const result = await updateProject(id, {
      name: editForm.name.trim(),
      stack: editForm.stack.trim(),
      status: editForm.status,
      methodology: editForm.methodology,
      repoUrl: editForm.repoUrl.trim(),
      vercelUrl: editForm.vercelUrl.trim(),
    });
    if (result.success) setEditing(false);
    setSaving(false);
  }

  async function handleArchive() {
    const result = await archiveProject(id);
    if (result.success) navigate('/');
  }

  async function handleDelete() {
    const result = await deleteProject(id);
    if (result.success) navigate('/');
  }

  if (projLoading) {
    return (
      <div className="det-loading">
        <span className="dash-loading-dot" />
        <span className="dash-loading-dot" />
        <span className="dash-loading-dot" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="det-not-found">
        <p>Proyecto no encontrado.</p>
        <Link to="/" className="det-back-link">← Volver al dashboard</Link>
      </div>
    );
  }

  const method = METHOD_LABELS[project.methodology] ?? METHOD_LABELS[null];
  const status = STATUS_LABELS[project.status] ?? STATUS_LABELS['active'];

  return (
    <div className="det-page">

      {/* Header */}
      <div className="det-header">
        <div className="det-header-left">
          <button className="det-back" onClick={() => navigate('/')}>← Dashboard</button>
          {!editing && (
            <>
              <h1 className="det-title">{project.name}</h1>
              <div className="det-meta">
                <span className={`det-method-tag ${method.cls}`}>{method.label}</span>
                <span className={`det-status-pill ${status.cls}`}>{status.label}</span>
                {project.stack && <span className="det-stack">{project.stack}</span>}
              </div>
            </>
          )}
        </div>
        <div className="det-header-right">
          {!editing && (
            <>
              {project.repoUrl && (
                <a className="det-link-btn" href={project.repoUrl} target="_blank" rel="noreferrer">
                  GitHub ↗
                </a>
              )}
              {project.vercelUrl && (
                <a className="det-link-btn" href={project.vercelUrl} target="_blank" rel="noreferrer">
                  Vercel ↗
                </a>
              )}
              <button className="det-edit-btn" onClick={() => setEditing(true)}>
                Editar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Formulario de edición */}
      {editing && (
        <div className="det-panel det-edit-panel">
          <div className="det-edit-title">Editar proyecto</div>

          <div className="det-edit-grid">
            <div className="det-edit-field">
              <label className="det-edit-label">Nombre</label>
              <input
                className="det-edit-input"
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nombre del proyecto"
              />
            </div>

            <div className="det-edit-field">
              <label className="det-edit-label">Stack</label>
              <input
                className="det-edit-input"
                value={editForm.stack}
                onChange={e => setEditForm(f => ({ ...f, stack: e.target.value }))}
                placeholder="Ej: React · Firebase · Vercel"
              />
            </div>

            <div className="det-edit-field">
              <label className="det-edit-label">Estado</label>
              <select
                className="det-edit-select"
                value={editForm.status}
                onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
              >
                <option value="active">Activo</option>
                <option value="paused">Pausado</option>
                <option value="done">Completado</option>
              </select>
            </div>

            <div className="det-edit-field">
              <label className="det-edit-label">Metodología</label>
              <select
                className="det-edit-select"
                value={editForm.methodology ?? ''}
                onChange={e => setEditForm(f => ({ ...f, methodology: e.target.value || null }))}
              >
                <option value="metodologia_v5.1">metodologia_v5.1</option>
                <option value="free">Avance libre</option>
                <option value="">Sin asignar</option>
              </select>
            </div>

            <div className="det-edit-field">
              <label className="det-edit-label">URL GitHub</label>
              <input
                className="det-edit-input"
                value={editForm.repoUrl}
                onChange={e => setEditForm(f => ({ ...f, repoUrl: e.target.value }))}
                placeholder="https://github.com/..."
              />
            </div>

            <div className="det-edit-field">
              <label className="det-edit-label">URL Vercel</label>
              <input
                className="det-edit-input"
                value={editForm.vercelUrl}
                onChange={e => setEditForm(f => ({ ...f, vercelUrl: e.target.value }))}
                placeholder="https://mi-app.vercel.app"
              />
            </div>
          </div>

          <div className="det-edit-footer">
            <div className="det-danger-actions">
              <button
                className="det-archive-btn"
                onClick={() => setConfirmArchive(true)}
              >
                Marcar como completado
              </button>
              <button
                className="det-delete-btn"
                onClick={() => setConfirmDelete(true)}
              >
                Eliminar proyecto
              </button>
            </div>
            {confirmArchive && (
              <div className="det-confirm">
                <span>¿Marcar como completado?</span>
                <button className="det-confirm-yes" onClick={handleArchive}>Confirmar</button>
                <button className="det-confirm-no" onClick={() => setConfirmArchive(false)}>Cancelar</button>
              </div>
            )}
            {confirmDelete && (
              <div className="det-confirm">
                <span>¿Eliminar permanentemente? Esta acción no se puede deshacer.</span>
                <button className="det-confirm-yes" onClick={handleDelete}>Eliminar</button>
                <button className="det-confirm-no" onClick={() => setConfirmDelete(false)}>Cancelar</button>
              </div>
            )}
            <div className="det-edit-actions">
              <button
                className="det-cancel-btn"
                onClick={() => { setEditing(false); setConfirmArchive(false); setConfirmDelete(false); }}
              >
                Cancelar
              </button>
              <button
                className="det-save-btn"
                onClick={handleSaveEdit}
                disabled={saving || !editForm.name?.trim()}
              >
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progreso */}
      {project.methodology === 'metodologia_v5.1' && (
        <div className="det-panel det-progress-panel">
          <div className="det-progress-top">
            <span className="det-progress-label">Progreso total</span>
            <span className="det-progress-pct">
              {clLoading ? '—' : `${doneCount} / ${totalCount} ítems · ${progress}%`}
            </span>
          </div>
          <div className="det-progress-bg">
            <div className="det-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          {project.currentSprint !== undefined && (
            <div className="det-sprint-badge">Sprint {project.currentSprint}</div>
          )}
        </div>
      )}

      {project.methodology === 'free' && (
        <div className="det-panel det-free-panel">
          <span className="det-free-icon">◈</span>
          <div>
            <div className="det-free-title">Avance libre</div>
            <div className="det-free-sub">El progreso se registra con sesiones personalizadas desde la vista "Sesiones".</div>
          </div>
        </div>
      )}

      {project.methodology === null && (
        <div className="det-panel det-none-panel">
          <span className="det-none-icon">○</span>
          <div>
            <div className="det-none-title">Sin metodología asignada</div>
            <div className="det-none-sub">Asigna una metodología al proyecto para activar el seguimiento de progreso.</div>
          </div>
        </div>
      )}

      {/* Checklist */}
      {project.methodology === 'metodologia_v5.1' && (
        <div className="det-panel det-checklist-panel">
          <div className="det-section-title">Checklist de sprints</div>
          {clLoading ? (
            <div className="det-cl-loading">Generando checklist…</div>
          ) : (
            Object.entries(itemsByPhase).map(([phase, phaseItems]) => (
              <div key={phase} className={`det-phase ${phaseItems.every(i => i.notApplicable) ? 'det-phase-na' : ''}`}>
                <div className="det-phase-header">
                  <span className="det-phase-title">{phase}</span>
                  <div className="det-phase-header-right">
                    {!phaseItems.every(i => i.notApplicable) && (
                      <span className="det-phase-count">
                        {phaseItems.filter(i => i.done).length}/{phaseItems.filter(i => !i.notApplicable).length}
                      </span>
                    )}
                    <button
                      className={`det-phase-na-btn ${phaseItems.every(i => i.notApplicable) ? 'active' : ''}`}
                      onClick={() => togglePhaseNotApplicable(phase, phaseItems)}
                      title={phaseItems.every(i => i.notApplicable) ? 'Reactivar fase' : 'Marcar como no aplica'}
                    >
                      {phaseItems.every(i => i.notApplicable) ? 'reactivar' : 'no aplica'}
                    </button>
                  </div>
                </div>
                {phaseItems.map(item => (
                  <ChecklistItem
                    key={item.id}
                    item={item}
                    onToggle={toggleItem}
                    onUpdateNotes={updateNotes}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
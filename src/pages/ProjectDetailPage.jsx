import { useEffect } from 'react';
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
  const { projects, loading: projLoading, updateProject } = useProjects();
  const project = projects.find(p => p.id === id);

  const {
    itemsByPhase, loading: clLoading, doneCount, totalCount,
    progress, generateChecklist, toggleItem, togglePhaseNotApplicable, updateNotes,
  } = useChecklist(project?.methodology === 'metodologia_v5.1' ? id : null);

  // Generar checklist automáticamente si no existe aún
  useEffect(() => {
    if (!project || project.methodology !== 'metodologia_v5.1') return;
    if (clLoading) return;
    if (totalCount === 0) {
      generateChecklist();
    }
  }, [clLoading, totalCount]); // eslint-disable-line

  // Sincronizar progreso de checklist al proyecto
  useEffect(() => {
    if (!project || project.methodology !== 'metodologia_v5.1') return;
    if (clLoading || totalCount === 0) return;
    if (project.progress !== progress) {
      updateProject(id, { progress });
    }
  }, [progress, clLoading, totalCount]); // eslint-disable-line

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
          <h1 className="det-title">{project.name}</h1>
          <div className="det-meta">
            <span className={`det-method-tag ${method.cls}`}>{method.label}</span>
            <span className={`det-status-pill ${status.cls}`}>{status.label}</span>
            {project.stack && <span className="det-stack">{project.stack}</span>}
          </div>
        </div>
        <div className="det-header-right">
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
        </div>
      </div>

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
// src/components/projects/ProjectCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const STATUS_LABELS = { active: 'activo', paused: 'pausado', done: 'archivado' };
const STATUS_CLASS  = { active: 'st-active', paused: 'st-paused', done: 'st-done' };

const METHOD_LABELS = {
  'metodologia_v5.1': 'metodologia_v5.1',
  free: 'avance libre',
  null: 'sin metodología',
};
const METHOD_CLASS = {
  'metodologia_v5.1': 'mt-method',
  free: 'mt-free',
  null: 'mt-none',
};

function formatDate(ts) {
  if (!ts) return null;
  const d = ts?.toDate?.() ?? new Date(ts);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  if (diff < 7) return `Hace ${diff} días`;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function ProjectCard({ project }) {
  const navigate = useNavigate();
  const methodKey = project.methodology ?? 'null';

  return (
    <div
      className="proj-card"
      onClick={() => navigate(`/project/${project.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/project/${project.id}`)}
    >
      <div className="proj-card-header">
        <div className="proj-card-info">
          <span className="proj-card-name">{project.name}</span>
          <span className="proj-card-stack">{project.stack}</span>
        </div>
        <span className={`proj-status ${STATUS_CLASS[project.status] ?? 'st-paused'}`}>
          {STATUS_LABELS[project.status] ?? project.status}
        </span>
      </div>

      <span className={`proj-method-tag ${METHOD_CLASS[methodKey]}`}>
        {METHOD_LABELS[methodKey]}
      </span>

      <div className="proj-progress-wrap">
        <div className="proj-progress-meta">
          <span>
            {project.methodology === 'metodologia_v5.1'
              ? `Sprint ${project.currentSprint ?? 0}`
              : project.methodology === 'free'
              ? 'Avance personalizado'
              : '—'}
          </span>
          <span>
            {project.methodology ? `${project.progress ?? 0}%` : '—'}
          </span>
        </div>
        <div className="proj-progress-bg">
          <div
            className={`proj-progress-fill${project.methodology === 'free' ? ' free' : ''}`}
            style={{ width: project.methodology ? `${project.progress ?? 0}%` : '0%' }}
          />
        </div>
      </div>

      {project.updatedAt && (
        <div className="proj-card-last">
          {formatDate(project.updatedAt)}
          {project.lastSummary ? ` · ${project.lastSummary}` : ''}
        </div>
      )}
    </div>
  );
}

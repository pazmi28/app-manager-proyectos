// src/pages/DashboardPage.jsx
import { useNavigate } from 'react-router-dom';
import useProjects from '../hooks/useProjects';
import ProjectCard from '../components/projects/ProjectCard';

export default function DashboardPage() {
  const { projects, loading, stats } = useProjects();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-loading-dot" />
        <div className="dash-loading-dot" />
        <div className="dash-loading-dot" />
      </div>
    );
  }

  return (
    <div className="dash-root">

      <div className="dash-stats-row">
        <div className="dash-stat">
          <div className="dash-stat-label">Proyectos activos</div>
          <div className="dash-stat-val">{stats.active}</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-label">Progreso medio</div>
          <div className="dash-stat-val">{stats.avgProgress}%</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-label">Total proyectos</div>
          <div className="dash-stat-val">{projects.length}</div>
        </div>
        <div className="dash-stat">
          <div className="dash-stat-label">Última actividad</div>
          <div className="dash-stat-val dash-stat-val--sm">
            {projects.length ? 'Hoy' : '—'}
          </div>
        </div>
      </div>

      <div className="dash-section-header">
        <span className="dash-section-title">Proyectos</span>
        <button
          className="dash-btn-new"
          onClick={() => navigate('/new-project')}
        >
          + Nuevo proyecto
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="dash-empty">
          <div className="dash-empty-icon">◈</div>
          <p className="dash-empty-title">Sin proyectos todavía</p>
          <p className="dash-empty-sub">Crea tu primer proyecto para empezar a registrar avances</p>
          <button
            className="dash-btn-new dash-btn-new--lg"
            onClick={() => navigate('/new-project')}
          >
            + Crear primer proyecto
          </button>
        </div>
      ) : (
        <div className="dash-grid">
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

    </div>
  );
}

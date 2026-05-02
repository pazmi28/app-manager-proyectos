// src/pages/NewProjectPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useProjects from '../hooks/useProjects';

const METHODOLOGY_OPTIONS = [
  {
    value: 'metodologia_v5.1',
    title: 'Metodología de desarrollo v5.1',
    desc: 'Sprints 0–7 con checklist automática. React + Firebase + Claude Code. Para proyectos web con el stack habitual.',
  },
  {
    value: 'free',
    title: 'Avance libre',
    desc: 'Sin sprints definidos. El progreso se registra con sesiones personalizadas. Ideal para aprendizaje o proyectos experimentales.',
  },
  {
    value: null,
    title: 'Sin asignar por ahora',
    desc: 'Crea el proyecto y decide la metodología más adelante cuando tengas el planning definido.',
  },
];

export default function NewProjectPage() {
  const { addProject } = useProjects();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [stack, setStack] = useState('');
  const [status, setStatus] = useState('active');
  const [methodology, setMethodology] = useState('metodologia_v5.1');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    const result = await addProject({
      name: name.trim(),
      stack: stack.trim(),
      status,
      methodology: methodology === 'null' ? null : methodology,
      description: '',
      repoUrl: '',
      vercelUrl: '',
    });
    setSubmitting(false);
    if (result.success) navigate('/dashboard');
  };

  return (
    <div className="np-bg">
      <div className="np-modal">
        <div className="np-title">Nuevo proyecto</div>
        <div className="np-sub">Rellena lo que sepas ahora. Puedes editar el resto después.</div>

        <div className="np-field">
          <label className="np-label">Nombre del proyecto</label>
          <input
            className="np-input"
            type="text"
            placeholder="Ej: Task Manager API"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="np-field">
          <label className="np-label">Stack / tecnologías</label>
          <input
            className="np-input"
            type="text"
            placeholder="Ej: React · Firebase · Vercel"
            value={stack}
            onChange={e => setStack(e.target.value)}
          />
        </div>

        <div className="np-field">
          <label className="np-label">Estado inicial</label>
          <select
            className="np-select"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="active">Activo</option>
            <option value="paused">Pausado</option>
            <option value="done">Archivado</option>
          </select>
        </div>

        <div className="np-field">
          <label className="np-label">Metodología</label>
          <div className="np-method-options">
            {METHODOLOGY_OPTIONS.map(opt => {
              const key = String(opt.value);
              const selected = String(methodology) === key;
              return (
                <div
                  key={key}
                  className={`np-method-option${selected ? ' selected' : ''}`}
                  onClick={() => setMethodology(opt.value)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setMethodology(opt.value)}
                >
                  <div className="np-method-title">{opt.title}</div>
                  <div className="np-method-desc">{opt.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="np-footer">
          <button
            className="np-btn-cancel"
            onClick={() => navigate('/dashboard')}
          >
            Cancelar
          </button>
          <button
            className="np-btn-create"
            onClick={handleSubmit}
            disabled={!name.trim() || submitting}
          >
            {submitting ? 'Creando...' : 'Crear proyecto'}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  doc, updateDoc, serverTimestamp, writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import useSessions from '../hooks/useSessions';
import useProjects from '../hooks/useProjects';
import useAuth from '../hooks/useAuth';

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts?.toDate?.() ?? new Date(ts);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  if (diff < 7) return `Hace ${diff} días`;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Hook interno para cargar checklist de un proyecto concreto
function useProjectChecklist(projectId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) { setItems([]); return; }
    setLoading(true);
    const q = query(
      collection(db, 'projects', projectId, 'checklist'),
      orderBy('order', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [projectId]);

  return { items, loading };
}

export default function SessionsPage() {
  const { projects, loading: projLoading } = useProjects();
  const { sessions, loading: sessLoading, addSession, deleteSession } = useSessions();
  const { user } = useAuth();

  const [selectedProject, setSelectedProject] = useState('');
  const [tab, setTab] = useState('custom');
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Ítems seleccionados de la checklist para marcar en esta sesión
  const [selectedItems, setSelectedItems] = useState([]);

  const selectedProjectObj = projects.find(p => p.id === selectedProject);
  const isMethodology = selectedProjectObj?.methodology === 'metodologia_v5.1';

  // Cargar checklist solo si el proyecto tiene metodología v5.1 y tab es checklist
  const { items: checklistItems, loading: clLoading } =
    useProjectChecklist(isMethodology && tab === 'checklist' ? selectedProject : null);

  // Ítems pendientes (no done, no notApplicable)
  const pendingItems = checklistItems.filter(i => !i.done && !i.notApplicable);
  // Agrupar pendientes por fase
  const pendingByPhase = pendingItems.reduce((acc, item) => {
    if (!acc[item.phase]) acc[item.phase] = [];
    acc[item.phase].push(item);
    return acc;
  }, {});

  // Reset al cambiar proyecto
  useEffect(() => {
    setSelectedItems([]);
    setSummary('');
    setTags('');
    // Si el proyecto no tiene metodología, forzar tab custom
    if (selectedProjectObj && selectedProjectObj.methodology !== 'metodologia_v5.1') {
      setTab('custom');
    }
  }, [selectedProject]);

  function toggleItemSelect(itemId) {
    setSelectedItems(prev =>
      prev.includes(itemId) ? prev.filter(i => i !== itemId) : [...prev, itemId]
    );
  }

  async function handleSubmit() {
    if (!selectedProject) return;
    if (tab === 'custom' && !summary.trim()) return;
    if (tab === 'checklist' && selectedItems.length === 0 && !summary.trim()) return;

    setSaving(true);
    const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);

    // Construir resumen automático si es checklist y no hay texto
    let finalSummary = summary.trim();
    if (tab === 'checklist' && selectedItems.length > 0 && !finalSummary) {
      const names = checklistItems
        .filter(i => selectedItems.includes(i.id))
        .map(i => i.item);
      finalSummary = names.join(' · ');
    }

    const result = await addSession({
      projectId: selectedProject,
      summary: finalSummary,
      type: tab,
      tags: tagsArray,
      itemsCompleted: selectedItems,
    });

    // Marcar ítems como done en Firestore
    if (result.success && selectedItems.length > 0) {
      try {
        const batch = writeBatch(db);
        selectedItems.forEach(itemId => {
          const ref = doc(db, 'projects', selectedProject, 'checklist', itemId);
          batch.update(ref, {
            done: true,
            completedAt: serverTimestamp(),
          });
        });
        await batch.commit();
      } catch {
        // silencioso
      }
    }

    if (result.success) {
      setSummary('');
      setTags('');
      setSelectedItems([]);
    }
    setSaving(false);
  }

  const filteredSessions = filterProject
    ? sessions.filter(s => s.projectId === filterProject)
    : sessions;

  const getProjectName = (id) => projects.find(p => p.id === id)?.name ?? '—';
  const activeProjects = projects.filter(p => p.status === 'active');

  return (
    <div className="sess-page">

      {/* Formulario */}
      <div className="sess-panel">
        <div className="sess-panel-title">Registrar sesión</div>

        <div className="sess-field-label">Proyecto</div>
        <select
          className="sess-select"
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
        >
          <option value="">Selecciona un proyecto…</option>
          {activeProjects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Tabs — solo si el proyecto tiene metodología */}
        {isMethodology && (
          <div className="sess-tabs">
            <button
              className={`sess-tab ${tab === 'checklist' ? 'active' : ''}`}
              onClick={() => setTab('checklist')}
            >
              Checklist de sprint
            </button>
            <button
              className={`sess-tab ${tab === 'custom' ? 'active' : ''}`}
              onClick={() => setTab('custom')}
            >
              Avance personalizado
            </button>
          </div>
        )}

        {/* Tab checklist — ítems reales del proyecto */}
        {tab === 'checklist' && isMethodology && (
          <div className="sess-cl-wrap">
            {clLoading ? (
              <div className="sess-cl-loading">Cargando checklist…</div>
            ) : pendingItems.length === 0 ? (
              <div className="sess-cl-empty">
                ✓ Todos los ítems completados o no aplica
              </div>
            ) : (
              Object.entries(pendingByPhase).map(([phase, items]) => (
                <div key={phase} className="sess-cl-phase">
                  <div className="sess-cl-phase-title">{phase}</div>
                  {items.map(item => (
                    <label key={item.id} className="sess-cl-item">
                      <input
                        type="checkbox"
                        className="sess-cl-checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleItemSelect(item.id)}
                      />
                      <span className={`sess-cl-text ${selectedItems.includes(item.id) ? 'selected' : ''}`}>
                        {item.item}
                      </span>
                    </label>
                  ))}
                </div>
              ))
            )}

            <div className="sess-field-label" style={{ marginTop: 16 }}>
              Notas adicionales <span className="sess-field-hint">(opcional)</span>
            </div>
            <textarea
              className="sess-textarea"
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="Ej: El deploy tardó más de lo esperado por un conflicto de versiones."
              rows={3}
            />
          </div>
        )}

        {/* Tab avance personalizado */}
        {tab === 'custom' && (
          <>
            <div className="sess-field-label">¿Qué trabajaste hoy?</div>
            <textarea
              className="sess-textarea"
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="Ej: Ajustes en el layout, revisión de reglas Firestore y primer deploy en Vercel."
              rows={4}
            />
          </>
        )}

        <div className="sess-field-label">
          Tags <span className="sess-field-hint">(separados por coma)</span>
        </div>
        <input
          type="text"
          className="sess-input"
          value={tags}
          onChange={e => setTags(e.target.value)}
          placeholder="Ej: Sprint 2, Auth, Deploy"
        />

        <div className="sess-form-footer">
          {tab === 'checklist' && selectedItems.length > 0 && (
            <span className="sess-selected-count">
              {selectedItems.length} ítem{selectedItems.length > 1 ? 's' : ''} seleccionado{selectedItems.length > 1 ? 's' : ''}
            </span>
          )}
          <button
            className="sess-btn-primary"
            onClick={handleSubmit}
            disabled={saving || !selectedProject}
          >
            {saving ? 'Guardando…' : 'Guardar sesión'}
          </button>
        </div>
      </div>

      {/* Historial */}
      <div className="sess-panel">
        <div className="sess-log-header">
          <div className="sess-panel-title">Historial de sesiones</div>
          <select
            className="sess-select sess-filter-select"
            value={filterProject}
            onChange={e => setFilterProject(e.target.value)}
          >
            <option value="">Todos los proyectos</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {sessLoading ? (
          <div className="sess-loading">
            <span className="dash-loading-dot" />
            <span className="dash-loading-dot" />
            <span className="dash-loading-dot" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="sess-empty">No hay sesiones registradas aún.</div>
        ) : (
          filteredSessions.map(s => (
            <div key={s.id} className="sess-entry">
              <div className="sess-entry-header">
                <div className="sess-entry-left">
                  <span className="sess-entry-date">{formatDate(s.date)}</span>
                  <span className="sess-entry-project">{getProjectName(s.projectId)}</span>
                  <span className={`sess-source ${s.source === 'mcp' ? 'src-mcp' : 'src-web'}`}>
                    {s.source === 'mcp' ? 'via MCP' : 'manual'}
                  </span>
                </div>
                <button
                  className="sess-delete-btn"
                  onClick={() => setConfirmDelete(s.id)}
                >×</button>
              </div>
              <div className="sess-entry-text">{s.summary}</div>
              {s.tags?.length > 0 && (
                <div className="sess-tags">
                  {s.tags.map(t => <span key={t} className="sess-tag">{t}</span>)}
                </div>
              )}
              {s.itemsCompleted?.length > 0 && (
                <div className="sess-items-badge">
                  {s.itemsCompleted.length} ítem{s.itemsCompleted.length > 1 ? 's' : ''} de checklist completado{s.itemsCompleted.length > 1 ? 's' : ''}
                </div>
              )}
              {confirmDelete === s.id && (
                <div className="sess-confirm">
                  <span>¿Eliminar esta sesión?</span>
                  <button className="sess-confirm-yes" onClick={() => { deleteSession(s.id); setConfirmDelete(null); }}>Eliminar</button>
                  <button className="sess-confirm-no" onClick={() => setConfirmDelete(null)}>Cancelar</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
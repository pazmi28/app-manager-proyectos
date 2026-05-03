import { useState, useEffect, useCallback } from 'react';
import {
  collection, doc, onSnapshot, writeBatch,
  updateDoc, serverTimestamp, query, orderBy
} from 'firebase/firestore';
import { db } from '../firebase/config';
import useAuth from './useAuth';
import toast from 'react-hot-toast';

// Checklist automática para metodologia_v5.1
const CHECKLIST_TEMPLATE = [
  // Sprint 0 — Discovery (obligatorio siempre)
  { phase: 'Sprint 0', item: 'Sprint Plan completo definido', order: 0 },
  { phase: 'Sprint 0', item: 'Modelo de datos Firestore — colecciones definidas', order: 1 },
  { phase: 'Sprint 0', item: 'Proyecto Firebase creado — Auth email + Firestore activados', order: 2 },
  { phase: 'Sprint 0', item: 'Entorno de desarrollo creado (CodeSandbox / local)', order: 3 },
  { phase: 'Sprint 0', item: 'Mockup visual aprobado con sistema de diseño', order: 4 },

  // Sprint 1 — Setup + Auth + Layout
  { phase: 'Sprint 1', item: 'src/firebase/config.js configurado', order: 5 },
  { phase: 'Sprint 1', item: 'AuthContext con onAuthStateChanged + patrón !loading', order: 6 },
  { phase: 'Sprint 1', item: 'Login y Register con email/password', order: 7 },
  { phase: 'Sprint 1', item: 'Layout base — topbar/sidebar + navegación', order: 8 },
  { phase: 'Sprint 1', item: 'global.css con tokens del mockup', order: 9 },
  { phase: 'Sprint 1', item: 'Rutas protegidas PrivateRoute + PublicRoute + catch-all', order: 10 },
  { phase: 'Sprint 1', item: 'Reglas Firestore con request.auth != null', order: 11 },

  // Sprint 2 — CRUD entidad principal + Dashboard
  { phase: 'Sprint 2', item: 'Hook principal — CRUD completo + onSnapshot tiempo real', order: 12 },
  { phase: 'Sprint 2', item: 'Dashboard con tarjetas de entidad principal', order: 13 },
  { phase: 'Sprint 2', item: 'Formulario de creación de entidad principal', order: 14 },
  { phase: 'Sprint 2', item: 'Stats row en dashboard', order: 15 },
  { phase: 'Sprint 2', item: 'Empty state diseñado con CTA', order: 16 },
  { phase: 'Sprint 2', item: 'Índices compuestos Firestore creados', order: 17 },

  // Sprint 3 — Vista detalle + Subcolecciones
  { phase: 'Sprint 3', item: 'Vista detalle de entidad con navegación', order: 18 },
  { phase: 'Sprint 3', item: 'Subcolección o entidad secundaria implementada', order: 19 },
  { phase: 'Sprint 3', item: 'Progreso o estado recalculado automáticamente', order: 20 },

  // Sprint 4 — Features core adicionales
  { phase: 'Sprint 4', item: 'Feature core 1 — definida en Discovery', order: 21 },
  { phase: 'Sprint 4', item: 'Feature core 2 — definida en Discovery', order: 22 },
  { phase: 'Sprint 4', item: 'Feature core 3 — definida en Discovery', order: 23 },

  // Sprint 5 — Dashboard analytics / Gráficos
  { phase: 'Sprint 5', item: 'KPIs y métricas principales en dashboard', order: 24 },
  { phase: 'Sprint 5', item: 'Gráficos de evolución (Recharts)', order: 25 },
  { phase: 'Sprint 5', item: 'Filtros por periodo o categoría', order: 26 },

  // Sprint 6 — Export / Import + Config
  { phase: 'Sprint 6', item: 'Export JSON con estructura versionada', order: 27 },
  { phase: 'Sprint 6', item: 'Import con validación y compatibilidad de formato', order: 28 },
  { phase: 'Sprint 6', item: 'ConfigPage — preferencias de usuario', order: 29 },

  // Sprint 7 — Features secundarias / Nice-to-have
  { phase: 'Sprint 7', item: 'Feature secundaria 1 — definida en Discovery', order: 30 },
  { phase: 'Sprint 7', item: 'Feature secundaria 2 — definida en Discovery', order: 31 },

  // Sprint Trial — Sistema de acceso
  { phase: 'Sprint Trial', item: 'useTrialStatus hook — cálculo de días restantes', order: 32 },
  { phase: 'Sprint Trial', item: 'BannerTrial en topbar con color según días', order: 33 },
  { phase: 'Sprint Trial', item: 'Pantalla TrialExpirado con botón de contacto', order: 34 },
  { phase: 'Sprint Trial', item: 'Campo trialIlimitado: true activable desde Firebase', order: 35 },

  // Sprint Admin — Panel de gestión (opcional)
  { phase: 'Sprint Admin', item: 'Vista /admin protegida por rol isAdmin', order: 36 },
  { phase: 'Sprint Admin', item: 'Lista de usuarios con estado trial/suscripción', order: 37 },
  { phase: 'Sprint Admin', item: 'Botones activar/desactivar suscripción', order: 38 },

  // Sprint Deploy — Producción
  { phase: 'Sprint Deploy', item: 'Repositorio GitHub creado como PRIVATE', order: 39 },
  { phase: 'Sprint Deploy', item: 'Vercel conectado a rama main — Node.js 20.x', order: 40 },
  { phase: 'Sprint Deploy', item: 'Deploy en producción verificado — Auth, Firestore, rutas', order: 41 },
  { phase: 'Sprint Deploy', item: 'Polish — favicon, título pestaña, meta description', order: 42 },
  { phase: 'Sprint Deploy', item: 'Responsive verificado — mobile 390px y desktop 1200px', order: 43 },
  { phase: 'Sprint Deploy', item: 'Reglas Firebase granulares por userId', order: 44 },
];

export default function useChecklist(projectId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !projectId) {
      setItems([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, 'projects', projectId, 'checklist'),
      orderBy('order', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => {
      toast.error('Error al cargar checklist');
      setLoading(false);
    });
    return () => unsub();
  }, [user, projectId]);

  // Genera la checklist automática en Firestore si aún no existe
  const generateChecklist = useCallback(async () => {
    if (!user || !projectId) return;
    try {
      const batch = writeBatch(db);
      CHECKLIST_TEMPLATE.forEach((tpl) => {
        const ref = doc(collection(db, 'projects', projectId, 'checklist'));
        batch.set(ref, {
          ...tpl,
          done: false,
          notApplicable: false,
          completedAt: null,
          notes: '',
          createdAt: serverTimestamp(),
        });
      });
      await batch.commit();
    } catch {
      toast.error('Error al generar checklist');
    }
  }, [user, projectId]);

  const toggleItem = useCallback(async (itemId, currentDone) => {
    try {
      const ref = doc(db, 'projects', projectId, 'checklist', itemId);
      await updateDoc(ref, {
        done: !currentDone,
        completedAt: !currentDone ? serverTimestamp() : null,
      });
    } catch {
      toast.error('Error al actualizar ítem');
    }
  }, [projectId]);

  const togglePhaseNotApplicable = useCallback(async (phase, phaseItems) => {
    const allNA = phaseItems.every(i => i.notApplicable);
    try {
      const batch = writeBatch(db);
      phaseItems.forEach(item => {
        const ref = doc(db, 'projects', projectId, 'checklist', item.id);
        batch.update(ref, {
          notApplicable: !allNA,
          done: false,
          completedAt: null,
        });
      });
      await batch.commit();
    } catch {
      toast.error('Error al actualizar fase');
    }
  }, [projectId]);

  const updateNotes = useCallback(async (itemId, notes) => {
    try {
      const ref = doc(db, 'projects', projectId, 'checklist', itemId);
      await updateDoc(ref, { notes });
    } catch {
      toast.error('Error al guardar notas');
    }
  }, [projectId]);

  // Agrupa ítems por fase
  const itemsByPhase = items.reduce((acc, item) => {
    if (!acc[item.phase]) acc[item.phase] = [];
    acc[item.phase].push(item);
    return acc;
  }, {});

  const applicableItems = items.filter(i => !i.notApplicable);
  const doneCount = applicableItems.filter(i => i.done).length;
  const totalCount = applicableItems.length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

   return {
    items,
    itemsByPhase,
    loading,
    doneCount,
    totalCount,
    progress,
    generateChecklist,
    toggleItem,
    togglePhaseNotApplicable,
    updateNotes,
  };
}
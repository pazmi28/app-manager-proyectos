// src/hooks/useProjects.js
import { useState, useEffect, useCallback } from 'react';
import {
  collection, query, where, orderBy,
  onSnapshot, addDoc, updateDoc, doc,
  serverTimestamp
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { db } from '../firebase/config';
import useAuth from './useAuth';

export default function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setProjects([]); setLoading(false); return; }

    const q = query(
      collection(db, 'projects'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      toast.error('Error al cargar proyectos');
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const addProject = useCallback(async (data) => {
    try {
      await addDoc(collection(db, 'projects'), {
        ...data,
        userId: user.uid,
        progress: 0,
        currentSprint: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success('Proyecto creado');
      return { success: true };
    } catch {
      toast.error('Error al crear el proyecto');
      return { success: false };
    }
  }, [user]);

  const updateProject = useCallback(async (id, data) => {
    try {
      await updateDoc(doc(db, 'projects', id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      toast.success('Proyecto actualizado');
      return { success: true };
    } catch {
      toast.error('Error al actualizar el proyecto');
      return { success: false };
    }
  }, []);

  const archiveProject = useCallback(async (id) => {
    try {
      await updateDoc(doc(db, 'projects', id), {
        status: 'done',
        updatedAt: serverTimestamp(),
      });
      toast.success('Proyecto archivado');
      return { success: true };
    } catch {
      toast.error('Error al archivar el proyecto');
      return { success: false };
    }
  }, []);

  const stats = {
    active: projects.filter(p => p.status === 'active').length,
    avgProgress: projects.length
      ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length)
      : 0,
  };

  const updateLastSummary = useCallback(async (projectId, summary) => {
    try {
      const ref = doc(db, 'projects', projectId);
      await updateDoc(ref, {
        lastSummary: summary,
        updatedAt: serverTimestamp(),
      });
    } catch {
      // silencioso — no crítico
    }
  }, []);

  return { projects, loading, stats, addProject, updateProject, archiveProject, updateLastSummary };
}

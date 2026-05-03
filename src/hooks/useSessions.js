import { useState, useEffect, useCallback } from 'react';
import {
    collection, addDoc, onSnapshot, query,
    where, orderBy, serverTimestamp, doc, deleteDoc, updateDoc
  } from 'firebase/firestore';
import { db } from '../firebase/config';
import useAuth from './useAuth';
import toast from 'react-hot-toast';

export default function useSessions(projectId = null) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) { setSessions([]); setLoading(false); return; }

    const constraints = [
      where('userId', '==', user.uid),
      orderBy('date', 'desc'),
    ];
    if (projectId) constraints.splice(1, 0, where('projectId', '==', projectId));

    const q = query(collection(db, 'sessions'), ...constraints);
    const unsub = onSnapshot(q, (snap) => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => {
      toast.error('Error al cargar sesiones');
      setLoading(false);
    });
    return () => unsub();
  }, [user, projectId]);

  const addSession = useCallback(async (data) => {
    try {
      await addDoc(collection(db, 'sessions'), {
        ...data,
        userId: user.uid,
        date: serverTimestamp(),
        source: 'web',
      });
      // Actualizar lastSummary y updatedAt en el proyecto
      if (data.projectId) {
        const projRef = doc(db, 'projects', data.projectId);
        await updateDoc(projRef, {
          lastSummary: data.summary.slice(0, 80),
          updatedAt: serverTimestamp(),
        });
      }
      toast.success('Sesión registrada');
      return { success: true };
    } catch {
      toast.error('Error al guardar sesión');
      return { success: false };
    }
  }, [user]);


  const deleteSession = useCallback(async (sessionId) => {
    try {
      await deleteDoc(doc(db, 'sessions', sessionId));
      toast.success('Sesión eliminada');
    } catch {
      toast.error('Error al eliminar sesión');
    }
  }, []);

  // Sesiones del mes actual
  const sessionsThisMonth = sessions.filter(s => {
    const d = s.date?.toDate?.() ?? new Date(s.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  return { sessions, loading, sessionsThisMonth, addSession, deleteSession };
}
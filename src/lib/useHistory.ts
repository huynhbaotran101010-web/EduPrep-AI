import { useState, useCallback } from 'react';
import { db, auth } from './firebase';
import { collection, addDoc, query, getDocs, orderBy, Timestamp } from 'firebase/firestore';

export interface Attempt {
  id?: string;
  userId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: Date;
  analysis: string;
  results: any[];
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function useHistory() {
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  const saveAttempt = useCallback(async (attempt: Omit<Attempt, 'id' | 'userId' | 'completedAt'>) => {
    if (!auth.currentUser) return;
    
    setLoading(true);
    const path = `users/${auth.currentUser.uid}/attempts`;
    try {
      const docRef = await addDoc(collection(db, path), {
        ...attempt,
        userId: auth.currentUser.uid,
        completedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!auth.currentUser) return;
    
    setLoading(true);
    const path = `users/${auth.currentUser.uid}/attempts`;
    try {
      const q = query(
        collection(db, path),
        orderBy('completedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completedAt: (doc.data().completedAt as Timestamp).toDate(),
      })) as Attempt[];
      setAttempts(history);
      return history;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    } finally {
      setLoading(false);
    }
  }, []);

  return { saveAttempt, fetchHistory, attempts, loading };
}

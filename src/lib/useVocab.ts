import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  updateDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { useAuth } from './AuthContext';

export interface Word {
  id: string;
  word: string;
  definition: string;
  example: string;
  phonetic?: string;
  userId: string;
  nextReview: any;
  interval: number;
  easeFactor: number;
  step: number;
  status: 'new' | 'learning' | 'mastered';
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

export function useVocab() {
  const { user } = useAuth();
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWords([]);
      setLoading(false);
      return;
    }

    const path = `users/${user.uid}/vocabulary`;
    const q = query(
      collection(db, path),
      orderBy('word', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const wordsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Word[];
      setWords(wordsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [user]);

  const addWord = async (wordData: Partial<Word>) => {
    if (!user) return;
    const path = `users/${user.uid}/vocabulary`;
    try {
      await addDoc(collection(db, path), {
        ...wordData,
        userId: user.uid,
        nextReview: serverTimestamp(),
        interval: 0,
        easeFactor: 2.5,
        step: 0,
        status: 'new',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const updateWordSrs = async (wordId: string, rating: number) => {
    if (!user) return;
    const word = words.find(w => w.id === wordId);
    if (!word) return;

    let { interval, easeFactor, step } = word;
    
    if (rating >= 3) {
      if (step === 0) interval = 1;
      else if (step === 1) interval = 6;
      else interval = Math.round(interval * easeFactor);
      step += 1;
    } else {
      step = 0;
      interval = 1;
    }

    easeFactor = easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    const path = `users/${user.uid}/vocabulary/${wordId}`;
    try {
      await updateDoc(doc(db, path), {
        interval,
        easeFactor,
        step,
        nextReview: Timestamp.fromDate(nextReview),
        status: step > 3 ? 'mastered' : 'learning'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  return { words, loading, addWord, updateWordSrs };
}

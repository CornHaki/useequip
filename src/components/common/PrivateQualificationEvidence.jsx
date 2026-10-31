import React, { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { FileText } from 'lucide-react';
import { db } from '../../firebase';
import { useToast } from '../../context/ToastContext';

export default function PrivateQualificationEvidence({ qualificationId, fileName }) {
  const [evidence, setEvidence] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const loadEvidence = async () => {
    setLoading(true);
    try {
      if (!db) throw new Error('Firebase is not configured.');
      const snapshot = await getDoc(doc(db, 'qualificationEvidence', qualificationId));
      if (!snapshot.exists()) throw new Error('The private evidence file could not be found.');
      setEvidence(snapshot.data().dataUrl);
    } catch (error) {
      showToast('Evidence unavailable', error.message || 'The private evidence could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  return evidence ? (
    <a
      href={evidence}
      target="_blank"
      rel="noreferrer"
      className="mt-3 inline-flex max-w-full items-center gap-2 break-all rounded-lg border border-slate-200 bg-secondary px-3 py-2 text-sm font-semibold text-primary hover:border-accent"
    >
      <FileText className="h-4 w-4 shrink-0" /> Open {fileName || 'submitted evidence'}
    </a>
  ) : (
    <button
      type="button"
      disabled={loading}
      onClick={loadEvidence}
      className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-secondary px-3 py-2 text-sm font-semibold text-primary hover:border-accent disabled:opacity-60"
    >
      <FileText className="h-4 w-4" /> {loading ? 'Loading evidence…' : `Load ${fileName || 'submitted evidence'}`}
    </button>
  );
}

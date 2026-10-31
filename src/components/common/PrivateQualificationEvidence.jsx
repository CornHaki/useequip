import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { AlertCircle, Download, ExternalLink, FileText } from 'lucide-react';
import { db } from '../../firebase';

export default function PrivateQualificationEvidence({ qualificationId, fileName }) {
  const [evidence, setEvidence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => () => {
    if (evidence?.url) URL.revokeObjectURL(evidence.url);
  }, [evidence]);

  const loadEvidence = async () => {
    setLoading(true);
    setError('');
    try {
      if (!db) throw new Error('Firebase is not configured.');
      const snapshot = await getDoc(doc(db, 'qualificationEvidence', qualificationId));
      if (!snapshot.exists()) {
        throw new Error('The uploaded document is missing. Ask the user to upload it again.');
      }

      const record = snapshot.data();
      if (typeof record.dataUrl !== 'string' || !record.dataUrl.startsWith('data:')) {
        throw new Error('The document record is incomplete or unreadable.');
      }
      if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(record.mimeType)) {
        throw new Error('This document format is not supported for preview.');
      }

      const response = await fetch(record.dataUrl);
      if (!response.ok) throw new Error('The document data could not be decoded.');
      const blob = await response.blob();
      if (blob.type !== record.mimeType) {
        throw new Error('The document format does not match its stored record.');
      }
      const url = URL.createObjectURL(blob);
      setEvidence({
        url,
        mimeType: record.mimeType,
        fileName: record.fileName || fileName || 'qualification-evidence',
        uploadedAt: record.createdAt?.toDate ? record.createdAt.toDate() : null
      });
    } catch (error) {
      setError(error.code === 'permission-denied'
        ? 'Access denied. Only you and the equipment owner can view this document.'
        : error.message || 'The private document could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-secondary/60 p-3">
      {evidence ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-textMain">
              <FileText className="h-4 w-4 shrink-0 text-accent" />
              <span className="break-all">{evidence.fileName}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <a
                href={evidence.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-3 py-2 text-xs font-bold text-primary hover:border-accent"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open
              </a>
              <a
                href={evidence.url}
                download={evidence.fileName}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-3 py-2 text-xs font-bold text-primary hover:border-accent"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </a>
            </div>
          </div>
          {evidence.uploadedAt && (
            <p className="mt-2 text-xs text-textMain/70">
              Uploaded {evidence.uploadedAt.toLocaleString()}
            </p>
          )}
          {evidence.mimeType.startsWith('image/') && (
            <a href={evidence.url} target="_blank" rel="noopener noreferrer" className="mt-3 block w-fit">
              <img src={evidence.url} alt={`Preview of ${evidence.fileName}`} className="max-h-48 max-w-full rounded-lg border border-slate-200 object-contain" />
            </a>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            disabled={loading}
            onClick={loadEvidence}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-surface px-3 py-2 text-sm font-semibold text-primary hover:border-accent disabled:opacity-60"
          >
            <FileText className="h-4 w-4" />
            {loading ? 'Loading document…' : `View ${fileName || 'uploaded document'}`}
          </button>
          {error && (
            <p role="alert" className="flex items-start gap-2 text-xs text-textMain/80">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>{error}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

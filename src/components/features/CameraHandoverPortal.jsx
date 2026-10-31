import React from 'react';
import { Camera, RotateCcw, Upload } from 'lucide-react';

export default function CameraHandoverPortal({ photoUrl, setPhoto, isReturn = false }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-secondary/60 p-4 sm:p-5 text-center">
      {photoUrl ? (
        <div className="flex flex-col items-center gap-3">
          <img src={photoUrl} alt="Equipment condition preview" className="h-36 max-w-full rounded-xl border border-slate-200 object-cover shadow-sm" />
          <button type="button" onClick={() => setPhoto(null)} className="inline-flex items-center gap-1.5 text-xs font-bold text-textMain hover:text-primary transition-colors">
            <RotateCcw className="h-3.5 w-3.5" /> Choose a different photo
          </button>
        </div>
      ) : (
        <>
          <Camera className="mx-auto h-5 w-5 text-accent" />
          <p className="mt-2 text-xs text-textMain/75">
            Upload a photo of the equipment {isReturn ? 'after use' : 'before use'}.
          </p>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-surface px-3 py-2 text-xs font-bold transition-colors hover:border-accent">
            <Upload className="h-3.5 w-3.5" /> Take or Upload Photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={event => {
                setPhoto(event.target.files?.[0] || null);
                event.target.value = '';
              }}
            />
          </label>
        </>
      )}
    </div>
  );
}

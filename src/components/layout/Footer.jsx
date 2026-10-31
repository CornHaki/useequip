import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-textMain/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white"><ShieldCheck className="w-4 h-4" /></div>
          <span className="font-bold text-textMain">UseEquip Campus OS</span>
        </div>
        <div className="flex items-center gap-4 font-medium">
          <span>Fair-Use Quota Active</span><span>•</span><span>Mandatory Photo Handover</span>
        </div>
      </div>
    </footer>
  );
}
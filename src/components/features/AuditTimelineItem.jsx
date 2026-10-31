import React from 'react';

export default function AuditTimelineItem({ log }) {
  return (
    <div className="relative group">
      {/* Timeline Node Dot */}
      <div className={`absolute -left-[43px] top-4 w-4 h-4 rounded-full border-4 border-surface ${log.role === 'Manager' ? 'bg-accent' : 'bg-textMain'}`} />
      
      <div className="p-5 sm:p-6 rounded-2xl bg-secondary/70 border border-slate-200 flex flex-col sm:flex-row justify-between gap-5 hover:border-accent/50 transition-colors">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className={`px-3 py-1.5 rounded-md text-xs font-bold border ${log.role === 'Manager' ? 'bg-surface text-primary border-accent/30' : 'bg-surface text-textMain border-slate-200'}`}>
              {log.actionLabel}
            </span>
            <span className="text-base sm:text-lg font-bold text-textMain">{log.resourceName}</span>
          </div>
          <p className="text-base text-textMain/80 leading-relaxed">{log.details}</p>
        </div>
        <div className="flex sm:flex-col items-start sm:items-end justify-between shrink-0 text-left sm:text-right gap-1.5">
          <span className="text-sm font-bold text-textMain">{log.actor}</span>
          <span className="text-xs font-semibold text-textMain/80">{log.role} • {log.timestamp}</span>
        </div>
      </div>
    </div>
  );
}
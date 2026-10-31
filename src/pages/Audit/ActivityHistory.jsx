import React, { useContext, useState } from 'react';
import PageContainer from '../../components/layout/PageContainer';
import AuditTimelineItem from '../../components/features/AuditTimelineItem';
import { DataContext } from '../../context/DataContext';

export default function ActivityHistory() {
  const { auditLogs, loading } = useContext(DataContext);
  const [auditFilter, setAuditFilter] = useState('ALL');

  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-accent mb-2 block">
            Tamper-Evident Accountability Ledger
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-textMain mb-2">
            Activity History
          </h1>
          <p className="text-base text-textMain/80">
            Booking, cancellation, report, pickup, return, and equipment-condition events are recorded below.
          </p>
        </div>

        <div className="flex max-w-full items-center gap-1.5 overflow-x-auto bg-surface p-1.5 rounded-xl border border-slate-200 shadow-sm shrink-0">
          {[
            { id: 'ALL', label: 'All Activity' },
            { id: 'Borrower', label: 'Borrower Actions' },
            { id: 'Manager', label: 'Manager Actions' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setAuditFilter(tab.id)}
              className={`px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                auditFilter === tab.id
                  ? 'bg-primary text-white'
                  : 'text-textMain/80 hover:text-textMain'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-8">
        <div className="relative pl-7 sm:pl-8 border-l-2 border-slate-200 space-y-6 sm:space-y-8">
          {auditLogs
            .filter((log) => auditFilter === 'ALL' || log.role === auditFilter)
            .map((log) => {
              const timestamp = log.createdAt?.toDate
                ? log.createdAt.toDate().toLocaleString()
                : 'Recently recorded';
              return (
              <div key={log.id} className="content-enter">
                <AuditTimelineItem log={{ ...log, timestamp }} />
              </div>
              );
            })}
          {!loading && auditLogs.length === 0 && <p className="text-sm text-textMain/75">No activity has been recorded yet.</p>}
          {loading && <p className="text-sm text-textMain/75">Loading activity history…</p>}
        </div>
      </div>
    </PageContainer>
  );
}
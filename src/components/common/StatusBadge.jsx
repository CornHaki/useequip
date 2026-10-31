import React from 'react';

export default function StatusBadge({ status }) {
  const styles = {
    Available: 'bg-secondary text-primary border-accent/30',
    'In Use': 'bg-primary text-white border-primary',
    Maintenance: 'bg-secondary text-textMain border-slate-200',
    Requested: 'bg-secondary text-textMain border-slate-200',
    Approved: 'bg-accent text-white border-accent',
    'Checked-Out': 'bg-primary text-white border-primary',
    Waitlisted: 'bg-secondary text-textMain/80 border-slate-200',
    Returned: 'bg-secondary text-primary border-accent/30',
    Inspected: 'bg-secondary text-textMain/80 border-slate-200',
    Completed: 'bg-secondary text-primary border-accent/30',
    Cancelled: 'bg-secondary text-textMain/70 border-slate-200',
    Pending: 'bg-secondary text-textMain border-slate-200',
    'Under Review': 'bg-secondary text-primary border-accent/30',
    Resolved: 'bg-accent text-white border-accent',
    Rejected: 'bg-secondary text-textMain border-slate-200',
    Verified: 'bg-accent text-white border-accent',
    'Training Required': 'bg-secondary text-primary border-accent/30',
    Expired: 'bg-secondary text-textMain/70 border-slate-200',
    Revoked: 'bg-secondary text-textMain/70 border-slate-200'
  };
  const labels = {
    Requested: 'Pending',
    Rejected: 'Declined',
    'Checked-Out': 'Borrowed',
    Returned: 'Return Requested',
    Completed: 'Returned'
  };

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-tight border ${styles[status] || styles['Waitlisted']}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'Approved' ? 'bg-white' : 'bg-current opacity-80'}`} />
      {status === 'In Use' ? 'Currently Borrowed' : labels[status] || status}
    </span>
  );
}
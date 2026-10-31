import React from 'react';
import { getBookingLifecycleIndex } from '../../utils/formatters';

export default function BookingLifecycleBar({ status }) {
  const stepIdx = getBookingLifecycleIndex(status);
  const steps = [{ step: 1, label: '1. Pending' }, { step: 2, label: '2. Approved' }, { step: 3, label: '3. Borrowed' }, { step: 4, label: '4. Returned' }];

  return (
    <div className="pt-5 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-4">
      {steps.map((st) => {
        const reached = stepIdx >= st.step;
        return (
          <div key={st.step} className="space-y-1.5">
            <div className={`h-1.5 rounded-full transition-colors ${reached ? 'bg-accent' : 'bg-slate-200'}`} />
              <p className={`text-[11px] font-bold ${reached ? 'text-primary' : 'text-textMain/60'}`}>{st.label}</p>
          </div>
        );
      })}
    </div>
  );
}
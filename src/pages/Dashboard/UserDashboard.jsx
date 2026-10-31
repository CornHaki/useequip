import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer';
import StatusBadge from '../../components/common/StatusBadge';
import BookingLifecycleBar from '../../components/features/BookingLifecycleBar';
import Modal from '../../components/common/Modal';
import { useBookings } from '../../hooks/useBookings';
import { useEquipment } from '../../hooks/useEquipment';
import { useFairUsage } from '../../hooks/useFairUsage';
import { useAuth } from '../../context/AuthContext';
import { DataContext } from '../../context/DataContext';
import {
  ArrowRight,
  CalendarDays,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { getQualificationTypeLabel } from '../../config/equipmentCategories';
import PrivateQualificationEvidence from '../../components/common/PrivateQualificationEvidence';
import { useContext, useState } from 'react';

export default function UserDashboard() {
  const { bookings, cancelBooking, clearBooking } = useBookings();
  const { resources } = useEquipment();
  const { userActiveBookings, MAX_ACTIVE_BOOKINGS } = useFairUsage();
  const { user } = useAuth();
  const { loading, qualifications } = useContext(DataContext);
  const navigate = useNavigate();
  const [cancellingId, setCancellingId] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [clearingId, setClearingId] = useState(null);
  const userBookings = bookings.filter(booking => booking.userId === user?.uid && !booking.clearedByUserAt);
  const handoverBookings = userBookings.filter(booking => ['Approved', 'Checked-Out'].includes(booking.status));
  const quotaUsed = Math.min((userActiveBookings.length / MAX_ACTIVE_BOOKINGS) * 100, 100);
  const userQualifications = qualifications.filter(qualification => qualification.userId === user?.uid);
  const verifiedQualifications = userQualifications.filter(qualification => {
    const expiresAt = qualification.expiresAt?.toDate ? qualification.expiresAt.toDate() : null;
    return qualification.status === 'Verified' && (!expiresAt || expiresAt > new Date());
  });

  return (
    <PageContainer width="max-w-7xl">
      <section className="rounded-3xl bg-primary text-white p-7 sm:p-10 lg:p-12 shadow-lg">
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs font-bold text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Borrower Workspace · {user?.name || 'Student'} (Verified Student)
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Unlock High-Value Campus Gear with Verified Trust.
          </h1>
          <p className="text-sm sm:text-base text-secondary/90 leading-relaxed max-w-xl">
            Check training requirements upfront, inspect equipment details, and document before-and-after condition photos in seconds.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/browse')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent hover:bg-white hover:text-primary text-white text-sm font-bold shadow-sm transition-colors"
            >
              <Compass className="w-4 h-4" /> Explore Equipment Catalog
            </button>
          </div>
        </div>
      </section>

      <section aria-label="Account overview" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="bg-surface p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-44">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-textMain/70 leading-tight">Fair Borrowing Quota</h2>
            <span className="rounded-md bg-secondary px-2 py-1 text-[10px] leading-tight font-bold text-primary">Anti-Hoarding Rule</span>
          </div>
          <div className="mt-4 flex items-baseline justify-between gap-2">
            <p className="text-lg font-extrabold text-textMain">
              <span className="text-2xl">{userActiveBookings.length}</span> / {MAX_ACTIVE_BOOKINGS} Active
            </p>
            <span className="text-xs font-bold text-accent">{Math.round(quotaUsed)}% Used</span>
          </div>
          <div
            role="progressbar"
            aria-label="Borrowing quota used"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(quotaUsed)}
            className="h-2 rounded-full bg-secondary mt-3 overflow-hidden"
          >
            <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${quotaUsed}%` }} />
          </div>
          <p className="text-xs text-textMain/75 leading-relaxed mt-4">
            Capped at {MAX_ACTIVE_BOOKINGS} active reservations per student to keep high-demand tools accessible.
          </p>
        </div>

        <div className="bg-surface p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-44">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-textMain/70">Action Required</h2>
            <span className="w-7 h-7 rounded-lg bg-secondary text-accent flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </span>
          </div>
          <p className="mt-4 text-lg font-extrabold text-textMain">
            <span className="text-2xl text-accent">{handoverBookings.length}</span> Ready
          </p>
          <p className="text-xs text-textMain/75 leading-relaxed mt-auto pt-3">
            Complete your before-or-after condition photo handover when picking up or returning equipment.
          </p>
          {handoverBookings.length > 0 && (
            <button
              onClick={() => navigate(`/handover/${handoverBookings[0].id}`)}
              className="mt-3 inline-flex w-fit items-center gap-1 text-xs font-bold text-primary hover:text-accent transition-colors"
            >
              Open handover <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="md:col-span-2 lg:col-span-1 bg-surface p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-44">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-textMain/70">Verified Credentials</h2>
            <span className="w-7 h-7 rounded-lg bg-secondary text-accent flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <p className="mt-4 text-lg font-extrabold text-textMain">
            <span className="text-2xl">{verifiedQualifications.length}</span> Verified
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {verifiedQualifications.slice(0, 3).map(qualification => (
              <span key={qualification.id} className="px-2 py-1 rounded-md bg-secondary text-textMain text-[11px] font-bold">{qualification.equipmentName}</span>
            ))}
          </div>
          <p className="text-xs text-textMain/75 leading-relaxed mt-auto pt-3">
            Owner-reviewed qualifications are used to request eligible equipment.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-textMain">My Qualifications</h2>
          <p className="mt-1 text-sm text-textMain/75">Private evidence is visible only to you and the equipment owner reviewing it.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {userQualifications.map(qualification => {
            const expiresAt = qualification.expiresAt?.toDate ? qualification.expiresAt.toDate() : null;
            const status = qualification.status === 'Verified' && expiresAt && expiresAt <= new Date()
              ? 'Expired'
              : qualification.status;
            return (
              <article key={qualification.id} className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-textMain">{qualification.equipmentName}</h3>
                    <p className="mt-1 text-xs text-textMain/70">{getQualificationTypeLabel(qualification.qualificationType)}</p>
                  </div>
                  <StatusBadge status={status} />
                </div>
                {qualification.reviewerNotes && <p className="mt-3 text-sm text-textMain/80">{qualification.reviewerNotes}</p>}
                {qualification.assessmentStatus && qualification.assessmentStatus !== 'Not Requested' && <p className="mt-2 text-xs text-textMain/70">Assessment: {qualification.assessmentStatus}</p>}
                {qualification.assessmentScheduledAt?.toDate && <p className="mt-2 text-xs text-textMain/70">Assessment scheduled: {qualification.assessmentScheduledAt.toDate().toLocaleString()}</p>}
                {expiresAt && <p className="mt-2 text-xs text-textMain/70">Valid until: {expiresAt.toLocaleDateString()}</p>}
                {qualification.hasEvidence && <PrivateQualificationEvidence qualificationId={qualification.id} fileName={qualification.evidenceName} />}
              </article>
            );
          })}
          {!loading && userQualifications.length === 0 && (
            <p className="rounded-2xl border border-slate-200 bg-surface p-5 text-sm text-textMain/75">Qualification requests will appear here after you submit evidence or request an assessment from an equipment listing.</p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-textMain">Your Equipment Bookings</h2>
          <p className="text-sm text-textMain/75 mt-1">
            Track requests from approval to pickup and return. Click <span className="font-bold text-accent">Pick Up Equipment</span> when your slot begins.
          </p>
        </div>

        <div className="space-y-3">
          {userBookings.map(booking => {
            const resource = resources.find(item => item.id === booking.resourceId);
            const canHandover = ['Approved', 'Checked-Out'].includes(booking.status);
            const handoverLabel = booking.status === 'Approved' ? 'Pick Up Equipment' : 'Return Equipment';
            const canCancel = ['Requested', 'Waitlisted', 'Approved'].includes(booking.status);
            const canClear = ['Rejected', 'Completed'].includes(booking.status);

            return (
              <article key={booking.id} className="bg-surface rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {resource?.image ? (
                      <img src={resource.image} alt="" className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-xl object-cover border border-slate-200 shrink-0" />
                    ) : (
                      <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-xl bg-secondary flex items-center justify-center text-accent shrink-0">
                        <ClipboardCheck className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold text-sm sm:text-base text-textMain">{booking.resourceName}</h3>
                        <StatusBadge status={booking.status} />
                        {booking.status === 'Approved' && (
                          <span className="text-[11px] font-bold text-primary">· Ready for Pickup</span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-textMain/75 mt-1">{booking.purpose || 'Equipment reservation'}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-textMain/75">
                        <span className="inline-flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-accent" />{booking.dateSlot}</span>
                        {booking.certificateName && (
                          <span className="inline-flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-accent" />{booking.certificateName}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    {canHandover && (
                      <button
                        onClick={() => navigate(`/handover/${booking.id}`)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent hover:bg-primary text-white text-xs font-bold shadow-sm transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" /> {handoverLabel}
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/equipment/${booking.resourceId}`)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-secondary hover:bg-accent hover:text-white text-textMain text-xs font-bold transition-colors"
                    >
                      View Details
                    </button>
                    {canCancel && (
                      <button
                        onClick={() => { setCancellationReason(''); setCancellingId(booking.id); }}
                        className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-slate-200 bg-surface text-xs font-bold text-textMain hover:border-accent hover:text-primary transition-colors"
                      >
                        Cancel Request
                      </button>
                    )}
                    {canClear && (
                      <button
                        onClick={() => setClearingId(booking.id)}
                        className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-slate-200 bg-surface text-xs font-bold text-textMain hover:border-accent hover:text-primary transition-colors"
                      >
                        Remove from My Requests
                      </button>
                    )}
                  </div>
                </div>
                {booking.cancellationReason && (
                  <p className="mt-3 rounded-lg bg-secondary px-3 py-2 text-xs text-textMain/75">
                    Cancellation reason: {booking.cancellationReason}
                  </p>
                )}
                <BookingLifecycleBar status={booking.status} />
              </article>
            );
          })}
          {!loading && userBookings.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-surface px-6 py-10 text-center shadow-sm">
              <p className="font-bold text-textMain">No equipment bookings yet</p>
              <p className="text-sm text-textMain/75 mt-1">Explore the catalog to find equipment for your next project.</p>
              <button onClick={() => navigate('/browse')} className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent hover:bg-primary text-white text-sm font-bold transition-colors">
                <Compass className="w-4 h-4" /> Explore catalog
              </button>
            </div>
          )}
          {loading && <p className="rounded-2xl border border-slate-200 bg-surface p-6 text-center text-sm text-textMain/75">Loading your requests…</p>}
        </div>
      </section>

      {cancellingId && (
        <Modal title="Cancel booking request" subtitle="The equipment owner will be notified. Your booking history will be retained." onClose={() => setCancellingId(null)}>
          <form onSubmit={async event => {
            event.preventDefault();
            if (await cancelBooking(cancellingId, cancellationReason)) setCancellingId(null);
          }} className="space-y-4">
            <label className="block text-sm font-bold text-textMain" htmlFor="cancellation-reason">
              Reason for cancellation <span className="text-accent">*</span>
            </label>
            <textarea
              id="cancellation-reason"
              required
              minLength={3}
              maxLength={1000}
              rows={4}
              value={cancellationReason}
              onChange={event => setCancellationReason(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-surface px-4 py-3 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Tell the equipment owner why you are cancelling."
            />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setCancellingId(null)} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-textMain">Keep Request</button>
              <button type="submit" className="rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white hover:bg-primary transition-colors">Confirm Cancellation</button>
            </div>
          </form>
        </Modal>
      )}

      {clearingId && (
        <Modal title="Remove from My Requests?" subtitle="This only hides the request from your dashboard. The Admin history is not deleted." onClose={() => setClearingId(null)}>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setClearingId(null)} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-textMain">Keep Request</button>
            <button
              type="button"
              onClick={async () => { if (await clearBooking(clearingId)) setClearingId(null); }}
              className="rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white hover:bg-primary transition-colors"
            >
              Confirm Clear
            </button>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}

import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import CameraHandoverPortal from '../../components/features/CameraHandoverPortal';
import { useBookings } from '../../hooks/useBookings';
import { useEquipment } from '../../hooks/useEquipment';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Check, ClipboardCheck } from 'lucide-react';

export default function CheckInOutPortal() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { bookings, completeHandover } = useBookings();
  const { resources } = useEquipment();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [conditionNote, setConditionNote] = useState('');
  const [returnCondition, setReturnCondition] = useState('Good');
  const [checkedItems, setCheckedItems] = useState([]);

  const eligibleBookings = bookings.filter(booking =>
    booking.userId === user?.uid && ['Approved', 'Checked-Out'].includes(booking.status)
  );
  const booking = eligibleBookings.find(item => item.id === bookingId);
  const resource = booking && resources.find(item => item.id === booking.resourceId);
  const checklist = resource?.checklist || [];
  const isPickup = booking?.status === 'Approved';
  const isReturn = booking?.status === 'Checked-Out';
  const allItemsChecked = checklist.length === 0 || checklist.every((_, index) => checkedItems[index]);

  useEffect(() => {
    setPhotoUrl('');
    setPhotoFile(null);
    setConditionNote('');
    setReturnCondition('Good');
    setCheckedItems([]);
  }, [bookingId]);

  useEffect(() => () => {
    if (photoUrl.startsWith('blob:')) URL.revokeObjectURL(photoUrl);
  }, [photoUrl]);

  if (!booking || (!isPickup && !isReturn)) {
    return (
      <PageContainer width="max-w-4xl">
        <div className="max-w-2xl mx-auto rounded-2xl border border-slate-200 bg-surface p-6 sm:p-8 text-center shadow-sm">
          <h1 className="text-xl font-extrabold text-textMain">No handover is ready</h1>
          <p className="mt-2 text-sm text-textMain/75">Approved pickups and active returns will appear here.</p>
          <Link to="/user-dashboard" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-accent">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </PageContainer>
    );
  }

  const handleSelectBooking = (event) => {
    navigate(`/handover/${event.target.value}`, { replace: true });
  };

  const handleToggleChecklistItem = (index) => {
    setCheckedItems(current => current.map((checked, itemIndex) => itemIndex === index ? !checked : checked));
  };

  const handlePhotoChange = (file) => {
    setPhotoFile(file);
    setPhotoUrl(file ? URL.createObjectURL(file) : '');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!allItemsChecked) {
      showToast('Checklist Incomplete', 'Confirm each item is present and undamaged before continuing.');
      return;
    }
    if (!photoFile) {
      showToast('Photo Required', 'Add a condition photo before completing the handover.');
      return;
    }
    if (isReturn && returnCondition !== 'Good' && !conditionNote.trim()) {
      showToast('Add a Condition Note', 'Describe the issue so the equipment owner can review it.');
      return;
    }

    const completed = await completeHandover(
      booking.id,
      isPickup ? 'CheckIn' : 'CheckOut',
      photoFile,
      conditionNote.trim() || 'Looks good',
      isPickup ? '' : returnCondition
    );
    if (completed) navigate('/user-dashboard');
  };

  return (
    <PageContainer width="max-w-4xl">
      <div>
        <Link to="/user-dashboard" className="inline-flex items-center gap-2 text-xs font-bold text-textMain/75 hover:text-primary transition-colors mb-5">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
        <div className="mb-5">
          <span className="text-xs font-extrabold uppercase tracking-wider text-accent">Equipment Pickup & Return</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-textMain mt-1">Confirm Equipment Condition</h1>
          <p className="text-sm text-textMain/75 mt-2 max-w-2xl">
            To protect both students and equipment owners, please check the items below and take a quick photo {isPickup ? 'before' : 'after'} using the equipment.
          </p>
        </div>

        <label className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded-xl border border-slate-200 bg-surface px-4 py-3 mb-4 text-xs font-bold text-textMain">
          <span className="shrink-0">Selected Booking:</span>
          <select
            value={booking.id}
            onChange={handleSelectBooking}
            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-surface px-3 py-2 text-xs font-semibold focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {eligibleBookings.map(item => (
              <option key={item.id} value={item.id}>
                {item.resourceName} ({item.status === 'Approved' ? 'Ready for Pickup' : 'Ready to Return'})
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-2xl border border-slate-200 bg-secondary/60 overflow-hidden">
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <StatusBadge status={booking.status} />
              <h2 className="font-extrabold text-sm text-textMain mt-2">{booking.resourceName}</h2>
              <p className="text-xs text-textMain/75 mt-1">Borrower: {booking.userName} · {booking.dateSlot}</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-lg border border-accent/20 bg-surface px-3 py-2 text-xs font-bold text-primary">
              <ClipboardCheck className="w-4 h-4 text-accent" />
              Step {isPickup ? '1: Pick Up' : '2: Return'} Equipment
            </span>
          </div>

          <form onSubmit={handleSubmit} className="bg-surface p-4 sm:p-5 space-y-5">
            <section aria-labelledby="checklist-title">
              <div className="flex items-center justify-between gap-3 mb-2">
                <h3 id="checklist-title" className="text-xs font-extrabold text-textMain">1. Check That Everything Is Present & Undamaged</h3>
                <button
                  type="button"
                  onClick={() => setCheckedItems(checklist.map(() => true))}
                  className="shrink-0 text-xs font-bold text-accent hover:text-primary transition-colors"
                >
                  Check All Boxes
                </button>
              </div>
              <div className="space-y-1.5">
                {checklist.map((item, index) => (
                  <label key={`${index}-${item}`} className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-xs text-textMain/80 cursor-pointer hover:border-accent/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={Boolean(checkedItems[index])}
                      onChange={() => handleToggleChecklistItem(index)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                    />
                    <span>{item}</span>
                  </label>
                ))}
                {checklist.length === 0 && (
                  <p className="rounded-xl border border-slate-200 bg-secondary/50 px-3 py-3 text-xs text-textMain/75">
                    No equipment-specific checklist was provided. Review the equipment and confirm its condition below.
                  </p>
                )}
              </div>
            </section>

            <section aria-labelledby="photo-title">
              <h3 id="photo-title" className="text-xs font-extrabold text-textMain mb-2">
                2. Add a Quick "{isPickup ? 'Before Use' : 'After Use'}" Photo
              </h3>
              <CameraHandoverPortal
                photoUrl={photoUrl}
                setPhoto={handlePhotoChange}
                isReturn={isReturn}
              />
            </section>

            {isReturn && (
              <section>
                <label htmlFor="return-condition" className="mb-2 block text-xs font-extrabold text-textMain">3. Assess the return condition</label>
                <select
                  id="return-condition"
                  value={returnCondition}
                  onChange={event => setReturnCondition(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-xs text-textMain focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="Good">Good condition</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Maintenance">Requires maintenance</option>
                </select>
              </section>
            )}

            <section>
              <label htmlFor="condition-note" className="block text-xs font-extrabold text-textMain mb-2">
                {isReturn ? '4.' : '3.'} Any Notes About Condition? {isReturn && (returnCondition !== 'Good' ? '(Required)' : '(Optional)')}
              </label>
              <input
                id="condition-note"
                type="text"
                value={conditionNote}
                onChange={event => setConditionNote(event.target.value)}
                placeholder={isPickup ? 'e.g., Everything looks clean and batteries are charged' : 'e.g., Equipment returned in good condition'}
                className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-xs text-textMain placeholder:text-textMain/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </section>

            <Button type="submit" className="w-full !py-3">
              <Check className="w-4 h-4" />
              {isPickup ? 'Confirm Pickup & Start Using Equipment' : 'Complete Return & Save Condition Photo'}
            </Button>
          </form>
        </div>
      </div>
    </PageContainer>
  );
}

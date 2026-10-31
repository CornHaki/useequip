import { useContext } from 'react';
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import { DataContext } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db } from '../firebase';
import { imageFileToDataUrl } from '../services/imageData';
import { createAudit, createNotification } from '../services/activityRecords';
import { useFairUsage } from './useFairUsage';
import { getEffectiveQualificationType, getEquipmentCategoryId } from '../config/equipmentCategories';

const CANCELABLE_STATUSES = ['Requested', 'Waitlisted', 'Approved'];

export function useBookings() {
  const { bookings } = useContext(DataContext);
  const { user } = useAuth();
  const { showToast } = useToast();
  const { isQuotaReached } = useFairUsage();

  const runAction = async (successTitle, successMessage, action) => {
    try {
      await action();
      showToast(successTitle, successMessage);
      return true;
    } catch (error) {
      showToast('Action failed', error.message || 'The operation was denied. Check your connection and try again.');
      return false;
    }
  };

  const handleBookingRequest = (resource, dateSlot, purpose, qualificationId, supervisedAccess, onSuccess) => {
    if (isQuotaReached) {
      showToast('Borrowing Limit Reached', 'You already have two active bookings.');
      return Promise.resolve(false);
    }
    if (!db || !user?.uid) return Promise.resolve(false);
    return runAction('Request sent', 'The equipment owner will review your request.', async () => {
      const resourceRef = doc(db, 'resources', resource.id);
      const bookingRef = doc(collection(db, 'bookings'));
      await runTransaction(db, async transaction => {
        const resourceSnapshot = await transaction.get(resourceRef);
        if (!resourceSnapshot.exists()) throw new Error('Equipment was not found.');
        const equipment = resourceSnapshot.data();
        if (equipment.ownerUid === user.uid) throw new Error('You cannot request your own equipment.');
        if (equipment.archived) throw new Error('This equipment is no longer listed.');
        const requiredType = getEffectiveQualificationType(equipment);
        if (supervisedAccess) {
          if (!equipment.supervisedUseAllowed) throw new Error('The owner has not enabled supervised access.');
          if (qualificationId) throw new Error('Choose either a verified qualification or supervised access.');
        } else if (requiredType !== 'none') {
          if (!qualificationId) throw new Error('A verified qualification is required for independent access.');
          const qualificationRef = doc(db, 'qualifications', qualificationId);
          const qualificationSnapshot = await transaction.get(qualificationRef);
          if (!qualificationSnapshot.exists()) throw new Error('The selected qualification could not be found.');
          const qualification = qualificationSnapshot.data();
          const expired = qualification.expiresAt?.toDate && qualification.expiresAt.toDate() <= new Date();
          if (
            qualification.userId !== user.uid
            || qualification.ownerUid !== equipment.ownerUid
            || qualification.qualificationType !== requiredType
            || qualification.categoryId !== getEquipmentCategoryId(equipment.categoryId || equipment.category)
            || qualification.status !== 'Verified'
            || expired
          ) {
            throw new Error('This qualification is not valid for the selected equipment.');
          }
          if (qualification.equipmentId !== resource.id) {
            const grantRef = doc(db, 'qualificationGrants', `${qualificationId}_${resource.id}`);
            const grantSnapshot = await transaction.get(grantRef);
            if (!grantSnapshot.exists() || !grantSnapshot.data().active) {
              throw new Error('This qualification has not been shared with the selected equipment.');
            }
          }
        } else if (qualificationId) {
          throw new Error('This equipment does not require a qualification.');
        }
        const status = equipment.status === 'Available' && !equipment.reservedByBookingId
          ? 'Requested'
          : 'Waitlisted';
        transaction.set(bookingRef, {
          resourceId: resource.id,
          resourceName: equipment.name,
          ownerUid: equipment.ownerUid,
          userId: user.uid,
          userName: user.name,
          dateSlot,
          purpose: purpose.trim(),
          certificateName: '',
          qualificationId: qualificationId || null,
          supervisedAccess: Boolean(supervisedAccess),
          status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          checkInData: null,
          checkOutData: null,
          returnCondition: null,
          clearedByUserAt: null
        });
        createAudit(transaction, user, equipment.ownerUid, {
          action: 'Booking Requested',
          resourceName: equipment.name,
          details: `Requested slot: ${dateSlot}`
        }, bookingRef.id);
        createNotification(
          transaction,
          equipment.ownerUid,
          'New equipment request',
          `${user.name} requested ${equipment.name}.`,
          bookingRef.id,
          'booking-request'
        );
      });
      if (onSuccess) onSuccess();
    });
  };

  const cancelBooking = (bookingId, reason) => runAction(
    'Request cancelled',
    'The equipment owner has been notified.',
    async () => {
      if (!db) throw new Error('Firebase is not configured.');
      const bookingRef = doc(db, 'bookings', bookingId);
      await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(bookingRef);
        if (!snapshot.exists()) throw new Error('Booking was not found.');
        const booking = snapshot.data();
        if (booking.userId !== user.uid || !CANCELABLE_STATUSES.includes(booking.status)) {
          throw new Error('This booking cannot be cancelled by this account.');
        }
        let resourceRef;
        if (booking.status === 'Approved') {
          resourceRef = doc(db, 'resources', booking.resourceId);
          const resourceSnapshot = await transaction.get(resourceRef);
          if (resourceSnapshot.exists() && resourceSnapshot.data().reservedByBookingId === bookingId) {
            transaction.update(resourceRef, { reservedByBookingId: null, status: 'Available' });
          }
        }
        transaction.update(bookingRef, {
          status: 'Cancelled',
          cancellationReason: reason.trim(),
          cancelledAt: serverTimestamp(),
          cancelledByUid: user.uid,
          cancelledByName: user.name,
          updatedAt: serverTimestamp()
        });
        createAudit(transaction, user, booking.ownerUid, {
          action: 'Booking Cancelled',
          resourceName: booking.resourceName,
          details: `Cancellation reason: ${reason.trim()}`
        }, bookingId, 'booking', booking.userId);
        createNotification(transaction, booking.ownerUid, 'Booking request cancelled', `${user.name} cancelled their request for ${booking.resourceName}.`, bookingId, 'booking-cancelled');
      });
    }
  );

  const clearBooking = (bookingId) => runAction(
    'Request cleared',
    'The booking history has been retained.',
    async () => {
      const bookingRef = doc(db, 'bookings', bookingId);
      await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(bookingRef);
        if (!snapshot.exists()) throw new Error('Booking was not found.');
        const booking = snapshot.data();
        if (booking.userId !== user.uid || !['Rejected', 'Completed'].includes(booking.status)) {
          throw new Error('Only rejected or completed requests can be cleared.');
        }
        if (booking.clearedByUserAt) throw new Error('This request has already been cleared.');
        transaction.update(bookingRef, { clearedByUserAt: serverTimestamp(), updatedAt: serverTimestamp() });
        createAudit(transaction, user, booking.ownerUid, {
          action: 'Request Cleared',
          resourceName: booking.resourceName,
          details: `Cleared ${booking.status.toLowerCase()} request from the user dashboard.`
        }, bookingId, 'booking', booking.userId);
      });
    }
  );

  const handleOwnerDecision = (bookingId, decision, reason = '') => runAction(
    `Booking ${decision.toLowerCase()}`,
    'The request has been updated.',
    async () => {
      const bookingRef = doc(db, 'bookings', bookingId);
      await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(bookingRef);
        if (!snapshot.exists()) throw new Error('Booking was not found.');
        const booking = snapshot.data();
        if (booking.ownerUid !== user.uid || !['Requested', 'Waitlisted'].includes(booking.status)) {
          throw new Error('You can only decide pending requests for equipment you own.');
        }
        if (!['Approved', 'Waitlisted', 'Rejected'].includes(decision)) throw new Error('Invalid booking decision.');
        if (booking.status === decision) return;
        if (decision === 'Rejected' && !reason.trim()) throw new Error('A rejection reason is required.');
        let resourceRef;
        if (decision === 'Approved') {
          resourceRef = doc(db, 'resources', booking.resourceId);
          const resourceSnapshot = await transaction.get(resourceRef);
          if (!resourceSnapshot.exists() || resourceSnapshot.data().status !== 'Available' || resourceSnapshot.data().reservedByBookingId) {
            throw new Error('Equipment is unavailable or assigned. Waitlist this request instead.');
          }
          const equipment = resourceSnapshot.data();
          if (!booking.supervisedAccess && getEffectiveQualificationType(equipment) !== 'none') {
            if (!booking.qualificationId) throw new Error('A verified qualification is required before approval.');
            const qualificationRef = doc(db, 'qualifications', booking.qualificationId);
            const qualificationSnapshot = await transaction.get(qualificationRef);
            if (!qualificationSnapshot.exists()) throw new Error('The qualification attached to this request was not found.');
            const qualification = qualificationSnapshot.data();
            const expired = qualification.expiresAt?.toDate && qualification.expiresAt.toDate() <= new Date();
            if (
              qualification.status !== 'Verified'
              || qualification.userId !== booking.userId
              || qualification.ownerUid !== booking.ownerUid
              || qualification.qualificationType !== getEffectiveQualificationType(equipment)
              || qualification.categoryId !== getEquipmentCategoryId(equipment.categoryId || equipment.category)
              || expired
            ) {
              throw new Error('The attached qualification is no longer valid. Ask the borrower to submit a current qualification.');
            }
            if (qualification.equipmentId !== booking.resourceId) {
              const grantRef = doc(db, 'qualificationGrants', `${booking.qualificationId}_${booking.resourceId}`);
              const grantSnapshot = await transaction.get(grantRef);
              if (!grantSnapshot.exists() || !grantSnapshot.data().active) {
                throw new Error('This qualification is no longer shared with the requested equipment.');
              }
            }
          }
          transaction.update(resourceRef, { reservedByBookingId: bookingId, updatedAt: serverTimestamp() });
        }
        transaction.update(bookingRef, {
          status: decision,
          approvedByUid: user.uid,
          approvedBy: user.name,
          decisionAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...(decision === 'Rejected' ? { rejectionReason: reason.trim() } : {})
        });
        createAudit(transaction, user, booking.ownerUid, {
          action: decision === 'Rejected' ? 'Request Declined' : `Request ${decision}`,
          resourceName: booking.resourceName,
          details: decision === 'Rejected' ? `Reason: ${reason.trim()}` : 'Request reviewed by equipment owner.'
        }, bookingId, 'booking', booking.userId);
      });
    }
  );

  const completeHandover = async (bookingId, type, photoFile, conditionNote, condition = '') => runAction(
    type === 'CheckIn' ? 'Pickup complete' : 'Return submitted',
    type === 'CheckIn' ? 'Equipment condition has been recorded.' : 'The owner will inspect the returned equipment.',
    async () => {
      const photoData = photoFile ? await imageFileToDataUrl(photoFile) : '';
      const bookingRef = doc(db, 'bookings', bookingId);
      await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(bookingRef);
        if (!snapshot.exists()) throw new Error('Booking was not found.');
        const booking = snapshot.data();
        if (booking.userId !== user.uid) throw new Error('You can only complete your own handover.');
        const isPickup = type === 'CheckIn';
        if (booking.status !== (isPickup ? 'Approved' : 'Checked-Out')) {
          throw new Error('This handover is no longer available.');
        }
        if (!isPickup && !['Good', 'Damaged', 'Maintenance'].includes(condition)) {
          throw new Error('Select a return condition.');
        }
        if (!isPickup && condition !== 'Good' && !conditionNote.trim()) {
          throw new Error('Add a note describing the return condition.');
        }
        const resourceRef = doc(db, 'resources', booking.resourceId);
        const resourceSnapshot = await transaction.get(resourceRef);
        if (!resourceSnapshot.exists() || resourceSnapshot.data().reservedByBookingId !== bookingId) {
          throw new Error('The equipment reservation could not be verified.');
        }
        if (isPickup && resourceSnapshot.data().status !== 'Available') {
          throw new Error('This equipment is not currently available for pickup.');
        }
        transaction.update(bookingRef, isPickup ? {
          status: 'Checked-Out',
          updatedAt: serverTimestamp(),
          checkInData: {
            timestamp: serverTimestamp(),
            photoData,
            conditionNote: conditionNote.trim() || 'Looks good',
            checklistVerified: true
          }
        } : {
          status: 'Returned',
          updatedAt: serverTimestamp(),
          checkOutData: {
            timestamp: serverTimestamp(),
            photoData,
            conditionNote: conditionNote.trim() || 'Returned in good condition',
            checklistVerified: true
          },
          returnCondition: {
            borrowerAssessment: condition,
            borrowerNote: conditionNote.trim(),
            assessedByUid: user.uid,
            assessedAt: serverTimestamp()
          },
          ...(condition !== 'Good' ? { incidentReport: { aiSummary: `Borrower reported: ${conditionNote}`, rawText: conditionNote } } : {})
        });
        if (isPickup) transaction.update(resourceRef, { status: 'In Use', updatedAt: serverTimestamp() });
        createAudit(transaction, user, booking.ownerUid, {
          action: isPickup ? 'Equipment Picked Up' : 'Equipment Returned',
          resourceName: booking.resourceName,
          details: isPickup ? 'Pickup condition photo saved.' : `Return condition: ${condition}. ${conditionNote}`
        }, bookingId, 'booking', booking.userId);
        if (!isPickup) {
          createNotification(transaction, booking.ownerUid, 'Equipment returned for inspection', `${user.name} returned ${booking.resourceName}.`, bookingId, 'equipment-returned');
        }
      });
    }
  );

  const resolveReturn = (bookingId, resolution) => runAction(
    'Return inspected',
    'The booking has been completed and equipment status updated.',
    async () => {
      const bookingRef = doc(db, 'bookings', bookingId);
      await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(bookingRef);
        if (!snapshot.exists()) throw new Error('Booking was not found.');
        const booking = snapshot.data();
        if (booking.ownerUid !== user.uid || booking.status !== 'Returned') {
          throw new Error('You can only inspect returns for equipment you own.');
        }
        const resourceRef = doc(db, 'resources', booking.resourceId);
        const resourceSnapshot = await transaction.get(resourceRef);
        if (!resourceSnapshot.exists() || resourceSnapshot.data().reservedByBookingId !== bookingId) {
          throw new Error('The equipment reservation could not be verified.');
        }
        transaction.update(resourceRef, {
          status: resolution === 'Good Condition' ? 'Available' : 'Maintenance',
          reservedByBookingId: null,
          updatedAt: serverTimestamp()
        });
        transaction.update(bookingRef, {
          status: 'Completed',
          updatedAt: serverTimestamp(),
          returnCondition: {
            ...booking.returnCondition,
            ownerAssessment: resolution,
            inspectedByUid: user.uid,
            inspectedAt: serverTimestamp()
          }
        });
        createAudit(transaction, user, booking.ownerUid, {
          action: 'Return Inspected and Booking Completed',
          resourceName: booking.resourceName,
          details: `Owner assessment: ${resolution}.`
        }, bookingId, 'booking', booking.userId);
      });
    }
  );

  const submitReport = async (resource, category, description, photoFile) => runAction(
    'Report submitted',
    'The equipment owner can review the report.',
    async () => {
      const photoData = photoFile ? await imageFileToDataUrl(photoFile) : '';
      const reportRef = doc(collection(db, 'equipmentReports'));
      await runTransaction(db, async transaction => {
        const resourceRef = doc(db, 'resources', resource.id);
        const resourceSnapshot = await transaction.get(resourceRef);
        if (!resourceSnapshot.exists()) throw new Error('Equipment was not found.');
        const equipment = resourceSnapshot.data();
        if (equipment.ownerUid === user.uid) throw new Error('You cannot report your own equipment.');
        transaction.set(reportRef, {
          resourceId: resource.id,
          resourceName: equipment.name,
          ownerUid: equipment.ownerUid,
          userId: user.uid,
          userName: user.name,
          category,
          description: description.trim(),
          photoData,
          status: 'Pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        createAudit(transaction, user, equipment.ownerUid, {
          action: 'Equipment Report Submitted',
          resourceName: equipment.name,
          details: `${category}: ${description.trim()}`
        }, reportRef.id, 'equipmentReport');
        createNotification(transaction, equipment.ownerUid, 'New equipment report', `${user.name} submitted a report for ${equipment.name}.`, reportRef.id, 'equipment-report');
      });
    }
  );

  const updateReportStatus = (reportId, status) => runAction(
    'Report updated',
    `Report status changed to ${status}.`,
    async () => {
      const reportRef = doc(db, 'equipmentReports', reportId);
      await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(reportRef);
        if (!snapshot.exists() || snapshot.data().ownerUid !== user.uid) {
          throw new Error('You can only manage reports for equipment you own.');
        }
        if (snapshot.data().status === status) return;
        const validTransitions = {
          Pending: ['Under Review', 'Resolved', 'Rejected'],
          'Under Review': ['Resolved', 'Rejected']
        };
        if (!validTransitions[snapshot.data().status]?.includes(status)) {
          throw new Error('This report status cannot be changed to the selected value.');
        }
        transaction.update(reportRef, { status, updatedAt: serverTimestamp(), reviewedByUid: user.uid });
        createAudit(transaction, user, user.uid, {
          action: `Equipment Report Updated to ${status}`,
          resourceName: snapshot.data().resourceName,
          details: `Report status changed to ${status}.`
        }, reportId, 'equipmentReport', snapshot.data().userId);
      });
    }
  );

  return {
    bookings,
    handleBookingRequest,
    handleOwnerDecision,
    completeHandover,
    cancelBooking,
    clearBooking,
    resolveReturn,
    submitReport,
    updateReportStatus
  };
}

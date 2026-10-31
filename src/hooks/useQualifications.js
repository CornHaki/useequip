import { useContext } from 'react';
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { DataContext } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db } from '../firebase';
import { evidenceFileToDataUrl } from '../services/qualificationEvidence';
import { createAudit, createNotification } from '../services/activityRecords';
import { getEffectiveQualificationType, getEquipmentCategoryId } from '../config/equipmentCategories';

function toTimestamp(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Choose a valid date and time.');
  return Timestamp.fromDate(date);
}

export function useQualifications() {
  const { qualifications, qualificationGrants } = useContext(DataContext);
  const { user } = useAuth();
  const { showToast } = useToast();

  const runAction = async (title, message, action) => {
    try {
      await action();
      showToast(title, message);
      return true;
    } catch (error) {
      showToast('Qualification action failed', error.message || 'Check your connection and try again.');
      return false;
    }
  };

  const submitQualification = async (resource, submissionType, experienceDetails, file) => runAction(
    'Qualification submitted',
    'The equipment owner will review your submission.',
    async () => {
      if (!db || !user?.uid || user.role !== 'user') throw new Error('Sign in with a User account to submit qualifications.');
      const needsEvidence = ['certificate', 'training'].includes(submissionType);
      if (needsEvidence && !file) throw new Error('Attach the requested qualification evidence.');
      if (['experience', 'assessment'].includes(submissionType) && !experienceDetails.trim()) {
        throw new Error('Add details about your experience or assessment request.');
      }
      const evidence = file ? await evidenceFileToDataUrl(file) : null;
      const qualificationRef = doc(collection(db, 'qualifications'));
      await runTransaction(db, async transaction => {
        const resourceRef = doc(db, 'resources', resource.id);
        const resourceSnapshot = await transaction.get(resourceRef);
        if (!resourceSnapshot.exists()) throw new Error('Equipment was not found.');
        const equipment = resourceSnapshot.data();
        if (equipment.ownerUid === user.uid) throw new Error('You cannot submit qualifications for your own equipment.');
        if (getEffectiveQualificationType(equipment) === 'none') {
          throw new Error('This equipment does not require a qualification.');
        }
        transaction.set(qualificationRef, {
          userId: user.uid,
          userName: user.name,
          ownerUid: equipment.ownerUid,
          equipmentId: resource.id,
          equipmentName: equipment.name,
          categoryId: getEquipmentCategoryId(equipment.categoryId || equipment.category),
          qualificationType: getEffectiveQualificationType(equipment),
          submissionType,
          experienceDetails: experienceDetails.trim(),
          hasEvidence: Boolean(evidence),
          evidenceName: file?.name || '',
          evidenceMimeType: evidence?.mimeType || '',
          status: 'Pending',
          reviewerNotes: '',
          assessmentStatus: submissionType === 'assessment' ? 'Requested' : 'Not Requested',
          assessmentScheduledAt: null,
          assessmentResult: '',
          verifiedAt: null,
          expiresAt: null,
          reviewedByUid: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        if (evidence) {
          transaction.set(doc(db, 'qualificationEvidence', qualificationRef.id), {
            userId: user.uid,
            ownerUid: equipment.ownerUid,
            fileName: file.name,
            mimeType: evidence.mimeType,
            dataUrl: evidence.dataUrl,
            createdAt: serverTimestamp()
          });
        }
        createAudit(transaction, user, equipment.ownerUid, {
          action: 'Qualification Submitted',
          resourceName: equipment.name,
          details: `${user.name} submitted ${submissionType.replace('_', ' ')} evidence.`
        }, qualificationRef.id, 'qualification');
        createNotification(
          transaction,
          equipment.ownerUid,
          'Qualification submitted',
          `${user.name} submitted a qualification for ${equipment.name}.`,
          qualificationRef.id,
          'qualification-submission'
        );
      });
    }
  );

  const reviewQualification = (qualificationId, decision, reviewerNotes = '', options = {}) => runAction(
    'Qualification updated',
    'The qualification record and its audit history have been updated.',
    async () => {
      if (!db || user?.role !== 'admin') throw new Error('Only the equipment owner can review qualifications.');
      const qualificationRef = doc(db, 'qualifications', qualificationId);
      await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(qualificationRef);
        if (!snapshot.exists() || snapshot.data().ownerUid !== user.uid) {
          throw new Error('You can only review qualifications for equipment you own.');
        }
        const qualification = snapshot.data();
        if (qualification.status !== 'Pending' && !['Expired', 'Revoked'].includes(decision)) {
          throw new Error('This qualification has already been reviewed.');
        }
        if (['Expired', 'Revoked'].includes(decision) && qualification.status !== 'Verified') {
          throw new Error('Only verified qualifications can be revoked or expired.');
        }

        const update = {
          reviewerNotes: reviewerNotes.trim(),
          reviewedByUid: user.uid,
          updatedAt: serverTimestamp()
        };
        let actionLabel;
        if (decision === 'schedule') {
          if (qualification.submissionType !== 'assessment') throw new Error('This submission did not request a practical assessment.');
          if (!options.scheduledAt) throw new Error('Choose a date and time for the practical assessment.');
          update.assessmentStatus = 'Scheduled';
          update.assessmentScheduledAt = toTimestamp(options.scheduledAt);
          actionLabel = 'Practical Assessment Scheduled';
        } else if (['Passed', 'Failed', 'Training Required'].includes(decision)) {
          if (qualification.submissionType !== 'assessment') throw new Error('This submission did not request a practical assessment.');
          if (qualification.assessmentStatus !== 'Scheduled') {
            throw new Error('Schedule the practical assessment before recording its result.');
          }
          update.assessmentStatus = decision;
          update.assessmentResult = reviewerNotes.trim();
          if (decision === 'Passed') {
            update.status = 'Verified';
            update.verifiedAt = serverTimestamp();
            update.expiresAt = toTimestamp(options.expiresAt);
            actionLabel = 'Practical Assessment Passed';
          } else if (decision === 'Failed') {
            update.status = 'Rejected';
            actionLabel = 'Practical Assessment Failed';
          } else {
            update.status = 'Training Required';
            actionLabel = 'Training Required';
            const resourceRef = doc(db, 'resources', qualification.equipmentId);
            const resourceSnapshot = await transaction.get(resourceRef);
            if (!resourceSnapshot.exists()) throw new Error('The associated equipment listing could not be found.');
            if (!resourceSnapshot.data().trainingRequired) {
              transaction.update(resourceRef, { trainingRequired: true, updatedAt: serverTimestamp() });
            }
          }
        } else if (['Verified', 'Rejected'].includes(decision)) {
          update.status = decision;
          if (decision === 'Verified') {
            update.verifiedAt = serverTimestamp();
            update.expiresAt = toTimestamp(options.expiresAt);
            actionLabel = 'Qualification Verified';
          } else {
            actionLabel = 'Qualification Rejected';
          }
        } else if (['Expired', 'Revoked'].includes(decision)) {
          update.status = decision;
          actionLabel = decision === 'Expired' ? 'Qualification Expired' : 'Qualification Revoked';
        } else {
          throw new Error('Choose a valid qualification review action.');
        }

        transaction.update(qualificationRef, update);
        createAudit(transaction, user, user.uid, {
          action: actionLabel,
          resourceName: qualification.equipmentName,
          details: reviewerNotes.trim() || actionLabel
        }, qualificationId, 'qualification', qualification.userId);
        createNotification(
          transaction,
          qualification.userId,
          'Qualification review updated',
          `${qualification.equipmentName}: ${actionLabel.replace('Qualification ', '').toLowerCase()}.`,
          qualificationId,
          `qualification-${actionLabel.toLowerCase().replaceAll(' ', '-')}`
        );
      });
    }
  );

  const grantQualificationToEquipment = (qualificationId, resource) => runAction(
    'Qualification shared',
    `The verified qualification can now be used for ${resource.name}.`,
    async () => {
      if (!db || user?.role !== 'admin') throw new Error('Only an equipment owner can share a qualification.');
      await runTransaction(db, async transaction => {
        const qualificationRef = doc(db, 'qualifications', qualificationId);
        const resourceRef = doc(db, 'resources', resource.id);
        const [qualificationSnapshot, resourceSnapshot] = await Promise.all([
          transaction.get(qualificationRef),
          transaction.get(resourceRef)
        ]);
        if (!qualificationSnapshot.exists() || !resourceSnapshot.exists()) {
          throw new Error('The qualification or equipment listing could not be found.');
        }
        const qualification = qualificationSnapshot.data();
        const equipment = resourceSnapshot.data();
        const expired = qualification.expiresAt?.toDate && qualification.expiresAt.toDate() <= new Date();
        if (
          qualification.ownerUid !== user.uid
          || qualification.status !== 'Verified'
          || expired
          || equipment.ownerUid !== user.uid
          || !equipment.qualificationReusable
          || getEffectiveQualificationType(equipment) !== qualification.qualificationType
          || getEquipmentCategoryId(equipment.categoryId || equipment.category) !== qualification.categoryId
        ) {
          throw new Error('This qualification cannot be shared with the selected equipment.');
        }
        const grantId = `${qualificationId}_${resource.id}`;
        transaction.set(doc(db, 'qualificationGrants', grantId), {
          qualificationId,
          userId: qualification.userId,
          ownerUid: user.uid,
          resourceId: resource.id,
          resourceName: equipment.name,
          categoryId: qualification.categoryId,
          qualificationType: qualification.qualificationType,
          active: true,
          createdAt: serverTimestamp()
        });
        createAudit(transaction, user, user.uid, {
          action: 'Qualification Shared',
          resourceName: equipment.name,
          details: `Qualification shared with ${equipment.name}.`
        }, `${qualificationId}_${resource.id}`, 'qualificationGrant', qualification.userId);
        createNotification(
          transaction,
          qualification.userId,
          'Qualification accepted for another item',
          `Your verified qualification can also be used for ${equipment.name}.`,
          grantId,
          'qualification-shared'
        );
      });
    }
  );

  return {
    qualifications,
    qualificationGrants,
    submitQualification,
    reviewQualification,
    grantQualificationToEquipment
  };
}

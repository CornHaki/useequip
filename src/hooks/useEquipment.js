import { useContext } from 'react';
import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { DataContext } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db } from '../firebase';
import { imageFileToDataUrl } from '../services/imageData';
import { getEquipmentCategoryId } from '../config/equipmentCategories';

const listValues = (value, fallback = []) => value
  ? value.split(',').map(item => item.trim()).filter(Boolean)
  : fallback;

export function useEquipment() {
  const { resources } = useContext(DataContext);
  const { user } = useAuth();
  const { showToast } = useToast();

  const handleCreateResource = async (form, onSuccess) => {
    try {
      if (!db || !user?.uid) throw new Error('Sign in to list equipment.');
      const imageData = await imageFileToDataUrl(form.image);
      const resourceRef = doc(collection(db, 'resources'));
      await runTransaction(db, async transaction => {
        transaction.set(resourceRef, {
          name: form.name.trim(),
          category: getEquipmentCategoryId(form.category),
          categoryId: getEquipmentCategoryId(form.category),
          description: (form.description || '').trim(),
          subcategory: (form.subcategory || '').trim(),
          qualificationType: form.qualificationType || 'none',
          qualificationInstructions: (form.qualificationInstructions || '').trim(),
          trainingRequired: Boolean(form.trainingRequired),
          supervisedUseAllowed: Boolean(form.supervisedUseAllowed),
          qualificationReusable: Boolean(form.qualificationReusable),
          safetyInstructions: (form.safetyInstructions || '').trim(),
          location: form.location.trim(),
          imageData,
          requirements: listValues(form.requirements, ['General Safety']),
          checklist: listValues(form.checklist, ['Main unit clean']),
          usageRules: form.usageRules || 'Please check the equipment before and after use.',
          specs: { 'Max Borrow Time': '8 Hours' },
          status: 'Available',
          ownerUid: user.uid,
          ownerName: user.name,
          department: user.department || '',
          archived: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      showToast('Equipment Added', `${form.name.trim()} is now listed.`);
      if (onSuccess) onSuccess();
      return true;
    } catch (error) {
      showToast('Equipment not added', error.message || 'Please try again.');
      return false;
    }
  };

  const updateResourceStatus = async (resourceId, status) => {
    try {
      if (!db) throw new Error('Firebase is not configured.');
      const resourceRef = doc(db, 'resources', resourceId);
      await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(resourceRef);
        if (!snapshot.exists() || snapshot.data().ownerUid !== user?.uid) {
          throw new Error('You can only manage your own equipment.');
        }
        if (snapshot.data().reservedByBookingId) {
          throw new Error('Equipment with an active booking cannot be changed.');
        }
        transaction.update(resourceRef, { status, updatedAt: serverTimestamp() });
      });
      showToast('Availability updated', `Equipment is now marked ${status.toLowerCase()}.`);
      return true;
    } catch (error) {
      showToast('Update failed', error.message || 'Please try again.');
      return false;
    }
  };

  const updateResource = async (resourceId, form, existingImageData) => {
    try {
      if (!db) throw new Error('Firebase is not configured.');
      const imageData = form.image ? await imageFileToDataUrl(form.image) : existingImageData;
      const resourceRef = doc(db, 'resources', resourceId);
      await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(resourceRef);
        if (!snapshot.exists() || snapshot.data().ownerUid !== user?.uid) {
          throw new Error('You can only edit your own equipment.');
        }
        if (snapshot.data().reservedByBookingId) {
          throw new Error('Equipment with an active booking cannot be edited.');
        }
        transaction.update(resourceRef, {
          name: form.name.trim(),
          category: getEquipmentCategoryId(form.category),
          categoryId: getEquipmentCategoryId(form.category),
          description: (form.description || '').trim(),
          subcategory: (form.subcategory || '').trim(),
          qualificationType: form.qualificationType || 'none',
          qualificationInstructions: (form.qualificationInstructions || '').trim(),
          trainingRequired: Boolean(form.trainingRequired),
          supervisedUseAllowed: Boolean(form.supervisedUseAllowed),
          qualificationReusable: Boolean(form.qualificationReusable),
          safetyInstructions: (form.safetyInstructions || '').trim(),
          location: form.location.trim(),
          imageData,
          requirements: listValues(form.requirements),
          checklist: listValues(form.checklist),
          usageRules: form.usageRules || 'Please check the equipment before and after use.',
          updatedAt: serverTimestamp()
        });
      });
      showToast('Equipment updated', `${form.name.trim()} was saved.`);
      return true;
    } catch (error) {
      showToast('Equipment not updated', error.message || 'Please try again.');
      return false;
    }
  };

  const archiveResource = async (resourceId) => {
    try {
      if (!db) throw new Error('Firebase is not configured.');
      const resourceRef = doc(db, 'resources', resourceId);
      await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(resourceRef);
        if (!snapshot.exists() || snapshot.data().ownerUid !== user?.uid) {
          throw new Error('You can only remove your own equipment.');
        }
        if (snapshot.data().reservedByBookingId) {
          throw new Error('Resolve the active booking before removing this listing.');
        }
        transaction.update(resourceRef, {
          archived: true,
          archivedAt: serverTimestamp(),
          archivedByUid: user.uid
        });
      });
      showToast('Listing removed', 'The equipment and its history were retained.');
      return true;
    } catch (error) {
      showToast('Equipment not removed', error.message || 'Please try again.');
      return false;
    }
  };

  return { resources, handleCreateResource, updateResource, archiveResource, updateResourceStatus };
}

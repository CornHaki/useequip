import { doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export function createAudit(
  transaction,
  actor,
  ownerUid,
  details,
  relatedId,
  relatedType = 'booking',
  relatedUserUid = actor.uid
) {
  const auditId = `${relatedId}_${details.action}`;
  transaction.set(doc(db, 'auditLogs', auditId), {
    actorUid: actor.uid,
    actor: actor.name || actor.email || actor.uid,
    role: actor.role === 'admin' ? 'Owner' : 'Borrower',
    userId: relatedUserUid,
    ownerUid,
    actionLabel: details.action,
    relatedId,
    relatedType,
    resourceName: details.resourceName,
    details: details.details,
    createdAt: serverTimestamp()
  });
}

export function createNotification(transaction, recipientUid, title, message, relatedId, type) {
  transaction.set(doc(db, 'notifications', `${relatedId}_${type}`), {
    recipientUid,
    title,
    message,
    relatedId,
    type,
    read: false,
    createdAt: serverTimestamp()
  });
}

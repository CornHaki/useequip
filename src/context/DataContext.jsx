import React, { createContext, useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db, firebaseConfigError } from '../firebase';
import { useAuth } from './AuthContext';
import { hasRole } from '../utils/permissions';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [reports, setReports] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(firebaseConfigError);
  useEffect(() => {
    if (authLoading) return undefined;
    if (!db) {
      setLoading(false);
      setError(firebaseConfigError);
      return undefined;
    }
    if (!user) {
      setResources([]);
      setBookings([]);
      setAuditLogs([]);
      setReports([]);
      setNotifications([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setError('');
    let active = true;
    const roles = ['user', 'admin'].filter((role) => hasRole(user, role));
    let remainingInitialSnapshots = 1 + roles.length * 3 + (hasRole(user, 'admin') ? 1 : 0);
    const initializedCollections = new Set();
    const snapshotVersions = new Map();
    const queryDocuments = new Map();
    const listeners = [];
    const subscribe = (collectionName, queryKey, constraints, setter) => {
      const source = collection(db, collectionName);
      const dataQuery = query(source, ...constraints);
      listeners.push(onSnapshot(dataQuery, async (snapshot) => {
        const subscriptionKey = `${collectionName}:${queryKey}`;
        const version = (snapshotVersions.get(subscriptionKey) || 0) + 1;
        snapshotVersions.set(subscriptionKey, version);
        try {
          const documents = await Promise.all(snapshot.docs.map(async (entry) => {
            const data = entry.data();
            if (collectionName === 'resources' && data.imageData) {
              data.image = data.imageData;
            } else if (collectionName === 'equipmentReports' && data.photoData) {
              data.photoUrl = data.photoData;
            } else if (collectionName === 'bookings') {
              for (const field of ['checkInData', 'checkOutData']) {
                if (data[field]?.photoData) {
                  data[field] = { ...data[field], photoUrl: data[field].photoData };
                }
              }
            }
            return { id: entry.id, ...data };
          }));
          if (!active || snapshotVersions.get(subscriptionKey) !== version) return;
          if (!queryDocuments.has(collectionName)) queryDocuments.set(collectionName, new Map());
          queryDocuments.get(collectionName).set(queryKey, documents);
          const combined = new Map();
          queryDocuments.get(collectionName).forEach((group) => {
            group.forEach((document) => combined.set(document.id, document));
          });
          setter([...combined.values()]);
          if (!initializedCollections.has(subscriptionKey)) {
            initializedCollections.add(subscriptionKey);
            remainingInitialSnapshots -= 1;
            if (remainingInitialSnapshots <= 0) setLoading(false);
          }
        } catch (snapshotError) {
          if (!active) return;
          setError(snapshotError.message || `Could not load ${collectionName}.`);
          setLoading(false);
        }
      }, (snapshotError) => {
        setError(snapshotError.message || `Could not load ${collectionName}.`);
        setLoading(false);
      }));
    };

    subscribe('resources', 'all', [orderBy('createdAt', 'desc')], setResources);
    for (const role of roles) {
      const ownerField = role === 'admin' ? 'ownerUid' : 'userId';
      subscribe('bookings', role, [
        where(ownerField, '==', user.uid),
        orderBy('createdAt', 'desc')
      ], setBookings);
      subscribe('auditLogs', role, [
        where(ownerField, '==', user.uid),
        orderBy('createdAt', 'desc')
      ], setAuditLogs);
      subscribe('equipmentReports', role, [
        where(ownerField, '==', user.uid),
        orderBy('createdAt', 'desc')
      ], setReports);
    }
    if (hasRole(user, 'admin')) {
      subscribe('notifications', 'admin', [
        where('recipientUid', '==', user.uid),
        orderBy('createdAt', 'desc')
      ], setNotifications);
    } else {
      setNotifications([]);
    }

    return () => {
      active = false;
      listeners.forEach((unsubscribe) => unsubscribe());
    };
  }, [authLoading, user]);

  return (
    <DataContext.Provider value={{
      resources: resources.filter((resource) => !resource.archived),
      bookings,
      auditLogs,
      reports,
      notifications,
      loading,
      error
    }}>
      {children}
    </DataContext.Provider>
  );
};

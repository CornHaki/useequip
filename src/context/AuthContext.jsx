import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, firebaseConfigError } from '../firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(auth));
  const [authError, setAuthError] = useState(firebaseConfigError);
  const disabledAccountNotice = useRef(false);
  const authStateVersion = useRef(0);

  useEffect(() => {
    if (!auth || !db) return undefined;
    return onAuthStateChanged(auth, async (firebaseUser) => {
      const stateVersion = ++authStateVersion.current;
      if (!firebaseUser) {
        setUser(null);
        setAuthError(disabledAccountNotice.current
          ? 'Admin access to this account has been disabled. Contact an authorized administrator.'
          : '');
        disabledAccountNotice.current = false;
        setLoading(false);
        return;
      }

      try {
        const profileSnapshot = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (stateVersion !== authStateVersion.current) return;
        if (!profileSnapshot.exists()) {
          setUser(null);
          setAuthError('Your account profile has not been provisioned. Please contact support.');
          setLoading(false);
          return;
        }
        const profile = profileSnapshot.data();
        if (profile.active === false) {
          setUser(null);
          disabledAccountNotice.current = true;
          await signOut(auth);
          setAuthError('Admin access to this account has been disabled. Contact an authorized administrator.');
          return;
        }
        if (!['user', 'admin'].includes(profile.role)) {
          throw new Error('Your account has an invalid role. Contact an administrator.');
        }
        const account = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || profile.email,
          name: profile.name || firebaseUser.displayName || firebaseUser.email,
          role: profile.role,
          roles: [profile.role],
          contactPhone: profile.contactPhone || '',
          department: profile.department || ''
        };
        setUser(account);
        setAuthError('');
      } catch (error) {
        if (stateVersion !== authStateVersion.current) return;
        setUser(null);
        setAuthError(error.message || 'Could not load your account profile.');
      } finally {
        if (stateVersion === authStateVersion.current) setLoading(false);
      }
    });
  }, []);

  const login = async (role, email, password) => {
    if (!auth || !db) throw new Error(firebaseConfigError);
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const profileSnapshot = await getDoc(doc(db, 'users', credential.user.uid));
    if (!profileSnapshot.exists()) {
      await signOut(auth);
      throw new Error('Your account profile has not been provisioned. Please contact support.');
    }
    const profile = profileSnapshot.data();
    if (profile.active === false) {
      await signOut(auth);
      throw new Error('Admin access to this account has been disabled. Contact an authorized administrator.');
    }
    if (profile.role !== role) {
      await signOut(auth);
      throw new Error('Your account is not registered with this role. Please select the correct login option.');
    }
    setUser({
      uid: credential.user.uid,
      email: credential.user.email || profile.email,
      name: profile.name || credential.user.displayName || credential.user.email,
      role: profile.role,
      roles: [profile.role],
      contactPhone: profile.contactPhone || '',
      department: profile.department || ''
    });
    disabledAccountNotice.current = false;
    setAuthError('');
  };

  const registerAccount = async (role, name, email, password, contactPhone, department) => {
    if (!auth || !db) throw new Error(firebaseConfigError);
    if (!['user', 'admin'].includes(role)) throw new Error('Choose a valid account type.');
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    const profileRef = doc(db, 'users', credential.user.uid);
    const profile = {
      uid: credential.user.uid,
      role,
      active: true,
      name: name.trim(),
      email: credential.user.email || email.trim(),
      contactPhone: contactPhone.trim(),
      department: department.trim(),
      activeBookings: 0,
      createdAt: serverTimestamp()
    };
    try {
      await setDoc(profileRef, profile);
    } catch (registrationError) {
      try {
        await deleteUser(credential.user);
      } catch {
        await signOut(auth);
      }
      throw new Error(`Firebase account was created but profile setup was denied: ${registrationError.message || 'check Firestore rules'}. Deploy the current Firestore rules and try Sign Up again with this email and password.`);
    }

    const signedInUser = {
      uid: credential.user.uid,
      email: credential.user.email || profile.email,
      name: profile.name || credential.user.displayName || credential.user.email,
      role,
      roles: [role],
      contactPhone: profile.contactPhone || '',
      department: profile.department || ''
    };
    setUser(signedInUser);
    setAuthError('');
    disabledAccountNotice.current = false;
    return signedInUser;
  };

  const logout = () => auth ? signOut(auth) : Promise.resolve();

  return (
    <AuthContext.Provider value={{
      user,
      login,
      registerAccount,
      logout,
      loading,
      authError,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

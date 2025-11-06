import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  deleteUser
} from 'firebase/auth';
import { auth, db, storage } from '../services/firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import imageCompression from 'browser-image-compression';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, displayName) {
    let userCreated = null;
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      userCreated = userCredential.user;
      
      await updateProfile(userCreated, { displayName });
      await sendEmailVerification(userCreated);
      console.log("Correo de verificación enviado exitosamente");
      
      await setDoc(doc(db, 'users', userCreated.uid), {
        email: userCreated.email,
        displayName: displayName,
        role: 'user',
        photoURL: '',
        createdAt: serverTimestamp(),
        createdAtMillis: Date.now(),
      });
      
      await signOut(auth);
      
      return { success: true };
      
    } catch (error) {
      console.error("Error en signup:", error.code, error.message);
      
      if (userCreated) {
        try {
          if (error.code !== 'auth/email-already-in-use') {
            await sendEmailVerification(userCreated);
          }
        } catch (emailError) {
          console.error("Error al enviar correo:", emailError);
        }
        await signOut(auth);
      }
      
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('EMAIL_IN_USE');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('INVALID_EMAIL');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('WEAK_PASSWORD');
      } else {
        throw error;
      }
    }
  }

  async function deleteUnverifiedUserAndSignup(email, password, displayName) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (!user.emailVerified) {
        console.log("Usuario no verificado encontrado. Verificando tiempo de espera...");
        
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const createdAtMillis = userData.createdAtMillis;
          const now = Date.now();
          const thirtyMinutesInMillis = 30 * 60 * 1000;
          const timePassed = now - createdAtMillis;
          
          if (timePassed < thirtyMinutesInMillis) {
            const timeRemaining = thirtyMinutesInMillis - timePassed;
            const minutesRemaining = Math.ceil(timeRemaining / 60000);
            
            await signOut(auth);
            throw new Error(`WAIT_TIME_${minutesRemaining}`);
          }
        }
        
        try {
          await deleteDoc(doc(db, 'users', user.uid));
          console.log("Documento de Firestore eliminado");
        } catch (error) {
          console.log("No había documento en Firestore o ya fue eliminado");
        }
        
        await deleteUser(user);
        console.log("Usuario de Auth eliminado");
        
        return await signup(email, password, displayName);
      } else {
        await signOut(auth);
        throw new Error('USER_ALREADY_VERIFIED');
      }
    } catch (error) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error('WRONG_PASSWORD');
      }
      throw error;
    }
  }

  async function toggleFavorite(siteId) {
    if (!currentUser) return;

    const userDocRef = doc(db, "users", currentUser.uid);
    const isFavorite = currentUser.favorites?.includes(siteId);

    if (isFavorite) {
      await updateDoc(userDocRef, {
        favorites: arrayRemove(siteId),
      });
    } else {
      await updateDoc(userDocRef, {
        favorites: arrayUnion(siteId),
      });
    }
  }

  async function updateDisplayName(newName) {
    if (!currentUser) throw new Error("No hay usuario autenticado.");
    if (!newName.trim()) throw new Error("El nombre no puede estar vacío.");

    await updateProfile(auth.currentUser, { displayName: newName });
    await updateDoc(doc(db, 'users', currentUser.uid), { 
      displayName: newName, 
      displayNameLastChanged: serverTimestamp() 
    });
    await refreshCurrentUser();
  }

  async function updateProfilePicture(file) {
    if (!currentUser) return;

    const imageOptions = { maxSizeMB: 0.5, maxWidthOrHeight: 400, useWebWorker: true };
    const compressedFile = await imageCompression(file, imageOptions);

    const fileRef = ref(storage, `profile-pictures/${currentUser.uid}`);
    
    await uploadBytes(fileRef, compressedFile);
    const photoURL = await getDownloadURL(fileRef);

    await updateProfile(auth.currentUser, { photoURL });
    await updateDoc(doc(db, 'users', currentUser.uid), { photoURL });
    await refreshCurrentUser();
  }

  async function deleteProfilePicture() {
    if (!currentUser || !currentUser.photoURL) return;

    const fileRef = ref(storage, `profile-pictures/${currentUser.uid}`);

    try {
      await deleteObject(fileRef);
    } catch (error) {
      if (error.code !== 'storage/object-not-found') {
        throw error;
      }
    }

    await updateProfile(auth.currentUser, { photoURL: '' });
    await updateDoc(doc(db, 'users', currentUser.uid), { photoURL: '' });
    await refreshCurrentUser();
  }

  async function login(email, password, bypassVerificationCheck = false) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    if (!bypassVerificationCheck && !userCredential.user.emailVerified) {
      await signOut(auth);
      throw new Error('email-not-verified');
    }
    
    return userCredential;
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'user',
        createdAt: serverTimestamp(),
        createdAtMillis: Date.now(),
      });
    }
    
    return result;
  }

  function logout() {
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  async function refreshCurrentUser() {
    const user = auth.currentUser;
    if (!user) {
      setCurrentUser(null);
      return;
    }
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    setCurrentUser({ ...user, ...(userDoc.exists() ? userDoc.data() : {}) });
  }

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const docUnsubscribe = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            const userProfile = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || userData.displayName,
              photoURL: user.photoURL || userData.photoURL,
              ...userData,
            };
            
            setCurrentUser(userProfile);
            
          } else {
            const newUserProfile = {
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              role: 'user',
              favorites: [],
              commentsCheckDone: true
            };
            setDoc(userDocRef, newUserProfile).then(() => {
              setCurrentUser({ uid: user.uid, ...newUserProfile });
            });
          }
          setLoading(false);
        }, (error) => {
          console.error("Error al escuchar el documento del usuario:", error);
          setLoading(false);
        });
        
        return () => docUnsubscribe();
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return authUnsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    deleteUnverifiedUserAndSignup,
    toggleFavorite,
    updateProfilePicture,
    deleteProfilePicture,
    updateDisplayName,
    refreshCurrentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
import React, { useEffect, useState } from 'react';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  type User,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import { AuthContext } from './useAuth';


declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: () => void;
          renderButton: (
            parent: HTMLElement,
            options: { theme?: string; size?: string; width?: number }
          ) => void;
        };
      };
    };
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(() => isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      return;
    }


    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Google One Tap initialization
  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId || !window.google || user || !auth) return;

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          try {
            const credential = GoogleAuthProvider.credential(response.credential);
            if (auth) {
              await signInWithCredential(auth, credential);
            }
          } catch (err) {
            console.error('Google One Tap sign-in error:', err);
          }
        },
        auto_select: true,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.prompt();
    } catch (e) {
      console.warn('Google One Tap init failed:', e);
    }
  }, [user]);

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      alert(
        'Firebase is not configured yet. To enable real Google Login, fill in your Firebase keys in .env.local! In the meantime, the app works fully in Local Mode.'
      );
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in with Google error:', error);
    }
  };

  const signOut = async () => {
    if (auth) {
      await firebaseSignOut(auth);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured: isFirebaseConfigured,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


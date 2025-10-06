// src/contexts/auth-context.tsx

'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { User as PrismaUser } from '@prisma/client';
import { syncUserToFirestore } from '@/lib/syncUser';


type AuthContextType = {
  user: PrismaUser | null; // User from our database
  firebaseUser: FirebaseUser | null; // User from Firebase
  loading: boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PrismaUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async (fbUser: FirebaseUser | null) => {
    if (fbUser) {
      try {
        await syncUserToFirestore(fbUser);
        const token = await fbUser.getIdToken(true); // Force refresh
        const response = await fetch('/api/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const dbUser = await response.json();
          setUser(dbUser);
        } else {
          console.error('Failed to fetch user profile from DB.');
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      await fetchUser(fbUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUser]);

  const refreshUser = useCallback(async () => {
    await fetchUser(firebaseUser);
  }, [firebaseUser, fetchUser]);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

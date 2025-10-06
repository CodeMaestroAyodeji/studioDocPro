// src/lib/auth-utils.ts

import { headers } from 'next/headers';
import admin from '@/lib/firebase-admin';
import db from '@/lib/prisma';

export async function getCurrentUserRole(): Promise<string | null> {
  const authHeader = headers().get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const idToken = authHeader.split('Bearer ')[1];
  if (!idToken) return null;

  try {
    // First, try to get role from custom claims for efficiency
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if (decodedToken.role) {
      return decodedToken.role;
    }
    // If not in claims, fall back to DB
    const user = await db.user.findUnique({ where: { id: decodedToken.uid } });
    return user?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

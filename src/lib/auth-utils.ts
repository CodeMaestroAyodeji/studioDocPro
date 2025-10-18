// src/lib/auth-utils.ts

import { headers } from 'next/headers';
import admin from '@/lib/firebase-admin';
import prisma from '@/lib/prisma';
import { User } from '@prisma/client';

export async function getCurrentUser(): Promise<User | null> {
  const headerList = await headers();
  const authHeader = headerList.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const idToken = authHeader.split('Bearer ')[1];
  if (!idToken) return null;

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const user = await prisma.user.findUnique({ where: { id: decodedToken.uid } });
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export async function getCurrentUserRole(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.role || null;
}
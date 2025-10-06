// src/app/api/users/me/route.ts

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import admin from '@/lib/firebase-admin';
import db from '@/lib/prisma';

/**
 * GET /api/users/me
 * Returns the currently authenticated user's profile.
 */
export async function GET(request: Request) {
  try {
    // Get token from Authorization header
    const headersList = await headers();
    const authorization = headersList.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      console.error('GET /api/users/me: No Bearer token found');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const idToken = authorization.split('Bearer ')[1];
    if (!idToken) {
      console.error('GET /api/users/me: No token provided');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Verify Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid } = decodedToken;

    // Check if user exists in Prisma DB
    let user = await db.user.findUnique({
      where: { id: uid },
    });

    if (user) {
      // User found, update last sign-in time
      user = await db.user.update({
        where: { id: uid },
        data: { lastSignInTime: new Date() },
      });
    } else {
      // If user not found by UID, get Firebase data and upsert
      const firebaseUser = await admin.auth().getUser(uid);
      if (!firebaseUser) {
        console.error('GET /api/users/me: Firebase user not found');
        return new NextResponse('User not found', { status: 404 });
      }

      const email = firebaseUser.email ?? `${uid}@unknown.com`;

      // This will find a user by email and update their UID and other details,
      // or create a new user if no user with that email exists.
      user = await db.user.upsert({
        where: { email: email },
        update: {
          id: uid, // Sync UID
          name: firebaseUser.displayName ?? 'Unnamed User',
          photoURL: firebaseUser.photoURL ?? null,
          lastSignInTime: new Date(),
        },
        create: {
          id: uid,
          email: email,
          name: firebaseUser.displayName ?? 'Unnamed User',
          photoURL: firebaseUser.photoURL ?? null,
          role: 'User', // default role
          lastSignInTime: new Date(),
        },
      });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error: any) {
    console.error('[API_USERS_ME_GET]', error);

    if (error.code === 'auth/argument-error') {
      return new NextResponse('Invalid or expired token', { status: 401 });
    }

    return new NextResponse('Authentication error', { status: 401 });
  }
}

/**
 * PATCH /api/users/me
 * Updates user profile information.
 */
export async function PATCH(request: Request) {
  try {
    const headersList = await headers();
    const authorization = headersList.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      console.error('PATCH /api/users/me: No Bearer token found');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid } = decodedToken;

    const body = await request.json();
    const { name, email, photoURL } = body;

    const updatedUser = await db.user.update({
      where: { id: uid },
      data: { name, email, photoURL },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('[API_USERS_ME_PATCH]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

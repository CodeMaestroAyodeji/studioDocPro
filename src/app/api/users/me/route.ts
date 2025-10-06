// src/app/api/users/me/route.ts

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import admin from '@/lib/firebase-admin';
import db from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const headersList = await headers();
    const authorization = headersList.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const idToken = authorization.split('Bearer ')[1];
    if (!idToken) {
      console.error('GET /api/users/me: No token provided');
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid } = decodedToken;

    let user = await db.user.findUnique({
      where: {
        id: uid,
      },
    });

    if (!user) {
        // This is a fallback in case the user was created in Firebase
        // but the database sync failed. We can try to create the user now.
        const firebaseUser = await admin.auth().getUser(uid);
        if (firebaseUser) {
            user = await db.user.create({
                data: {
                    id: uid,
                    email: firebaseUser.email!,
                    name: firebaseUser.displayName,
                    photoURL: firebaseUser.photoURL,
                    role: 'User',
                }
            });
        } else {
             return new NextResponse('User not found', { status: 404 });
        }
    }

    // Optionally, update lastSignInTime
    const updatedUser = await db.user.update({
        where: { id: uid },
        data: { lastSignInTime: new Date() },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('[API_USERS_ME_GET]', error);
    // Return a generic error to the client
    return new NextResponse('Authentication error', { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const headersList = await headers();
    const authorization = headersList.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid } = decodedToken;

    const body = await request.json();
    const { name, email, photoURL } = body;

    const updatedUser = await db.user.update({
      where: {
        id: uid,
      },
      data: {
        name,
        email,
        photoURL,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('[API_USERS_ME_PATCH]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
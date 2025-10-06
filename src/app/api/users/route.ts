// src/app/api/users/route.ts

import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { z } from 'zod';
import { adminAuth } from '@/lib/firebase-admin'; // ✅ use your existing admin setup

const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  photoURL: z.string().url().optional(),
});

export async function POST(request: Request) {
  try {
    const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!idToken) {
      console.error('POST /api/users: No token provided');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // ✅ Verify the Firebase token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;

    const body = await request.json();
    const userData = userSchema.parse(body);

    if (firebaseUid !== userData.id) {
      return new NextResponse('Token user ID mismatch', { status: 403 });
    }

    const user = await db.user.upsert({
      where: { email: userData.email },
      update: {
        id: userData.id,
        name: userData.name,
        photoURL: userData.photoURL,
      },
      create: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        photoURL: userData.photoURL,
      },
    });

    return NextResponse.json(user, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('[API_USERS_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


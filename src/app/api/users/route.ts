// src/app/api/users/route.ts

import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { z } from 'zod';

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

    const body = await request.json();
    const userData = userSchema.parse(body);

    // Check if user already exists to make this endpoint idempotent
    const existingUser = await db.user.findUnique({
      where: {
        id: userData.id,
      },
    });

    if (existingUser) {
      return NextResponse.json(existingUser, { status: 200 });
    }

    const newUser = await db.user.create({
      data: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        photoURL: userData.photoURL,
        // The role will be set to the default value 'User' from the schema
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('[API_USERS_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

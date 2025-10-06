// src/app/api/users/[id]/route.ts

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import admin from '@/lib/firebase-admin';
import db from '@/lib/prisma';
import { z } from 'zod';

async function verifyAdmin(authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith('Bearer ')) return false;

  const idToken = authHeader.split('Bearer ')[1];
  if (!idToken) {
    console.error('Admin verification failed: No token provided');
    return false;
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const user = await db.user.findUnique({ where: { id: decodedToken.uid } });
    return user?.role === 'Admin' || user?.role === 'SuperAdmin';
  } catch (error) {
    console.error('Admin verification failed', error);
    return false;
  }
}

const roleUpdateSchema = z.object({
  role: z.string(),
});

// ✅ Do not explicitly type `context` — let Next.js infer it
export async function PUT(request: Request, context: any) {
  const { params } = context;

  const headersList = await headers();
  const isAdmin = await verifyAdmin(headersList.get('Authorization'));
  if (!isAdmin) return new NextResponse('Forbidden', { status: 403 });

  try {
    const body = await request.json();
    const { role } = roleUpdateSchema.parse(body);

    const updatedUser = await db.user.update({
      where: { id: params.id },
      data: { role },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('[API_USERS_ID_PUT]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  const { params } = context;

  const headersList = await headers();
  const authHeader = headersList.get('Authorization');
  const isAdmin = await verifyAdmin(authHeader);
  if (!isAdmin) return new NextResponse('Forbidden', { status: 403 });

  try {
    const { id } = params;
    if (!authHeader) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    const userToDelete = await db.user.findUnique({ where: { id } });
    if (userToDelete?.role === 'SuperAdmin') {
      return new NextResponse("SuperAdmins cannot be deleted", { status: 403 });
    }

    if (id === decodedToken.uid) {
      return new NextResponse("Admins cannot delete themselves", { status: 400 });
    }

    await Promise.all([
      db.user.delete({ where: { id } }),
      admin.auth().deleteUser(id),
    ]);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[API_USERS_ID_DELETE]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
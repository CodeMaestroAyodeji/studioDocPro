import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import admin from '@/lib/firebase-admin';
import { headers } from 'next/headers';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const headersList = headers();
    const authHeader = headersList.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  
    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  
    try {
      await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    try {
        await prisma.paymentVoucher.delete({
            where: { id },
        });
        return NextResponse.json({ message: 'Payment voucher deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error(`Failed to delete payment voucher with id ${id}:`, error);
        return NextResponse.json({ error: 'Failed to delete payment voucher' }, { status: 500 });
    }
}

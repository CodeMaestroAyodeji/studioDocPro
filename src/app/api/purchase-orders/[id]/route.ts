import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import admin from '@/lib/firebase-admin';
import { headers } from 'next/headers';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const authHeader = headers().get('Authorization');
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

    try {
        const purchaseOrder = await prisma.purchaseOrder.findUnique({
            where: { id: parseInt(params.id, 10) },
            include: {
                vendor: true,
                lineItems: true,
            },
        });

        if (!purchaseOrder) {
            return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
        }

        return NextResponse.json(purchaseOrder);
    } catch (error) {
        console.error('Failed to fetch purchase order:', error);
        return NextResponse.json({ error: 'Failed to fetch purchase order' }, { status: 500 });
    }
}
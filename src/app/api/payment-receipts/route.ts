import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import admin from '@/lib/firebase-admin';
import { headers } from 'next/headers';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET() {
    const headersList =await headers();
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

    try {
        const paymentReceipts = await prisma.paymentReceipt.findMany({
            include: {
                client: true,
            },
            orderBy: {
                paymentDate: 'desc',
            },
        });
        return NextResponse.json(paymentReceipts);
    } catch (error) {
        console.error('Failed to fetch payment receipts:', error);
        return NextResponse.json({ error: 'Failed to fetch payment receipts' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const headersList =await headers();
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

    try {
        const body = await req.json();
        const { clientId, paymentDate, amount, paymentMethod, notes, salesInvoices } = body;

        // Basic validation
        if (!clientId || !paymentDate || !amount || !paymentMethod) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const receiptNumber = `REC-${Date.now()}`;

        const newPaymentReceipt = await prisma.paymentReceipt.create({
            data: {
                receiptNumber,
                clientId,
                paymentDate: new Date(paymentDate),
                amount,
                paymentMethod,
                notes,
                salesInvoices: salesInvoices ? { connect: salesInvoices.map((id: number) => ({ id })) } : undefined,
            },
            include: {
                client: true,
            },
        });

        return NextResponse.json(newPaymentReceipt, { status: 201 });
    } catch (error) {
        console.error('Failed to create payment receipt:', error);
        return NextResponse.json({ error: 'Failed to create payment receipt' }, { status: 500 });
    }
}

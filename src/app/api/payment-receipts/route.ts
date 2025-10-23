// src/app/api/payment-receipts/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import admin from '@/lib/firebase-admin';
import { headers } from 'next/headers';
import * as z from 'zod';

const prisma = new PrismaClient();

const receiptSchema = z.object({
  clientId: z.number(),
  paymentDate: z.string().datetime(),
  amount: z.number().min(0.01),
  paymentMethod: z.string().min(1),
  notes: z.string().optional(),
  salesInvoices: z.array(z.number()).optional(),
  receivingBankId: z.string().optional(), // ✅ ADDED
  issuedById: z.string().optional(),      // ✅ ADDED
});

export const dynamic = 'force-dynamic';

export async function GET() {
  const headersList = await headers();
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
        // NOTE: We don't need to add bank/issuer to the *list* page
        // to save bandwidth, so this 'include' is fine as-is.
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });
    return NextResponse.json(paymentReceipts);
  } catch (error) {
    console.error('Failed to fetch payment receipts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment receipts' },
      { status: 500 }
    );
  }
}

import { getNextPaymentReceiptNumber } from '@/lib/payment-receipt-sequence';

export async function POST(req: Request) {
  const headersList = await headers();
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
    const data = receiptSchema.parse(body);

    const receiptNumber = await getNextPaymentReceiptNumber();

    const newPaymentReceipt = await prisma.paymentReceipt.create({
      data: {
        receiptNumber,
        clientId: data.clientId,
        paymentDate: new Date(data.paymentDate),
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        salesInvoices: data.salesInvoices
          ? { connect: data.salesInvoices.map((id: number) => ({ id })) }
          : undefined,
        // ✅ ADDED LOGIC TO SAVE BANK AND SIGNATORY
        receivingBankId: data.receivingBankId
          ? parseInt(data.receivingBankId, 10)
          : null,
        issuedById: data.issuedById ? parseInt(data.issuedById, 10) : null,
      },
      include: {
        client: true,
      },
    });

    return NextResponse.json(newPaymentReceipt, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Failed to create payment receipt:', error);
    return NextResponse.json(
      { error: 'Failed to create payment receipt' },
      { status: 500 }
    );
  }
}
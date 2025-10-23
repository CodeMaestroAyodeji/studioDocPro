// src/app/api/payment-receipts/[id]/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import admin from '@/lib/firebase-admin';
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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authHeader = req.headers.get('Authorization');
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
    const paymentReceipt = await prisma.paymentReceipt.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        client: true,
        salesInvoices: true,
        receivingBank: true, // ✅ ADDED
        issuedBy: true,      // ✅ ADDED
      },
    });

    if (!paymentReceipt) {
      return NextResponse.json(
        { error: 'Payment receipt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(paymentReceipt);
  } catch (error) {
    console.error('Failed to fetch payment receipt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment receipt' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authHeader = req.headers.get('Authorization');
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

    const updatedPaymentReceipt = await prisma.paymentReceipt.update({
      where: { id: parseInt(id, 10) },
      data: {
        clientId: data.clientId,
        paymentDate: new Date(data.paymentDate),
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        salesInvoices: {
          set: data.salesInvoices
            ? data.salesInvoices.map((id: number) => ({ id }))
            : [],
        },
        // ✅ ADDED LOGIC TO UPDATE BANK AND SIGNATORY
        receivingBankId: data.receivingBankId
          ? parseInt(data.receivingBankId, 10)
          : null,
        issuedById: data.issuedById ? parseInt(data.issuedById, 10) : null,
      },
      include: {
        client: true,
        receivingBank: true, // Also include on update response
        issuedBy: true,      // Also include on update response
      },
    });

    return NextResponse.json(updatedPaymentReceipt);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Failed to update payment receipt:', error);
    return NextResponse.json(
      { error: 'Failed to update payment receipt' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authHeader = req.headers.get('Authorization');
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
    await prisma.paymentReceipt.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json(
      { message: 'Payment receipt deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to delete payment receipt:', error);
    return NextResponse.json(
      { error: 'Failed to delete payment receipt' },
      { status: 500 }
    );
  }
}
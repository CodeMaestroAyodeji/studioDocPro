import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import admin from '@/lib/firebase-admin';
import { headers } from 'next/headers';
import * as z from 'zod';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// Zod schema for validation
const invoiceItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().min(0.01),
  unitPrice: z.number().min(0),
});

const invoiceSchema = z.object({
  clientId: z.number(),
  issueDate: z.string().datetime(),
  lineItems: z.array(invoiceItemSchema).min(1),
  notes: z.string().optional(),
  discount: z.number().optional(),
});

import { getNextSalesInvoiceNumber } from '@/lib/sales-invoice-sequence';

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
    const json = await req.json();
    const data = invoiceSchema.parse(json);

    const companyProfile = await prisma.companyProfile.findFirst();
    const taxRate = companyProfile?.taxRate || 0.075;

    const subtotal = data.lineItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const discountAmount = data.discount ? subtotal * (data.discount / 100) : 0;
    const totalBeforeTax = subtotal - discountAmount;
    const tax = totalBeforeTax * taxRate;
    const total = totalBeforeTax + tax;

    const invoiceNumber = await getNextSalesInvoiceNumber();

    const newInvoice = await prisma.salesInvoice.create({
      data: {
        invoiceNumber,
        clientId: data.clientId,
        issueDate: data.issueDate,
        notes: data.notes,
        discount: data.discount,
        subtotal,
        tax,
        total,
        status: 'Draft',
        lineItems: {
          create: data.lineItems.map(item => ({ ...item, total: item.quantity * item.unitPrice }))
        },
      },
      include: {
        client: true,
        lineItems: true,
      }
    });

    return NextResponse.json(newInvoice, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Failed to create invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}

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
        const invoices = await prisma.salesInvoice.findMany({
            include: {
                client: {
                    select: { name: true }
                }
            },
            orderBy: {
                issueDate: 'desc'
            }
        });
        return NextResponse.json(invoices);
    } catch (error) {
        console.error('Failed to fetch invoices:', error);
        return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }
}
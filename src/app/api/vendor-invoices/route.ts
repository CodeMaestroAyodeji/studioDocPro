import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import admin from '@/lib/firebase-admin';
import { headers } from 'next/headers';

const prisma = new PrismaClient();

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
        const vendorInvoices = await prisma.vendorInvoice.findMany({
            include: {
                vendor: true,
            },
            orderBy: {
                invoiceDate: 'desc',
            },
        });
        return NextResponse.json(vendorInvoices);
    } catch (error) {
        console.error('Failed to fetch vendor invoices:', error);
        return NextResponse.json({ error: 'Failed to fetch vendor invoices' }, { status: 500 });
    }
}

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
        const { vendorId, invoiceDate, dueDate, lineItems, notes } = body;

        if (!vendorId || !invoiceDate || !lineItems || !lineItems.length) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const subtotal = lineItems.reduce((acc: number, item: any) => acc + item.quantity * item.unitPrice, 0);
        const tax = subtotal * 0.075; // 7.5% VAT
        const total = subtotal + tax;

        const invoiceNumber = `VINV-${Date.now()}`;

        const newVendorInvoice = await prisma.vendorInvoice.create({
            data: {
                invoiceNumber,
                vendorId,
                invoiceDate: new Date(invoiceDate),
                dueDate: new Date(dueDate),
                subtotal,
                tax,
                total,
                notes,
                lineItems: {
                    create: lineItems.map((item: any) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        total: item.quantity * item.unitPrice,
                    })),
                },
            },
            include: {
                vendor: true,
                lineItems: true,
            },
        });

        return NextResponse.json(newVendorInvoice, { status: 201 });
    } catch (error) {
        console.error('Failed to create vendor invoice:', error);
        return NextResponse.json({ error: 'Failed to create vendor invoice' }, { status: 500 });
    }
}

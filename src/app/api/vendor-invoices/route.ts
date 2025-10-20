import { NextResponse } from 'next/server';
import { z } from 'zod';
import db from '@/lib/prisma';
import { adminAuth } from '@/lib/firebase-admin';

const invoiceItemSchema = z.object({
  id: z.string().optional(), // Added for consistency with edit page
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(0.01, 'Must be > 0'),
  unitPrice: z.coerce.number().min(0, 'Cannot be negative'),
  discount: z.coerce.number().min(0).optional(),
  tax: z.boolean(),
});

const invoiceSchema = z.object({
  vendorId: z.string().min(1, 'Please select a vendor'),
  projectName: z.string().min(1, 'Project name is required'),
  invoiceNumber: z.string(),
  invoiceDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  lineItems: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
});

async function verifyToken(request: Request) {
    const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!idToken) {
        return null;
    }
    try {
        return await adminAuth.verifyIdToken(idToken);
    } catch (error) {
        console.error('Token verification failed', error);
        return null;
    }
}

export async function POST(request: Request) {
    const decodedToken = await verifyToken(request);
    if (!decodedToken) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const body = await request.json();
        const { lineItems, ...invoiceData } = invoiceSchema.parse(body);

        const TAX_RATE = 7.5;

        let subtotal = 0;
        let totalTax = 0;
        const totalDiscount = lineItems.reduce((acc, item) => acc + (item.discount || 0), 0);

        const processedLineItems = lineItems.map(item => {
            const amount = item.quantity * item.unitPrice;
            if (item.tax) {
                const baseAmount = amount / (1 + TAX_RATE / 100);
                const taxAmount = amount - baseAmount;
                subtotal += baseAmount;
                totalTax += taxAmount;
                return {
                    ...item,
                    total: amount,
                };
            } else {
                subtotal += amount;
                return {
                    ...item,
                    total: amount,
                };
            }
        });

        const total = subtotal - totalDiscount + totalTax;

        const newInvoice = await db.vendorInvoice.create({
            data: {
                ...invoiceData,
                vendorId: parseInt(invoiceData.vendorId, 10),
                subtotal,
                tax: totalTax,
                total,
                lineItems: {
                    create: processedLineItems.map(item => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        discount: item.discount,
                        tax: item.tax,
                        total: item.total,
                    })),
                },
            },
            include: {
                lineItems: true,
            },
        });

        return NextResponse.json(newInvoice, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('[API_VENDOR_INVOICE_POST]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function GET(request: Request) {
    const decodedToken = await verifyToken(request);
    if (!decodedToken) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const invoices = await db.vendorInvoice.findMany({
            include: {
                vendor: true,
            },
            orderBy: {
                invoiceDate: 'desc',
            },
        });
        return NextResponse.json(invoices);
    } catch (error) {
        console.error('[API_VENDOR_INVOICE_GET]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

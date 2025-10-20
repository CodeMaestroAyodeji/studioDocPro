import { NextResponse } from 'next/server';
import { z } from 'zod';
import db from '@/lib/prisma';
import { adminAuth } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

const invoiceItemSchema = z.object({
  id: z.any().optional(),
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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const decodedToken = await verifyToken(request);
    if (!decodedToken) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const invoice = await db.vendorInvoice.findUnique({
            where: { id: parseInt(id, 10) },
            include: {
                vendor: {
                    include: {
                        bankAccounts: true,
                    },
                },
                lineItems: true,
            },
        });

        if (!invoice) {
            return new NextResponse('Invoice not found', { status: 404 });
        }

        return NextResponse.json(invoice);
    } catch (error) {
        console.error('[API_VENDOR_INVOICE_GET_SINGLE]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const decodedToken = await verifyToken(request);
    if (!decodedToken) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const body = await request.json();
        const { lineItems, ...invoiceData } = invoiceSchema.parse(body);

        const subtotal = lineItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
        const totalTax = lineItems.reduce((acc, item) => {
            if (item.tax) {
                const itemTotal = item.quantity * item.unitPrice - (item.discount || 0);
                return acc + itemTotal * 0.075;
            }
            return acc;
        }, 0);
        const totalDiscount = lineItems.reduce((acc, item) => acc + (item.discount || 0), 0);
        const total = subtotal - totalDiscount + totalTax;

        await db.vendorInvoiceItem.deleteMany({
            where: { vendorInvoiceId: parseInt(id, 10) },
        });

        const updatedInvoice = await db.vendorInvoice.update({
            where: { id: parseInt(id, 10) },
            data: {
                ...invoiceData,
                vendorId: parseInt(invoiceData.vendorId, 10),
                subtotal,
                tax: totalTax,
                total,
                lineItems: {
                    create: lineItems.map(item => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        discount: item.discount,
                        tax: item.tax,
                        total: item.quantity * item.unitPrice - (item.discount || 0),
                    })),
                },
            },
            include: {
                lineItems: true,
            },
        });

        revalidatePath(`/vendor-invoice/${id}`);
        revalidatePath('/vendor-invoice');

        return NextResponse.json(updatedInvoice);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('[API_VENDOR_INVOICE_PUT]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const decodedToken = await verifyToken(request);
    if (!decodedToken) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        await db.vendorInvoiceItem.deleteMany({
            where: { vendorInvoiceId: parseInt(id, 10) },
        });

        await db.vendorInvoice.delete({
            where: { id: parseInt(id, 10) },
        });

        revalidatePath('/vendor-invoice');

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('[API_VENDOR_INVOICE_DELETE]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
import { NextResponse } from 'next/server';
import { z } from 'zod';
import db from '@/lib/prisma';
import { adminAuth } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

const lineItemSchema = z.object({
  id: z.any().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(0.01, 'Must be > 0'),
  unitPrice: z.coerce.number().min(0, 'Cannot be negative'),
});

const poSchema = z.object({
  vendorId: z.string().min(1, 'Please select a vendor'),
  poNumber: z.string(),
  projectName: z.string().min(1, 'Project name is required'),
  orderDate: z.coerce.date(),
  deliveryDate: z.coerce.date().optional(),
  lineItems: z.array(lineItemSchema).min(1, 'At least one item is required'),
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

export async function GET(request: Request, context: { params: { id: string } }) {
    const decodedToken = await verifyToken(request);
    if (!decodedToken) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        // const id = context.params.id;
        const { id } = await context.params;
        const po = await db.purchaseOrder.findUnique({
            where: { id: parseInt(id, 10) },
            include: {
                vendor: true,
                lineItems: true,
            },
        });

        if (!po) {
            return new NextResponse('Purchase order not found', { status: 404 });
        }

        return NextResponse.json(po);
    } catch (error) {
        console.error('[API_PO_GET_SINGLE]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function PUT(request: Request, context: { params: { id: string } }) {
    const decodedToken = await verifyToken(request);
    if (!decodedToken) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        // const id = context.params.id;
        const { id } = await context.params;
        const body = await request.json();
        const { lineItems, ...poData } = poSchema.parse(body);

        const subtotal = lineItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
        const tax = subtotal * 0.1; // 10% tax
        const total = subtotal + tax;

        await db.purchaseOrderLineItem.deleteMany({
            where: { purchaseOrderId: parseInt(id, 10) },
        });

        const updatedPO = await db.purchaseOrder.update({
            where: { id: parseInt(id, 10) },
            data: {
                ...poData,
                vendorId: parseInt(poData.vendorId, 10),
                subtotal,
                tax,
                total,
                lineItems: {
                    create: lineItems.map(item => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        total: item.quantity * item.unitPrice,
                    })),
                },
            },
            include: {
                lineItems: true,
            },
        });

        revalidatePath(`/purchase-order/${id}`);
        revalidatePath('/purchase-order');

        return NextResponse.json(updatedPO);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('[API_PO_PUT]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
    const decodedToken = await verifyToken(request);
    if (!decodedToken) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const id = context.params.id;
        await db.purchaseOrderLineItem.deleteMany({
            where: { purchaseOrderId: parseInt(id, 10) },
        });

        await db.purchaseOrder.delete({
            where: { id: parseInt(id, 10) },
        });

        revalidatePath('/purchase-order');

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('[API_PO_DELETE]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
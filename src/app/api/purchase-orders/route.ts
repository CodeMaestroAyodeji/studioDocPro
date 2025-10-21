import { NextResponse } from 'next/server';
import { z } from 'zod';
import db from '@/lib/prisma';
import { adminAuth } from '@/lib/firebase-admin';
import { getNextPoNumber } from '@/lib/po-sequence';

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(0.01, 'Must be > 0'),
  unitPrice: z.coerce.number().min(0, 'Cannot be negative'),
});

const poSchema = z.object({
  vendorId: z.string().min(1, 'Please select a vendor'),
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

export async function GET(request: Request) {
    const decodedToken = await verifyToken(request);
    if (!decodedToken) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const purchaseOrders = await db.purchaseOrder.findMany({
            include: {
                vendor: true,
            },
            orderBy: {
                orderDate: 'desc',
            },
        });
        return NextResponse.json(purchaseOrders);
    } catch (error) {
        console.error('[API_PO_GET_ALL]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function POST(request: Request) {
    const decodedToken = await verifyToken(request);
    if (!decodedToken) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const body = await request.json();
        const { lineItems, ...poData } = poSchema.parse(body);

        const subtotal = lineItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
        const tax = subtotal * 0.1; // 10% tax
        const total = subtotal + tax;

        const companyProfile = await db.companyProfile.findFirst();
        if (!companyProfile) {
            return new NextResponse('Company profile not found', { status: 404 });
        }
        const poNumber = await getNextPoNumber(companyProfile.name);


        const newPurchaseOrder = await db.purchaseOrder.create({
            data: {
                ...poData,
                poNumber,
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
                vendor: true,
            },
        });

        return NextResponse.json(newPurchaseOrder, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('[API_PO_POST]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
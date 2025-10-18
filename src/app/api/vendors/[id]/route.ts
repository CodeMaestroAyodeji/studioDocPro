
import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { z } from 'zod';
import { adminAuth } from '@/lib/firebase-admin';

const vendorSchema = z.object({
    name: z.string().min(1, 'Company Name is required'),
    contactName: z.string().optional(),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
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
        const { id } = await context.params;
        const vendor = await db.vendor.findUnique({
            where: { id: parseInt(id, 10) },
        });

        if (!vendor) {
            return new NextResponse('Vendor not found', { status: 404 });
        }

        return NextResponse.json(vendor);
    } catch (error) {
        console.error('[API_VENDOR_GET]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function PUT(request: Request, context: { params: { id: string } }) {
    const decodedToken = await verifyToken(request);
    if (!decodedToken) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const { id } = await context.params;
        const body = await request.json();
        const vendorData = vendorSchema.parse(body);

        const updatedVendor = await db.vendor.update({
            where: { id: parseInt(id, 10) },
            data: vendorData,
        });

        return NextResponse.json(updatedVendor);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('[API_VENDOR_PUT]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
    const decodedToken = await verifyToken(request);
    if (!decodedToken) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const { id } = await context.params;
        await db.vendor.delete({
            where: { id: parseInt(id, 10) },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('[API_VENDOR_DELETE]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

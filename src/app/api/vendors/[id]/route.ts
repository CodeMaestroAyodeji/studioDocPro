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
    website: z.string().optional(),
    tin: z.string().optional(),
    logoUrl: z.string().optional(),
    invoiceTemplate: z.string().optional(),
    bankName: z.string().optional(),
    accountName: z.string().optional(),
    accountNumber: z.string().optional(),
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
            include: { 
                bankAccounts: true,
                _count: {
                    select: { vendorInvoices: true }
                }
            },
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
        const { bankName, accountName, accountNumber, ...vendorInfo } = vendorData;

        const updatedVendor = await db.vendor.update({
            where: { id: parseInt(id, 10) },
            data: vendorInfo,
        });

        if (bankName && accountName && accountNumber) {
            const existingBankAccount = await db.vendorBankAccount.findFirst({
                where: { vendorId: parseInt(id, 10) },
            });

            if (existingBankAccount) {
                await db.vendorBankAccount.update({
                    where: { id: existingBankAccount.id },
                    data: { bankName, accountName, accountNumber },
                });
            } else {
                await db.vendorBankAccount.create({
                    data: {
                        bankName,
                        accountName,
                        accountNumber,
                        vendorId: parseInt(id, 10),
                    },
                });
            }
        } else {
            await db.vendorBankAccount.deleteMany({
                where: { vendorId: parseInt(id, 10) },
            });
        }

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
        await db.vendorBankAccount.deleteMany({ where: { vendorId: parseInt(id, 10) } });
        await db.vendor.delete({
            where: { id: parseInt(id, 10) },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('[API_VENDOR_DELETE]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import db from '@/lib/prisma';
import { adminAuth } from '@/lib/firebase-admin';
import { getNextVoucherNumber } from '@/lib/voucher-sequence';

const voucherSchema = z.object({
  payeeName: z.string().min(1, 'Payee name is required'),
  date: z.coerce.date(),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  bankAccountId: z.string().min(1, 'Bank account is required'),
  description: z.string().min(1, 'Description is required'),
  preparedById: z.string().min(1, 'Prepared by is required'),
  approvedById: z.string().min(1, 'Approved by is required'),
  payeeBankName: z.string().optional(),
  payeeAccountName: z.string().optional(),
  payeeAccountNumber: z.string().optional(),
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
        const vouchers = await db.paymentVoucher.findMany({
            include: {
                bankAccount: true,
                preparedBy: true,
                approvedBy: true,
            },
            orderBy: {
                paymentDate: 'desc',
            },
        });
        return NextResponse.json(vouchers);
    } catch (error) {
        console.error('[API_PV_GET_ALL]', error);
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
        const { date, ...voucherData } = voucherSchema.parse(body);

        const companyProfile = await db.companyProfile.findFirst();
        if (!companyProfile) {
            return new NextResponse('Company profile not found', { status: 404 });
        }
        const voucherNumber = await getNextVoucherNumber(companyProfile.name);

        const newPaymentVoucher = await db.paymentVoucher.create({
            data: {
                ...voucherData,
                voucherNumber,
                paymentDate: date,
                bankAccountId: parseInt(voucherData.bankAccountId, 10),
                preparedById: parseInt(voucherData.preparedById, 10),
                approvedById: parseInt(voucherData.approvedById, 10),
            },
        });

        return NextResponse.json(newPaymentVoucher, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('[API_PV_POST]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
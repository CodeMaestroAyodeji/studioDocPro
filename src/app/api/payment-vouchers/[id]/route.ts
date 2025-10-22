import { NextResponse } from 'next/server';
import { z } from 'zod';
import db from '@/lib/prisma';
import { adminAuth } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

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

export async function GET(request: Request, context: { params: { id: string } }) {
    const decodedToken = await verifyToken(request);
    if (!decodedToken) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
         const { id } = await context.params;
        const voucher = await db.paymentVoucher.findUnique({
            where: { id: parseInt(id, 10) },
            include: {
                bankAccount: true,
                preparedBy: true,
                approvedBy: true,
            },
        });

        if (!voucher) {
            return new NextResponse('Payment voucher not found', { status: 404 });
        }

        return NextResponse.json(voucher);
    } catch (error) {
        console.error('[API_PV_GET_SINGLE]', error);
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
        const { date, ...voucherData } = voucherSchema.parse(body);

        const updatedVoucher = await db.paymentVoucher.update({
            where: { id: parseInt(id, 10) },
            data: {
                ...voucherData,
                paymentDate: date,
                bankAccountId: parseInt(voucherData.bankAccountId, 10),
                preparedById: parseInt(voucherData.preparedById, 10),
                approvedById: parseInt(voucherData.approvedById, 10),
            },
        });

        revalidatePath(`/payment-voucher/${id}`);
        revalidatePath('/payment-voucher');

        return NextResponse.json(updatedVoucher);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('[API_PV_PUT]', error);
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
        await db.paymentVoucher.delete({
            where: { id: parseInt(id, 10) },
        });

        revalidatePath('/payment-voucher');

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('[API_PV_DELETE]', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

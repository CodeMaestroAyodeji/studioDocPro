import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import admin from '@/lib/firebase-admin';
import { headers } from 'next/headers';
import { z } from 'zod';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

const vendorSchema = z.object({
  name: z.string().min(1, 'Company Name is required'),
  contactName: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  website: z.string().optional(),
  tin: z.string().optional(),
  logoUrl: z.string().optional(),
  invoiceTemplate: z.string().optional(),
  bankName: z.string().optional(),
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
});

export async function POST(request: Request) {
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
    const body = await request.json();
    const vendorData = vendorSchema.parse(body);

    const { bankName, accountName, accountNumber, ...vendorInfo } = vendorData;

    const vendor = await prisma.vendor.create({
      data: {
        ...vendorInfo,
      },
    });

    if (bankName && accountName && accountNumber) {
      await prisma.vendorBankAccount.create({
        data: {
          bankName,
          accountName,
          accountNumber,
          vendorId: vendor.id,
        },
      });
    }

    return NextResponse.json(vendor, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', error.issues);
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating vendor:', error);
    return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
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
    const vendors = await prisma.vendor.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
  }
}
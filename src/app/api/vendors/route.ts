import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import admin from '@/lib/firebase-admin';
import { headers } from 'next/headers';
import { z } from 'zod';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

const vendorSchema = z.object({
  companyName: z.string().min(1, 'Company Name is required'),
  contactName: z.string().min(1, 'Contact Name is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
}).strip();

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
    console.log("Request body:", body);
    const vendorData = vendorSchema.parse(body);
    console.log("Parsed vendor data:", vendorData);

    const vendor = await prisma.vendor.create({
      data: {
        name: vendorData.companyName,
        contactName: vendorData.contactName,
        email: vendorData.email,
        phone: vendorData.phone,
        address: vendorData.address,
      },
    });

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

    const formattedVendors = vendors.map(vendor => ({
      ...vendor,
      id: String(vendor.id),
      companyName: vendor.name,
      contactName: vendor.contactName || 'N/A',
      invoiceTemplate: 'template-1',
    }));

    return NextResponse.json(formattedVendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
  }
}
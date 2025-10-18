// src/app/api/company-profile/route.ts

import { NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { z } from 'zod';

const signatorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  title: z.string().min(1, 'Title is required'),
});

const bankAccountSchema = z.object({
  id: z.string(),
  bankName: z.string().min(1, 'Bank name is required'),
  accountName: z.string().min(1, 'Account name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
});

const profileSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  address: z.string().min(1, 'Address is required'),
  tin: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  logoUrl: z.string().url('Logo is required').min(1, 'Logo is required'),
  signatories: z.array(signatorySchema),
  bankAccounts: z.array(bankAccountSchema),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const profileData = profileSchema.parse(body);

    const { signatories, bankAccounts, ...companyData } = profileData;

    const companyProfile = await db.companyProfile.upsert({
      where: { id: 1 },
      update: companyData,
      create: { ...companyData, id: 1 },
    });

    // Clear existing signatories and bank accounts
    await db.signatory.deleteMany({ where: { companyProfileId: 1 } });
    await db.bankAccount.deleteMany({ where: { companyProfileId: 1 } });

    // Create new signatories and bank accounts
    if (signatories && signatories.length > 0) {
      await db.signatory.createMany({
        data: signatories.map((s) => ({ ...s, companyProfileId: 1, id: undefined })),
      });
    }

    if (bankAccounts && bankAccounts.length > 0) {
      await db.bankAccount.createMany({
        data: bankAccounts.map((b) => ({ ...b, companyProfileId: 1, id: undefined })),
      });
    }

    return NextResponse.json(companyProfile, { status: 200 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('[API_COMPANY_PROFILE_POST]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET() {
  try {
    const companyProfile = await db.companyProfile.findUnique({
      where: { id: 1 },
      include: {
        signatories: true,
        bankAccounts: true,
      },
    });

    if (!companyProfile) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const profileWithSringIds = {
      ...companyProfile,
      signatories: companyProfile.signatories.map((s) => ({
        ...s,
        id: String(s.id),
      })),
      bankAccounts: companyProfile.bankAccounts.map((b) => ({
        ...b,
        id: String(b.id),
      })),
    };

    return NextResponse.json(profileWithSringIds, { status: 200 });
  } catch (error: any) {
    console.error('[API_COMPANY_PROFILE_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

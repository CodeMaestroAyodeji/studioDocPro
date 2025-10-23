import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import admin from '@/lib/firebase-admin';
import * as z from 'zod';

const prisma = new PrismaClient();

// Zod schema for validation
const invoiceItemSchema = z.object({
  id: z.number().optional(),
  description: z.string().min(1),
  quantity: z.number().min(0.01),
  unitPrice: z.number().min(0),
});

const invoiceSchema = z.object({
  clientId: z.number(),
  issueDate: z.string().datetime(),
  lineItems: z.array(invoiceItemSchema).min(1),
  notes: z.string().optional(),
  status: z.string().optional(),
  discount: z.number().optional(),
});

export async function GET(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authHeader = req.headers.get('Authorization');
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
        const invoice = await prisma.salesInvoice.findUnique({
      where: { id: parseInt(id, 10) },
      include: { client: true, lineItems: true },
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        return NextResponse.json(invoice);
    } catch (error) {
        console.error('Failed to fetch invoice:', error);
        return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
    }
}

export async function PATCH(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authHeader = req.headers.get('Authorization');
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
        const json = await req.json();
        const data = invoiceSchema.parse(json);

        const invoiceId = parseInt(id, 10);

        const updatedInvoice = await prisma.$transaction(async (tx) => {
            const existingLineItems = await tx.invoiceLineItem.findMany({
                where: { invoiceId },
            });

            const lineItemsToCreate = data.lineItems.filter(item => !item.id);
            const lineItemsToUpdate = data.lineItems.filter(item => item.id && existingLineItems.some(eli => eli.id === item.id));
            const lineItemIdsToDelete = existingLineItems
                .filter(eli => !data.lineItems.some(item => item.id === eli.id))
                .map(eli => eli.id);

            if (lineItemIdsToDelete.length > 0) {
                await tx.invoiceLineItem.deleteMany({ where: { id: { in: lineItemIdsToDelete } } });
            }

            if (lineItemsToUpdate.length > 0) {
                for (const item of lineItemsToUpdate) {
                    await tx.invoiceLineItem.update({
                        where: { id: item.id },
                        data: { ...item, total: item.quantity * item.unitPrice },
                    });
                }
            }

            if (lineItemsToCreate.length > 0) {
                await tx.invoiceLineItem.createMany({
                    data: lineItemsToCreate.map(item => ({ ...item, invoiceId, total: item.quantity * item.unitPrice })),
                });
            }

            const companyProfile = await tx.companyProfile.findFirst();
            const taxRate = companyProfile?.taxRate || 0.075;

            const allLineItems = await tx.invoiceLineItem.findMany({ where: { invoiceId } });
            const subtotal = allLineItems.reduce((acc, item) => acc + item.total, 0);
            const discountAmount = data.discount ? subtotal * (data.discount / 100) : 0;
            const totalBeforeTax = subtotal - discountAmount;
            const tax = totalBeforeTax * taxRate;
            const total = totalBeforeTax + tax;

            return tx.salesInvoice.update({
                where: { id: invoiceId },
                data: {
                    clientId: data.clientId,
                    issueDate: data.issueDate,
                    notes: data.notes,
                    status: data.status,
                    discount: data.discount,
                    subtotal,
                    tax,
                    total,
                },
                include: { client: true, lineItems: true },
            });
        });

        return NextResponse.json(updatedInvoice);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Failed to update invoice:', error);
        return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
    }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authHeader = req.headers.get('Authorization');
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
    await prisma.invoiceLineItem.deleteMany({
      where: { invoiceId: parseInt(id, 10) },
    });

    await prisma.salesInvoice.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json({ message: 'Invoice deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete invoice:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}

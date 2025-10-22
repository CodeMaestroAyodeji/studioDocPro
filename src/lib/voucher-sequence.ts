import db from './prisma';

export async function getNextVoucherNumber(companyName: string): Promise<string> {
    const sequence = await db.sequence.upsert({
        where: { id: 'voucher' },
        update: { value: { increment: 1 } },
        create: { id: 'voucher', value: 1 },
    });

    const year = new Date().getFullYear();
    const companyPrefix = companyName.substring(0, 3).toUpperCase();
    const paddedSequence = String(sequence.value).padStart(4, '0');

    return `PV-${companyPrefix}-${year}-${paddedSequence}`;
}
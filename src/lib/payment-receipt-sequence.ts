import db from '@/lib/prisma';
import { getNextSequenceValue } from '@/lib/sequence-utils';

export async function getNextPaymentReceiptNumber(): Promise<string> {
    const companyProfile = await db.companyProfile.findFirst();
    const companyName = companyProfile?.name || 'BSL';

    const companyInitials = companyName.substring(0, 3).toUpperCase();
    const year = new Date().getFullYear();
    const sequenceId = `receipt_${companyInitials}_${year}`;

    const nextValue = await getNextSequenceValue(sequenceId);

    const paddedNumber = String(nextValue).padStart(4, '0');
    return `RCPT-${companyInitials}-${year}-${paddedNumber}`;
}

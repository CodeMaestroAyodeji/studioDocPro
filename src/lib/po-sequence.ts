import db from '@/lib/prisma';
import { getNextSequenceValue } from '@/lib/sequence-utils';

export async function getNextPoNumber(companyName: string): Promise<string> {
    const companyInitials = companyName.substring(0, 3).toUpperCase();
    const year = new Date().getFullYear();
    const sequenceId = `po_${companyInitials}_${year}`;

    const result = await getNextSequenceValue(sequenceId);

    const paddedNumber = String(result).padStart(4, '0');
    return `PO-${companyInitials}-${year}-${paddedNumber}`;
}
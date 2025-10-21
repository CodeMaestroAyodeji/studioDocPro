import db from '@/lib/prisma';

export async function getNextPoNumber(companyName: string): Promise<string> {
    const companyInitials = companyName.substring(0, 3).toUpperCase();
    const year = new Date().getFullYear();
    const sequenceId = `po_${companyInitials}_${year}`;

    const result = await db.$transaction(async (prisma) => {
        let sequence = await prisma.sequence.findUnique({ where: { id: sequenceId } });

        if (!sequence) {
            sequence = await prisma.sequence.create({
                data: { id: sequenceId, value: 1 },
            });
        } else {
            sequence = await prisma.sequence.update({
                where: { id: sequenceId },
                data: { value: { increment: 1 } },
            });
        }

        return sequence.value;
    });

    const paddedNumber = String(result).padStart(4, '0');
    return `PO-${companyInitials}-${year}-${paddedNumber}`;
}
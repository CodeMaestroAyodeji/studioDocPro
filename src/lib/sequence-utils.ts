import db from '@/lib/prisma';

export async function getNextSequenceValue(sequenceId: string): Promise<number> {
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

    return result;
}

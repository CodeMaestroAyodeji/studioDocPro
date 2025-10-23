-- AlterTable
ALTER TABLE "payment_receipts" ADD COLUMN     "issuedById" INTEGER,
ADD COLUMN     "receivingBankId" INTEGER;

-- AddForeignKey
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "signatories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_receivingBankId_fkey" FOREIGN KEY ("receivingBankId") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

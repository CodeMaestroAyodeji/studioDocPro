/*
  Warnings:

  - You are about to drop the column `vendorId` on the `payment_vouchers` table. All the data in the column will be lost.
  - You are about to drop the column `taxable` on the `purchase_order_line_items` table. All the data in the column will be lost.
  - Added the required column `approvedById` to the `payment_vouchers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bankAccountId` to the `payment_vouchers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `payment_vouchers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payeeName` to the `payment_vouchers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `preparedById` to the `payment_vouchers` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."payment_vouchers" DROP CONSTRAINT "payment_vouchers_vendorId_fkey";

-- AlterTable
ALTER TABLE "payment_vouchers" DROP COLUMN "vendorId",
ADD COLUMN     "approvedById" INTEGER NOT NULL,
ADD COLUMN     "bankAccountId" INTEGER NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "payeeAccountName" TEXT,
ADD COLUMN     "payeeAccountNumber" TEXT,
ADD COLUMN     "payeeBankName" TEXT,
ADD COLUMN     "payeeName" TEXT NOT NULL,
ADD COLUMN     "preparedById" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "purchase_order_line_items" DROP COLUMN "taxable";

-- AddForeignKey
ALTER TABLE "payment_vouchers" ADD CONSTRAINT "payment_vouchers_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "signatories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_vouchers" ADD CONSTRAINT "payment_vouchers_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "signatories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_vouchers" ADD CONSTRAINT "payment_vouchers_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

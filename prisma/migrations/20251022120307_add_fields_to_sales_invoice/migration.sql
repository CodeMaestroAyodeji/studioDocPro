-- AlterTable
ALTER TABLE "sales_invoices" ADD COLUMN     "addVat" BOOLEAN,
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "bankAccountId" TEXT,
ADD COLUMN     "discount" DOUBLE PRECISION,
ADD COLUMN     "preparedById" TEXT;

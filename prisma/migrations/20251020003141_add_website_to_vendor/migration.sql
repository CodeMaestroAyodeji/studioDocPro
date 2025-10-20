-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "tin" TEXT,
ADD COLUMN     "website" TEXT;

-- CreateTable
CREATE TABLE "vendor_bank_accounts" (
    "id" SERIAL NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "vendorId" INTEGER NOT NULL,

    CONSTRAINT "vendor_bank_accounts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "vendor_bank_accounts" ADD CONSTRAINT "vendor_bank_accounts_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

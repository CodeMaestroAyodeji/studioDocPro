/*
  Warnings:

  - A unique constraint covering the columns `[voucherNumber]` on the table `payment_vouchers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[poNumber]` on the table `purchase_orders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[invoiceNumber]` on the table `sales_invoices` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `amount` to the `payment_vouchers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentDate` to the `payment_vouchers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentMethod` to the `payment_vouchers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `payment_vouchers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vendorId` to the `payment_vouchers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `voucherNumber` to the `payment_vouchers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderDate` to the `purchase_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `poNumber` to the `purchase_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `purchase_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tax` to the `purchase_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `purchase_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `purchase_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vendorId` to the `purchase_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `sales_invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dueDate` to the `sales_invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `invoiceNumber` to the `sales_invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `issueDate` to the `sales_invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `sales_invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tax` to the `sales_invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `sales_invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `sales_invoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `vendors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `vendors` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "payment_vouchers" ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paymentDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "paymentMethod" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vendorId" INTEGER NOT NULL,
ADD COLUMN     "voucherNumber" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "deliveryDate" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "orderDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "poNumber" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Draft',
ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "tax" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "total" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vendorId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "sales_invoices" ADD COLUMN     "clientId" INTEGER NOT NULL,
ADD COLUMN     "dueDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "invoiceNumber" TEXT NOT NULL,
ADD COLUMN     "issueDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Draft',
ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "tax" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "total" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "address" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "invoice_line_items" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "invoiceId" INTEGER NOT NULL,

    CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_receipts" (
    "id" SERIAL NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" INTEGER NOT NULL,

    CONSTRAINT "payment_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_line_items" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "purchaseOrderId" INTEGER NOT NULL,

    CONSTRAINT "purchase_order_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PaymentVoucherToSalesInvoice" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_PaymentVoucherToSalesInvoice_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PaymentReceiptToSalesInvoice" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_PaymentReceiptToSalesInvoice_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_receipts_receiptNumber_key" ON "payment_receipts"("receiptNumber");

-- CreateIndex
CREATE INDEX "_PaymentVoucherToSalesInvoice_B_index" ON "_PaymentVoucherToSalesInvoice"("B");

-- CreateIndex
CREATE INDEX "_PaymentReceiptToSalesInvoice_B_index" ON "_PaymentReceiptToSalesInvoice"("B");

-- CreateIndex
CREATE UNIQUE INDEX "payment_vouchers_voucherNumber_key" ON "payment_vouchers"("voucherNumber");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_poNumber_key" ON "purchase_orders"("poNumber");

-- CreateIndex
CREATE UNIQUE INDEX "sales_invoices_invoiceNumber_key" ON "sales_invoices"("invoiceNumber");

-- AddForeignKey
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "sales_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_vouchers" ADD CONSTRAINT "payment_vouchers_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_line_items" ADD CONSTRAINT "purchase_order_line_items_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PaymentVoucherToSalesInvoice" ADD CONSTRAINT "_PaymentVoucherToSalesInvoice_A_fkey" FOREIGN KEY ("A") REFERENCES "payment_vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PaymentVoucherToSalesInvoice" ADD CONSTRAINT "_PaymentVoucherToSalesInvoice_B_fkey" FOREIGN KEY ("B") REFERENCES "sales_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PaymentReceiptToSalesInvoice" ADD CONSTRAINT "_PaymentReceiptToSalesInvoice_A_fkey" FOREIGN KEY ("A") REFERENCES "payment_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PaymentReceiptToSalesInvoice" ADD CONSTRAINT "_PaymentReceiptToSalesInvoice_B_fkey" FOREIGN KEY ("B") REFERENCES "sales_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

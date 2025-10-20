/*
  Warnings:

  - Added the required column `projectName` to the `vendor_invoices` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "vendor_invoices" ADD COLUMN     "projectName" TEXT NOT NULL;

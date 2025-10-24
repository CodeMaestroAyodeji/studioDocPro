import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import admin from "@/lib/firebase-admin";
import { headers } from "next/headers";
import { AppUser } from "@/lib/types";

// Helper: Safely sum potentially null values
const safeSum = (aggregateResult: { _sum: { [key: string]: number | null } } | null, field: string): number => {
  return aggregateResult?._sum?.[field] || 0;
};

export async function GET() {
  // --- Firebase Auth Check ---
  const headersList = await headers();
  const authHeader = headersList.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const idToken = authHeader.split("Bearer ")[1];
  if (!idToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let user: AppUser | null = null;
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    user = (await prisma.user.findUnique({
      where: { id: decodedToken.uid },
    })) as AppUser | null;
    if (!user) throw new Error("User not found");
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // --- End Auth Check ---

  const rawRole = (user?.role || "viewer") as string;
  const roleMap: Record<string, string> = { /* ... role mapping ... */ }; // Assuming your roleMap is defined
  const role = roleMap[rawRole] || rawRole.toLowerCase();

  try {
    // --- Fetch ALL Data Points ---
    const [
      // COMPANY Perspective
      salesInvoiceCount, salesInvoiceSum,
      paymentVoucherCount, paymentVoucherSum,
      purchaseOrderCount, purchaseOrderSum,
      paymentReceiptCount, paymentReceiptSum,
      unpaidSalesInvoiceCount, unpaidSalesInvoiceSum,
      unpaidVendorInvoiceCount, unpaidVendorInvoiceSum, // For company payables
      // VENDORS Perspective
      vendorInvoiceCount, vendorInvoiceSum,
      vendorPOCount, vendorPOSum, // Count matches company PO count
      // TAXES Perspective
      salesInvoiceTaxSum,
      vendorInvoiceTaxSum,
      purchaseOrderTaxSum,
      // Counts needed across perspectives
      userCount
    ] = await Promise.all([
      // COMPANY
      prisma.salesInvoice.count(), prisma.salesInvoice.aggregate({ _sum: { total: true } }),
      prisma.paymentVoucher.count(), prisma.paymentVoucher.aggregate({ _sum: { amount: true } }), // Assuming all vouchers are expenditures
      prisma.purchaseOrder.count(), prisma.purchaseOrder.aggregate({ _sum: { total: true } }),
      prisma.paymentReceipt.count(), prisma.paymentReceipt.aggregate({ _sum: { amount: true } }),
      prisma.salesInvoice.count({ where: { status: { not: "Paid" } } }), prisma.salesInvoice.aggregate({ where: { status: { not: "Paid" } }, _sum: { total: true } }),
      prisma.vendorInvoice.count({ where: { status: { not: "Paid" } } }), prisma.vendorInvoice.aggregate({ where: { status: { not: "Paid" } }, _sum: { total: true } }),
      // VENDORS
      prisma.vendorInvoice.count(), prisma.vendorInvoice.aggregate({ _sum: { total: true } }),
      prisma.purchaseOrder.count(), prisma.purchaseOrder.aggregate({ _sum: { total: true } }), // Reuse PO count/sum
      // TAXES
      prisma.salesInvoice.aggregate({ _sum: { tax: true } }),
      prisma.vendorInvoice.aggregate({ _sum: { tax: true } }),
      prisma.purchaseOrder.aggregate({ _sum: { tax: true } }), // Assuming this is WHT
      // General Counts
      prisma.user.count()
    ]);

    // --- Structure Data ---
    const baseData = {
      company: {
        revenues: { count: salesInvoiceCount, total: safeSum(salesInvoiceSum, 'total') },
        expenditures: { count: paymentVoucherCount, total: safeSum(paymentVoucherSum, 'amount') },
        orders: { count: purchaseOrderCount, total: safeSum(purchaseOrderSum, 'total') },
        moneyReceived: { count: paymentReceiptCount, total: safeSum(paymentReceiptSum, 'amount') },
        receivables: { count: unpaidSalesInvoiceCount, total: safeSum(unpaidSalesInvoiceSum, 'total') },
        payables: { count: unpaidVendorInvoiceCount, total: safeSum(unpaidVendorInvoiceSum, 'total') },
        // Simplified overall tax count/sum for company view
        taxes: { 
          count: salesInvoiceCount + vendorInvoiceCount + purchaseOrderCount, // Example count
          totalReceived: safeSum(salesInvoiceTaxSum, 'tax'),
          totalPaid: safeSum(vendorInvoiceTaxSum, 'tax') + safeSum(purchaseOrderTaxSum, 'tax')
        }
      },
      vendors: {
        invoices: { count: vendorInvoiceCount, total: safeSum(vendorInvoiceSum, 'total') },
        // Note: Assuming all payment vouchers are vendor payments for simplicity. Adjust if needed.
        payments: { count: paymentVoucherCount, total: safeSum(paymentVoucherSum, 'amount') }, 
        orders: { count: vendorPOCount, total: safeSum(vendorPOSum, 'total') },
        payables: { count: unpaidVendorInvoiceCount, total: safeSum(unpaidVendorInvoiceSum, 'total') },
        taxes: { 
          count: vendorInvoiceCount + purchaseOrderCount, // Example count
          total: safeSum(vendorInvoiceTaxSum, 'tax') + safeSum(purchaseOrderTaxSum, 'tax') 
        }
      },
      taxes: {
        received: { count: salesInvoiceCount, total: safeSum(salesInvoiceTaxSum, 'tax') }, // Taxes from customers
        given: { // Taxes to vendors/govt
          count: vendorInvoiceCount + purchaseOrderCount, 
          total: safeSum(vendorInvoiceTaxSum, 'tax') + safeSum(purchaseOrderTaxSum, 'tax') 
        },
        withholding: { count: purchaseOrderCount, total: safeSum(purchaseOrderTaxSum, 'tax') } // Assuming PO tax is WHT
      },
      // Keep general user count if needed elsewhere, though not in the main 3 sections
      userCount: userCount 
    };

    const filteredData = filterDashboardDataByRole(baseData, role);
    return NextResponse.json(filteredData);
  } catch (error) {
    console.error("Dashboard API Error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}

// --- Updated Filter Function ---
function filterDashboardDataByRole(data: any, role: string) {
  const clone = JSON.parse(JSON.stringify(data)); // Deep clone

  switch (role) {
    case "admin":
      return clone; // Admin sees all sections

    case "accountant":
      // Accountant sees all financial sections, maybe not user count
      // (Assuming userCount isn't displayed directly anymore)
      return clone; 

    case "project_manager":
      // PM might only see Company Orders, Vendor Orders/Invoices/Payables?
      // Example: Hide specific metrics or whole sections
      delete clone.company?.revenues;
      delete clone.company?.expenditures;
      delete clone.company?.moneyReceived;
      delete clone.company?.taxes;
      delete clone.taxes; // Hide entire taxes section
      return clone;

    case "viewer":
    default:
      // Viewer might only see high-level Company stats
      return { 
          company: { // Only return specific company metrics
              revenues: clone.company.revenues,
              expenditures: clone.company.expenditures,
              orders: clone.company.orders,
              moneyReceived: clone.company.moneyReceived,
          }
          // Optionally add specific vendor/tax metrics if needed
      };
  }
}
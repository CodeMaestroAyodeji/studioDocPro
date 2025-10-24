import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/utils"; // adjust path if needed
import { AppUser } from "@/lib/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as AppUser;
  const role = user?.role || "viewer";

  try {
    const [
      totalRevenue,
      totalExpenditure,
      totalTax,
      receivables,
      payables,
      overviewCounts,
      taxCompliance,
    ] = await Promise.all([
      prisma.salesInvoice.aggregate({ _sum: { total: true } }),
      prisma.paymentVoucher.aggregate({ _sum: { amount: true } }),
      prisma.salesInvoice.aggregate({ _sum: { tax: true } }),
      prisma.salesInvoice.count({ where: { status: { not: "Paid" } } }),
      prisma.vendorInvoice.count({ where: { status: { not: "Paid" } } }),
      Promise.all([
        prisma.client.count(),
        prisma.vendor.count(),
        prisma.purchaseOrder.count(),
        prisma.paymentVoucher.count(),
        prisma.paymentReceipt.count(),
        prisma.salesInvoice.count(),
        prisma.vendorInvoice.count(),
        prisma.user.count(),
      ]),
      Promise.all([
        prisma.purchaseOrder.aggregate({ _sum: { tax: true } }),
        prisma.vendorInvoice.aggregate({ _sum: { tax: true } }),
        prisma.salesInvoice.aggregate({ _sum: { tax: true } }),
      ]),
    ]);

    const [
      clients,
      vendors,
      purchaseOrders,
      paymentVouchers,
      paymentReceipts,
      salesInvoices,
      vendorInvoices,
      users,
    ] = overviewCounts;

    const [withholdingTaxPO, vendorTax, clientTax] = taxCompliance;

    const baseData = {
      revenue: totalRevenue._sum.total || 0,
      expenditure: totalExpenditure._sum.amount || 0,
      tax: totalTax._sum.tax || 0,
      receivables,
      payables,
      overview: {
        clients,
        vendors,
        purchaseOrders,
        paymentVouchers,
        paymentReceipts,
        salesInvoices,
        vendorInvoices,
        users,
      },
      taxCompliance: {
        withholdingTaxPO: withholdingTaxPO._sum.tax || 0,
        vendorTax: vendorTax._sum.tax || 0,
        clientTax: clientTax._sum.tax || 0,
      },
    };

    const filteredData = filterDashboardDataByRole(baseData, role);
    return NextResponse.json(filteredData);
  } catch (error) {
    console.error("Dashboard API Error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}

function filterDashboardDataByRole(data: any, role: string) {
  const clone = JSON.parse(JSON.stringify(data)); // ✅ safer for all environments

  switch (role) {
    case "admin":
      return clone;
    case "accountant":
      delete clone.overview.users;
      return clone;
    case "project_manager":
      delete clone.overview.users;
      return clone;
    case "viewer":
    default:
      return {
        revenue: clone.revenue,
        expenditure: clone.expenditure,
        receivables: clone.receivables,
        payables: clone.payables,
      };
  }
}

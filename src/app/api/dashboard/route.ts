import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import admin from "@/lib/firebase-admin";
import { headers } from "next/headers";
import { AppUser } from "@/lib/types";

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

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // --- End Auth Check ---

  const rawRole = (user?.role || "viewer") as string;
  const roleMap: Record<string, string> = {
    Admin: "admin",
    admin: "admin",
    Accountant: "accountant",
    accountant: "accountant",
    "Project Manager": "project_manager",
    project_manager: "project_manager",
    User: "viewer",
    user: "viewer",
    Viewer: "viewer",
    viewer: "viewer",
  };
  const role = roleMap[rawRole] || rawRole.toLowerCase();

  try {
    const [
      totalRevenue,
      totalExpenditure,
      totalMoneyReceived, // ✅ CHANGED from totalTax
      receivables,
      payables,
      overviewCounts,
      taxCompliance,
    ] = await Promise.all([
      prisma.salesInvoice.aggregate({ _sum: { total: true } }), // Total Billed
      prisma.paymentVoucher.aggregate({ _sum: { amount: true } }), // Total Paid Out
      prisma.paymentReceipt.aggregate({ _sum: { amount: true } }), // ✅ Total Cash Received
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
      totalMoneyReceived: totalMoneyReceived._sum.amount || 0, // ✅ CHANGED from tax
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
        clientTax: clientTax._sum.tax || 0, // Your sales tax is still here
      },
    };

    const filteredData = filterDashboardDataByRole(baseData, role);
    return NextResponse.json(filteredData);
  } catch (error) {
    console.error(
      "Dashboard API Error:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}

// This function is correct and remains unchanged
function filterDashboardDataByRole(data: any, role: string) {
  const clone = JSON.parse(JSON.stringify(data));

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
        // ✅ ADDED this so viewers can see it too
        totalMoneyReceived: clone.totalMoneyReceived, 
        receivables: clone.receivables,
        payables: clone.payables,
      };
  }
}

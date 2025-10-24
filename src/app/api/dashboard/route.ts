import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import admin from "@/lib/firebase-admin";
import { headers } from "next/headers";
import { AppUser } from "@/lib/types";
import { format } from "date-fns"; // Import date-fns

// Helper function to get dates for the last 30 days
function getLast30Days() {
  const dates = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(format(date, "MMM dd")); // Format as 'Oct 24'
  }
  return dates;
}

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

  // --- Start Date Range for Chart ---
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0); // Start of the day
  // --- End Date Range for Chart ---

  try {
    const [
      totalRevenue,
      totalExpenditure,
      totalOrders,
      totalMoneyReceived,
      receivables,
      payables,
      overviewCounts,
      taxCompliance,
      dailyIncome, // ✅ NEW: Daily income for chart
      dailyExpense, // ✅ NEW: Daily expense for chart
    ] = await Promise.all([
      prisma.salesInvoice.aggregate({ _sum: { total: true } }),
      prisma.paymentVoucher.aggregate({ _sum: { amount: true } }),
      prisma.purchaseOrder.aggregate({ _sum: { total: true } }),
      prisma.paymentReceipt.aggregate({ _sum: { amount: true } }),
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
      // ✅ NEW: Query for daily income
      prisma.paymentReceipt.groupBy({
        by: ["paymentDate"],
        _sum: { amount: true },
        where: { paymentDate: { gte: thirtyDaysAgo } },
      }),
      // ✅ NEW: Query for daily expense
      prisma.paymentVoucher.groupBy({
        by: ["paymentDate"],
        _sum: { amount: true },
        where: { paymentDate: { gte: thirtyDaysAgo } },
      }),
    ]);

    // --- Process Chart Data ---
    const dateLabels = getLast30Days();
    const incomeMap = new Map(
      dailyIncome.map((d) => [
        format(new Date(d.paymentDate), "MMM dd"),
        d._sum.amount || 0,
      ])
    );
    const expenseMap = new Map(
      dailyExpense.map((d) => [
        format(new Date(d.paymentDate), "MMM dd"),
        d._sum.amount || 0,
      ])
    );

    const dailyActivity = dateLabels.map((date) => ({
      date,
      Income: incomeMap.get(date) || 0,
      Expense: expenseMap.get(date) || 0,
    }));
    // --- End Process Chart Data ---

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
      totalOrders: totalOrders._sum.total || 0,
      totalMoneyReceived: totalMoneyReceived._sum.amount || 0,
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
      dailyActivity, // ✅ ADDED CHART DATA TO RESPONSE
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

// This function filters the data based on user role
function filterDashboardDataByRole(data: any, role: string) {
  const clone = JSON.parse(JSON.stringify(data));

  switch (role) {
    case "admin":
      return clone; // Admin sees everything
    case "accountant":
      delete clone.overview.users;
      return clone;
    case "project_manager":
      delete clone.overview.users;
      return clone;
    case "viewer":
    default:
      // Viewer sees only the high-level financial summary and cash flow
      return {
        revenue: clone.revenue,
        expenditure: clone.expenditure,
        totalOrders: clone.totalOrders,
        totalMoneyReceived: clone.totalMoneyReceived,
        receivables: clone.receivables,
        payables: clone.payables,
        dailyActivity: clone.dailyActivity, // ✅ Pass chart data to viewer
      };
  }
}
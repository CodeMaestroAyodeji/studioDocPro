
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import admin from "@/lib/firebase-admin";
import { headers } from "next/headers";

export async function GET() {
  const headersList = await headers();
  const authHeader = headersList.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const idToken = authHeader.split("Bearer ")[1];
  if (!idToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const salesInvoices = await prisma.salesInvoice.findMany({
      select: { createdAt: true, total: true },
    });

    const paymentVouchers = await prisma.paymentVoucher.findMany({
      select: { createdAt: true, amount: true },
    });

    const monthlyData: { [key: string]: { income: number; expenses: number } } = {};

    salesInvoices.forEach((invoice) => {
      const month = invoice.createdAt.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0 };
      }
      monthlyData[month].income += invoice.total;
    });

    paymentVouchers.forEach((voucher) => {
      const month = voucher.createdAt.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0 };
      }
      monthlyData[month].expenses += voucher.amount;
    });

    const formattedData = Object.keys(monthlyData).map((month) => ({
      name: month,
      income: monthlyData[month].income,
      expenses: monthlyData[month].expenses,
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Financial summary API error:", error);
    return NextResponse.json(
      { error: "Failed to load financial summary data" },
      { status: 500 }
    );
  }
}

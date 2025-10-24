"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { StatsCard } from "@/components/stats-card";
import {
  DollarSign, // Revenue
  Banknote, // Expenditure
  FileText, // Sales Invoices
  Users, // Users & Vendors
  ShoppingBag, // Purchase Orders
  Receipt, // Payment Vouchers
  ShieldCheck, // Tax
  HandCoins, // Payment Receipts
  FileClock, // Receivables (Unpaid)
  FileWarning, // Payables (Pending)
  FileSpreadsheet, // Vendor Invoices
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { firebaseUser } = useAuth();

  const fetchData = async () => {
    if (!firebaseUser) return;

    try {
      setError(null);
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`API request failed with status ${res.status}`);
      }

      const json = await res.json();
      
      if (json.error) {
        throw new Error(json.error);
      }
      
      setData(json);
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (firebaseUser) {
      fetchData();
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [firebaseUser]);

  const formatNaira = (value: any) =>
    `₦${typeof value === "number" ? value.toLocaleString("en-NG") : "0"}`;

  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <Header
          title="Dashboard Overview"
          description="Real-time business summary"
        />
        <main className="p-8 text-center text-muted-foreground">
          Loading dashboard data...
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-1 flex-col">
        <Header
          title="Dashboard Overview"
          description="Real-time business summary"
        />
        <main className="p-8 text-center text-destructive">
          <p>Failed to load dashboard data.</p>
          <p className="text-sm">{error}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header
        title="Dashboard Overview"
        description="Real-time business summary"
      />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-8">
        {/* Section 1: Financial Summary */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Financial Summary</h2>
          {/* ✅ UPDATED GRID TO 4 COLUMNS */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Revenue"
              value={formatNaira(data.revenue)}
              description="All sales invoices (Billed)"
              icon={DollarSign}
            />
            <StatsCard
              title="Total Expenditure"
              value={formatNaira(data.expenditure)}
              description="All payments (Paid Out)"
              icon={Banknote}
            />
            {data.totalOrders !== undefined && (
              <StatsCard
                title="Total Orders"
                value={formatNaira(data.totalOrders)}
                description="All purchase orders"
                icon={ShoppingBag}
              />
            )}
            {/* ✅ ADDED THIS CARD */}
            {data.totalMoneyReceived !== undefined && (
              <StatsCard
                title="Total Money Received"
                value={formatNaira(data.totalMoneyReceived)}
                description="From all payment receipts"
                icon={HandCoins}
              />
            )}
          </div>
        </section>

        {/* Section 2: Cash Flow Status */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Cash Flow Status</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.receivables !== undefined && (
              <StatsCard
                title="Receivables"
                value={data.receivables.toString()}
                description="Unpaid invoices"
                icon={FileClock}
              />
            )}
            {data.payables !== undefined && (
              <StatsCard
                title="Payables"
                value={data.payables.toString()}
                description="Pending vendor payments"
                icon={FileWarning}
              />
            )}
          </div>
        </section>

        {/* Section 3: General Overview */}
        {data.overview && (
          <section>
            <h2 className="text-xl font-semibold mb-4">General Overview</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {data.overview.purchaseOrders !== undefined && (
                <StatsCard
                  title="Purchase Orders"
                  value={data.overview.purchaseOrders.toString()}
                  description="All purchase orders"
                  icon={ShoppingBag}
                />
              )}
              {data.overview.paymentVouchers !== undefined && (
                <StatsCard
                  title="Payment Vouchers"
                  value={data.overview.paymentVouchers.toString()}
                  description="All payment vouchers"
                  icon={Receipt}
                />
              )}
              {data.overview.paymentReceipts !== undefined && (
                <StatsCard
                  title="Payment Receipts"
                  value={data.overview.paymentReceipts.toString()}
                  description="All payment receipts"
                  icon={HandCoins}
                />
              )}
              {data.overview.salesInvoices !== undefined && (
                <StatsCard
                  title="Sales Invoices"
                  value={data.overview.salesInvoices.toString()}
                  description="All sales invoices"
                  icon={FileText}
                />
              )}
              {data.overview.vendorInvoices !== undefined && (
                <StatsCard
                  title="Vendor Invoices"
                  value={data.overview.vendorInvoices.toString()}
                  description="All vendor invoices"
                  icon={FileSpreadsheet}
                />
              )}
              {data.overview.vendors !== undefined && (
                <StatsCard
                  title="Vendors"
                  value={data.overview.vendors.toString()}
                  description="All registered vendors"
                  icon={Users}
                />
              )}
              {data.overview.users !== undefined && (
                <StatsCard
                  title="Users"
                  value={data.overview.users.toString()}
                  description="Total registered users"
                  icon={Users}
                />
              )}
            </div>
          </section>
        )}

        {/* Section 4: Tax & Compliance */}
        {data.taxCompliance && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Tax & Compliance</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.taxCompliance.withholdingTaxPO !== undefined && (
                <StatsCard
                  title="WHT from Purchase Order"
                  value={formatNaira(data.taxCompliance.withholdingTaxPO)}
                  description="From purchase orders"
                  icon={ShoppingBag}
                />
              )}
              {data.taxCompliance.vendorTax !== undefined && (
                <StatsCard
                  title="Taxes given to Vendors"
                  value={formatNaira(data.taxCompliance.vendorTax)}
                  description="From vendor invoices"
                  icon={FileSpreadsheet}
                />
              )}
              {data.taxCompliance.clientTax !== undefined && (
                <StatsCard
                  title="Tax (Sales)"
                  value={formatNaira(data.taxCompliance.clientTax)}
                  description="Collected from sales invoices"
                  icon={ShieldCheck}
                />
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
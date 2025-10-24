"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { StatsCard } from "@/components/stats-card";
import { DollarSign, Banknote, FileText, Users, ShoppingBag, Receipt, ShieldCheck } from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading dashboard data...
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title="Dashboard Overview" description="Real-time business summary" />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-8">

        {/* Section 1: Financial Summary */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Financial Summary</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatsCard title="Total Revenue" value={`₦${typeof data.revenue === 'number' ? data.revenue.toLocaleString() : '0'}`} description="All sales invoices" />
            <StatsCard title="Total Expenditure" value={`₦${typeof data.expenditure === 'number' ? data.expenditure.toLocaleString() : '0'}`} description="All payments & vendor bills" />
            <StatsCard title="Tax (Sales)" value={`₦${typeof data.tax === 'number' ? data.tax.toLocaleString() : '0'}`} description="Total collected tax" />
          </div>
        </section>

        {/* Section 2: Cash Flow */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Cash Flow Status</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatsCard title="Receivables" value={data.receivables.toString()} description="Unpaid invoices" />
            <StatsCard title="Payables" value={data.payables.toString()} description="Pending vendor payments" />
          </div>
        </section>

        {/* Section 3: General Overview */}
        {data.overview && (
          <section>
            <h2 className="text-xl font-semibold mb-4">General Overview</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {data.overview.paymentVouchers !== undefined && <StatsCard title="Payment Vouchers" value={data.overview.paymentVouchers.toString()} description="All payment vouchers" />}
              {data.overview.paymentReceipts !== undefined && <StatsCard title="Payment Receipts" value={data.overview.paymentReceipts.toString()} description="All payment receipts" />}
              {data.overview.salesInvoices !== undefined && <StatsCard title="Sales Invoices" value={data.overview.salesInvoices.toString()} description="All sales invoices" />}
              {data.overview.vendorInvoices !== undefined && <StatsCard title="Vendor Invoices" value={data.overview.vendorInvoices.toString()} description="All vendor invoices" />}
              {data.overview.users !== undefined && <StatsCard title="Users" value={data.overview.users.toString()} description="Total registered users" />}
            </div>
          </section>
        )}

        {/* Section 4: Tax & Compliance */}
        {data.taxCompliance && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Tax & Compliance</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <StatsCard
                title="Total Withholding Taxes from Purchase Order"
                value={`₦${(data.taxCompliance.withholdingTaxPO || 0).toLocaleString()}`}
                description="From purchase orders"
              />
              <StatsCard
                title="Total Taxes given to Vendors"
                value={`₦${(data.taxCompliance.vendorTax || 0).toLocaleString()}`}
                description="Included in vendor invoices"
              />
              <StatsCard
                title="Total Taxes Collected from clients"
                value={`₦${(data.taxCompliance.clientTax || 0).toLocaleString()}`}
                description="Collected via sales invoices"
              />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

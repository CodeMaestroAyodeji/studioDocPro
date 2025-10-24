// @refresh reset
"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DocumentList } from "@/components/document-list";
import { StatsCard } from "@/components/stats-card";
import {
  ArrowDownRight,
  ArrowUpRight,
  FileText,
  LayoutGrid,
  PlusCircle,
  DollarSign,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

const DashboardPage = () => {
  const { firebaseUser } = useAuth();
  const [totalSales, setTotalSales] = useState(0);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const [netBalance, setNetBalance] = useState(0);
  const [financialSummary, setFinancialSummary] = useState([]);

  const documentListColumns = [
    { accessor: 'docType', header: 'Type' },
    { accessor: 'docId', header: 'Doc No.' },
    { accessor: 'date', header: 'Date' },
    { accessor: 'customerVendor', header: 'Customer/Vendor' },
    { 
      accessor: 'amount', 
      header: 'Amount', 
      cell: (amount: number) => formatCurrency(amount) 
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };

        const [dashboardRes, financialSummaryRes] = await Promise.all([
          fetch('/api/dashboard', { headers }),
          fetch('/api/dashboard/financial-summary', { headers }),
        ]);

        const dashboardData = await dashboardRes.json();
        setTotalSales(dashboardData.company.revenues.total);
        setTotalPurchases(dashboardData.company.orders.total);
        setTotalPayments(dashboardData.company.moneyReceived.total);
        setNetBalance(
          dashboardData.company.revenues.total -
            dashboardData.company.orders.total
        );

        const financialSummaryData = await financialSummaryRes.json();
        setFinancialSummary(financialSummaryData);
      }
    };

    fetchData();
  }, [firebaseUser]);

  const fetchRecentDocuments = async (docType: string) => {
    if (firebaseUser) {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/${docType}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      return data.map((doc: any) => ({ 
        ...doc, 
        docType: docType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        docId: doc.invoiceNumber || doc.poNumber || doc.voucherNumber || doc.receiptNumber,
        customerVendor: doc.client?.name || doc.vendor?.name,
        amount: doc.total || doc.amount,
      }));
    }
    return [];
  };


  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Sales"
          value={formatCurrency(totalSales)}
          icon={ArrowUpRight}
          description="Total amount from sales invoices"
        />
        <StatsCard
          title="Total Purchases"
          value={formatCurrency(totalPurchases)}
          icon={ArrowDownRight}
          description="Total amount from purchase orders"
        />
        <StatsCard
          title="Total Payments"
          value={formatCurrency(totalPayments)}
          icon={DollarSign}
          description="Total amount from payment receipts"
        />
        <StatsCard
          title="Net Balance"
          value={formatCurrency(netBalance)}
          icon={LayoutGrid}
          description="Sales minus Purchases"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={financialSummary}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatCurrency(value as number)} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Bar dataKey="income" fill="#8884d8" name="Income" />
                <Bar dataKey="expenses" fill="#82ca9d" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Link href="/sales-invoice/new">
              <Button className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Sales Invoice
              </Button>
            </Link>
            <Link href="/purchase-order/new">
              <Button className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Purchase Order
              </Button>
            </Link>
            <Link href="/payment-receipt/new">
              <Button className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Payment Receipt
              </Button>
            </Link>
            <Link href="/vendor-invoice/new">
              <Button className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Vendor Invoice
              </Button>
            </Link>
            <Link href="/payment-voucher/new">
              <Button className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Payment Voucher
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="purchases">Purchases</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <DocumentList 
                columns={documentListColumns} 
                dataFetcher={() => Promise.all([
                  fetchRecentDocuments('sales-invoices'), 
                  fetchRecentDocuments('purchase-orders'), 
                  fetchRecentDocuments('payment-receipts'),
                  fetchRecentDocuments('payment-vouchers'),
                  fetchRecentDocuments('vendor-invoices'),
                ]).then(results => results.flat())} 
                searchFields={['docType', 'docId', 'customerVendor']} 
                storageKeyPrefix="dashboard-all" 
                viewUrlPrefix="/" 
                itemKey={(doc: any) => `${doc.docType}-${doc.id}`}
              />
            </TabsContent>
            <TabsContent value="sales">
              <DocumentList
                columns={documentListColumns}
                dataFetcher={() => fetchRecentDocuments('sales-invoices')}
                searchFields={['docType', 'docId', 'customerVendor']}
                storageKeyPrefix="dashboard-sales"
                viewUrlPrefix="/sales-invoice/"
              />
            </TabsContent>
            <TabsContent value="purchases">
              <DocumentList
                columns={documentListColumns}
                dataFetcher={() => fetchRecentDocuments('purchase-orders')}
                searchFields={['docType', 'docId', 'customerVendor']}
                storageKeyPrefix="dashboard-purchases"
                viewUrlPrefix="/purchase-order/"
              />
            </TabsContent>
            <TabsContent value="payments">
              <DocumentList
                columns={documentListColumns}
                dataFetcher={() => Promise.all([
                  fetchRecentDocuments('payment-receipts'),
                  fetchRecentDocuments('payment-vouchers'),
                ]).then(results => results.flat())}
                searchFields={['docType', 'docId', 'customerVendor']}
                storageKeyPrefix="dashboard-payments"
                viewUrlPrefix="/"
                itemKey={(doc: any) => `${doc.docType}-${doc.id}`}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;

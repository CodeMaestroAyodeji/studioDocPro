import { Header } from "@/components/header";
import { StatsCard } from "@/components/stats-card";
import {
  ArrowRight,
  Newspaper,
  Receipt,
  ReceiptText,
  HandCoins,
  Users,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS } from "@/lib/roles";
import { getCurrentUserRole } from "@/lib/auth-utils";

// Quick links with permissions
const allLinks = [
  {
    href: "/purchase-order/new",
    label: "New Purchase Order",
    icon: Newspaper,
    permission: PERMISSIONS.PURCHASE_ORDER_CREATE,
  },
  {
    href: "/payment-voucher/new",
    label: "New Payment Voucher",
    icon: Receipt,
    permission: PERMISSIONS.PAYMENT_VOUCHER_CREATE,
  },
  {
    href: "/sales-invoice/new",
    label: "New Sales Invoice",
    icon: ReceiptText,
    permission: PERMISSIONS.SALES_INVOICE_CREATE,
  },
  {
    href: "/payment-receipt/new",
    label: "New Payment Receipt",
    icon: HandCoins,
    permission: PERMISSIONS.PAYMENT_RECEIPT_CREATE,
  },
  {
    href: "/vendors/new",
    label: "New Vendor",
    icon: Users,
    permission: PERMISSIONS.VENDOR_CREATE,
  },
  {
    href: "/users",
    label: "User Management",
    icon: UserCog,
    permission: PERMISSIONS.USER_VIEW,
  },
];

export default async function DashboardPage() {
  const userRole =
    ((await getCurrentUserRole()) as keyof typeof ROLES) || "USER";

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];

  // Helper to check if role can view a module
  const canView = (permission: string) => rolePermissions.includes(permission);

  const [
    invoiceCount,
    voucherCount,
    poCount,
    vendorCount,
    invoicesThisMonth,
    vouchersThisMonth,
    posThisMonth,
    vendorsThisMonth,
  ] = await Promise.all([
    canView(PERMISSIONS.SALES_INVOICE_VIEW) ? prisma.salesInvoice.count() : 0,
    canView(PERMISSIONS.PAYMENT_VOUCHER_VIEW)
      ? prisma.paymentVoucher.count()
      : 0,
    canView(PERMISSIONS.PURCHASE_ORDER_VIEW) ? prisma.purchaseOrder.count() : 0,
    canView(PERMISSIONS.VENDOR_VIEW) ? prisma.vendor.count() : 0,
    canView(PERMISSIONS.SALES_INVOICE_VIEW)
      ? prisma.salesInvoice.count({
          where: { createdAt: { gte: thirtyDaysAgo } },
        })
      : 0,
    canView(PERMISSIONS.PAYMENT_VOUCHER_VIEW)
      ? prisma.paymentVoucher.count({
          where: { createdAt: { gte: thirtyDaysAgo } },
        })
      : 0,
    canView(PERMISSIONS.PURCHASE_ORDER_VIEW)
      ? prisma.purchaseOrder.count({
          where: { createdAt: { gte: thirtyDaysAgo } },
        })
      : 0,
    canView(PERMISSIONS.VENDOR_VIEW)
      ? prisma.vendor.count({ where: { createdAt: { gte: thirtyDaysAgo } } })
      : 0,
  ]);

  // Filter links
  const quickLinks = allLinks.filter((link) => canView(link.permission));

  return (
    <div className="flex flex-1 flex-col">
      <Header
        title={`Welcome!`}
        description={`You are logged in as ${userRole}.`}
      />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-8">
        <section>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {canView(PERMISSIONS.SALES_INVOICE_VIEW) && (
              <StatsCard
                title="Sales Invoices"
                value={invoiceCount.toString()}
                description={`+${invoicesThisMonth} this month`}
              />
            )}
            {canView(PERMISSIONS.PAYMENT_VOUCHER_VIEW) && (
              <StatsCard
                title="Payment Vouchers"
                value={voucherCount.toString()}
                description={`+${vouchersThisMonth} this month`}
              />
            )}
            {canView(PERMISSIONS.PURCHASE_ORDER_VIEW) && (
              <StatsCard
                title="Purchase Orders"
                value={poCount.toString()}
                description={`+${posThisMonth} this month`}
              />
            )}
            {canView(PERMISSIONS.VENDOR_VIEW) && (
              <StatsCard
                title="Vendors"
                value={vendorCount.toString()}
                description={`+${vendorsThisMonth} this month`}
              />
            )}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((link) => (
              <Link
                href={link.href}
                key={link.href}
                className="block p-4 bg-card rounded-lg shadow-sm hover:bg-muted transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <link.icon className="h-6 w-6 text-primary" />
                    </div>
                    <p className="font-semibold">{link.label}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="p-8 bg-card rounded-lg shadow-sm text-center">
            <p className="text-muted-foreground">
              Recent activity will be shown here.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

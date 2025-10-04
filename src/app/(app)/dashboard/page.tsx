import { Header } from '@/components/header';
import { StatsCard } from '@/components/stats-card';
import { ArrowRight, Newspaper, Receipt, ReceiptText, HandCoins, Users, UserCog } from 'lucide-react';
import Link from 'next/link';
import db from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const allLinks = [
    { href: '/purchase-order/new', label: 'New Purchase Order', icon: Newspaper },
    { href: '/payment-voucher/new', label: 'New Payment Voucher', icon: Receipt },
    { href: '/sales-invoice/new', label: 'New Sales Invoice', icon: ReceiptText },
    { href: '/payment-receipt/new', label: 'New Payment Receipt', icon: HandCoins },
    { href: '/vendors/new', label: 'New Vendor', icon: Users },
    { href: '/users', label: 'User Management', icon: UserCog },
];

export default async function DashboardPage() {
    const today = new Date();
    const thirtyDaysAgo = new Date(new Date().setDate(today.getDate() - 30));

    const [
        invoiceCount,
        voucherCount,
        poCount,
        vendorCount,
        invoicesThisMonth,
        vouchersThisMonth,
        posThisMonth,
        vendorsThisMonth
    ] = await Promise.all([
        db.salesInvoice.count(),
        db.paymentVoucher.count(),
        db.purchaseOrder.count(),
        db.vendor.count(),
        db.salesInvoice.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        db.paymentVoucher.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        db.purchaseOrder.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        db.vendor.count({ where: { createdAt: { gte: thirtyDaysAgo } } })
    ]);

    const quickLinks = allLinks;

    return (
        <div className="flex flex-1 flex-col">
            {/* The user's name can be added back once server-side auth is implemented */}
            <Header title={`Welcome!`} />
            <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-8">
                <section>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatsCard title="Sales Invoices" value={invoiceCount.toString()} description={`+${invoicesThisMonth} this month`} />
                        <StatsCard title="Payment Vouchers" value={voucherCount.toString()} description={`+${vouchersThisMonth} this month`} />
                        <StatsCard title="Purchase Orders" value={poCount.toString()} description={`+${posThisMonth} this month`} />
                        <StatsCard title="Vendors" value={vendorCount.toString()} description={`+${vendorsThisMonth} this month`} />
                    </div>
                </section>
                
                <section>
                    <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {quickLinks.map(link => (
                            <Link href={link.href} key={link.href} className="block p-4 bg-card rounded-lg shadow-sm hover:bg-muted transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className='flex items-center gap-4'>
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
                        <p className="text-muted-foreground">Recent activity will be shown here.</p>
                     </div>
                </section>

            </main>
        </div>
    );
}

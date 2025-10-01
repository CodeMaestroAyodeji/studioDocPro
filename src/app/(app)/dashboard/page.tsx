
'use client';

import { Header } from '@/components/header';
import { StatsCard } from '@/components/stats-card';
import { useAuth } from '@/contexts/auth-context';
import { ArrowRight, FileText, HandCoins, Newspaper, Receipt, ReceiptText, Users } from 'lucide-react';
import Link from 'next/link';

const quickLinks = [
    { href: '/purchase-order/new', label: 'New Purchase Order', icon: Newspaper },
    { href: '/payment-voucher/new', label: 'New Payment Voucher', icon: Receipt },
    { href: '/sales-invoice/new', label: 'New Sales Invoice', icon: ReceiptText },
    { href: '/payment-receipt/new', label: 'New Payment Receipt', icon: HandCoins },
    { href: '/vendors/new', label: 'New Vendor', icon: Users },
];

export default function DashboardPage() {
    const { user } = useAuth();
    
    return (
        <div className="flex flex-1 flex-col">
            <Header title={`Welcome, ${user?.displayName || 'User'}!`} />
            <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-8">
                <section>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatsCard title="Sales Invoices" value="12" description="+2 this month" />
                        <StatsCard title="Payment Vouchers" value="32" description="+5 this month" />
                        <StatsCard title="Purchase Orders" value="21" description="3 pending approval" />
                        <StatsCard title="Vendors" value="8" description="+1 new vendor" />
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

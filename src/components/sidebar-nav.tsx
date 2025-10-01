
'use client';

import { usePathname } from 'next/navigation';
import { Building2, Newspaper, Receipt, ReceiptText, HandCoins, Users, LayoutDashboard, UserCog } from 'lucide-react';
import Link from 'next/link';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

const allLinks = [
    {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/purchase-order',
    label: 'Purchase Orders',
    icon: Newspaper,
  },
  {
    href: '/payment-voucher',
    label: 'Payment Vouchers',
    icon: Receipt,
  },
  {
    href: '/sales-invoice',
    label: 'Sales Invoices',
    icon: ReceiptText,
  },
  {
    href: '/payment-receipt',
    label: 'Payment Receipts',
    icon: HandCoins,
  },
  {
    href: '/vendors',
    label: 'Vendors',
    icon: Users,
  },
  {
    href: '/vendor-invoice',
    label: 'Vendor Invoices',
    icon: ReceiptText,
  },
  {
    href: '/profile/view',
    label: 'Company Profile',
    icon: Building2,
  },
   {
    href: '/users',
    label: 'User Management',
    icon: UserCog,
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  
  const links = allLinks;

  return (
    <SidebarMenu>
      {links.map((link) => (
        <SidebarMenuItem key={link.href}>
          <Link href={link.href} passHref>
            <SidebarMenuButton
              isActive={pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))}
              tooltip={link.label}
              asChild
            >
              <div>
                <link.icon />
                <span>{link.label}</span>
              </div>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}


'use client';

import { usePathname } from 'next/navigation';
import { Building2, Newspaper, Receipt, ReceiptText, HandCoins, Users } from 'lucide-react';
import Link from 'next/link';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

const links = [
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
    href: '/profile',
    label: 'Company Profile',
    icon: Building2,
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {links.map((link) => (
        <SidebarMenuItem key={link.href}>
          <Link href={link.href} passHref>
            <SidebarMenuButton
              isActive={pathname.startsWith(link.href)}
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

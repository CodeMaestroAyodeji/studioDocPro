
'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Building2, Newspaper, Receipt, ReceiptText, HandCoins, Users, LayoutDashboard, UserCog } from 'lucide-react';
import Link from 'next/link';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { usePermission } from '@/hooks/use-permission';
import { PERMISSIONS } from '@/lib/roles';

const allLinks = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    permission: '', // No specific permission needed for dashboard
  },
  {
    href: '/purchase-order',
    label: 'Purchase Orders',
    icon: Newspaper,
    permission: PERMISSIONS.PURCHASE_ORDER_VIEW,
  },
  {
    href: '/payment-voucher',
    label: 'Payment Vouchers',
    icon: Receipt,
    permission: PERMISSIONS.PAYMENT_VOUCHER_VIEW,
  },
  {
    href: '/sales-invoice',
    label: 'Sales Invoices',
    icon: ReceiptText,
    permission: PERMISSIONS.SALES_INVOICE_VIEW,
  },
  {
    href: '/payment-receipt',
    label: 'Payment Receipts',
    icon: HandCoins,
    permission: PERMISSIONS.PAYMENT_RECEIPT_VIEW,
  },
  {
    href: '/vendors',
    label: 'Vendors',
    icon: Users,
    permission: PERMISSIONS.VENDOR_VIEW,
  },
  {
    href: '/vendor-invoice',
    label: 'Vendor Invoices',
    icon: ReceiptText,
    permission: PERMISSIONS.VENDOR_INVOICE_VIEW,
  },
  {
    href: '/profile/view',
    label: 'Company Profile',
    icon: Building2,
    permission: PERMISSIONS.COMPANY_PROFILE_VIEW,
  },
  {
    href: '/users',
    label: 'User Management',
    icon: UserCog,
    permission: PERMISSIONS.USER_VIEW,
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { hasPermission } = usePermission();

  const links = useMemo(() => {
    return allLinks.filter(link => !link.permission || hasPermission(link.permission));
  }, [hasPermission]);

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

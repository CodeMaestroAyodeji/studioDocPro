'use client';

import { usePathname } from 'next/navigation';
import { Building2, Newspaper, Receipt } from 'lucide-react';
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
          <Link href={link.href} passHref legacyBehavior>
            <SidebarMenuButton
              isActive={pathname.startsWith(link.href)}
              tooltip={link.label}
            >
              <link.icon />
              <span>{link.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

export const salesInvoiceColumns = [
  { accessor: 'invoiceNumber', header: 'Invoice #' },
  {
    accessor: 'client.name',
    header: 'Client',
  },
  {
    accessor: 'issueDate',
    header: 'Date',
    cell: (value: string) => format(new Date(value), 'dd/MM/yyyy'),
  },
  {
    accessor: 'total',
    header: 'Total (NGN)',
    cell: (value: number) => formatCurrency(value),
  },
];

export const purchaseOrderColumns = [
  { accessor: 'poNumber', header: 'PO #' },
  {
    accessor: 'vendor.name',
    header: 'Vendor',
  },
  {
    accessor: 'orderDate',
    header: 'Date',
    cell: (value: string) => format(new Date(value), 'dd/MM/yyyy'),
  },
  { 
    accessor: 'total', 
    header: 'Amount',
    cell: (value: number) => formatCurrency(value),
  },
];

export const vendorInvoiceColumns = [
  { accessor: 'invoiceNumber', header: 'Invoice #' },
  { 
    accessor: 'vendor.name', 
    header: 'Vendor',
  },
  { 
    accessor: 'invoiceDate', 
    header: 'Date',
    cell: (value: string) => format(new Date(value), 'dd/MM/yyyy'),
  },
  { 
    accessor: 'total', 
    header: 'Amount',
    cell: (value: number) => formatCurrency(value),
  },
];

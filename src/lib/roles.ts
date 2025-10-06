// src/lib/roles.ts

export const ROLES = {
  ADMIN: 'Admin',
  PROJECT_MANAGER: 'Project Manager',
  ACCOUNTANT: 'Accountant',
  USER: 'User',
};

// Group permissions by modules
export const PERMISSIONS = {
  // Purchase Order
  PURCHASE_ORDER_VIEW: 'purchase_order:view',
  PURCHASE_ORDER_CREATE: 'purchase_order:create',
  PURCHASE_ORDER_EDIT: 'purchase_order:edit',
  PURCHASE_ORDER_DELETE: 'purchase_order:delete',

  // Vendors
  VENDOR_VIEW: 'vendor:view',
  VENDOR_CREATE: 'vendor:create',
  VENDOR_EDIT: 'vendor:edit',
  VENDOR_DELETE: 'vendor:delete',

  // Vendor Invoices
  VENDOR_INVOICE_VIEW: 'vendor_invoice:view',
  VENDOR_INVOICE_CREATE: 'vendor_invoice:create',
  VENDOR_INVOICE_EDIT: 'vendor_invoice:edit',
  VENDOR_INVOICE_DELETE: 'vendor_invoice:delete',

  // Payment Vouchers
  PAYMENT_VOUCHER_VIEW: 'payment_voucher:view',
  PAYMENT_VOUCHER_CREATE: 'payment_voucher:create',
  PAYMENT_VOUCHER_EDIT: 'payment_voucher:edit',
  PAYMENT_VOUCHER_DELETE: 'payment_voucher:delete',

  // Sales Invoices
  SALES_INVOICE_VIEW: 'sales_invoice:view',
  SALES_INVOICE_CREATE: 'sales_invoice:create',
  SALES_INVOICE_EDIT: 'sales_invoice:edit',
  SALES_INVOICE_DELETE: 'sales_invoice:delete',

  // Payment Receipts
  PAYMENT_RECEIPT_VIEW: 'payment_receipt:view',
  PAYMENT_RECEIPT_CREATE: 'payment_receipt:create',
  PAYMENT_RECEIPT_EDIT: 'payment_receipt:edit',
  PAYMENT_RECEIPT_DELETE: 'payment_receipt:delete',

  // Users
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_EDIT: 'user:edit',
  USER_DELETE: 'user:delete',
};

// Create reusable permission groups
const PURCHASE_ORDER_PERMS = [
  PERMISSIONS.PURCHASE_ORDER_VIEW,
  PERMISSIONS.PURCHASE_ORDER_CREATE,
  PERMISSIONS.PURCHASE_ORDER_EDIT,
  PERMISSIONS.PURCHASE_ORDER_DELETE,
];

const VENDOR_PERMS = [
  PERMISSIONS.VENDOR_VIEW,
  PERMISSIONS.VENDOR_CREATE,
  PERMISSIONS.VENDOR_EDIT,
  PERMISSIONS.VENDOR_DELETE,
];

const VENDOR_INVOICE_PERMS = [
  PERMISSIONS.VENDOR_INVOICE_VIEW,
  PERMISSIONS.VENDOR_INVOICE_CREATE,
  PERMISSIONS.VENDOR_INVOICE_EDIT,
  PERMISSIONS.VENDOR_INVOICE_DELETE,
];

const PAYMENT_VOUCHER_PERMS = [
  PERMISSIONS.PAYMENT_VOUCHER_VIEW,
  PERMISSIONS.PAYMENT_VOUCHER_CREATE,
  PERMISSIONS.PAYMENT_VOUCHER_EDIT,
  PERMISSIONS.PAYMENT_VOUCHER_DELETE,
];

const SALES_INVOICE_PERMS = [
  PERMISSIONS.SALES_INVOICE_VIEW,
  PERMISSIONS.SALES_INVOICE_CREATE,
  PERMISSIONS.SALES_INVOICE_EDIT,
  PERMISSIONS.SALES_INVOICE_DELETE,
];

const PAYMENT_RECEIPT_PERMS = [
  PERMISSIONS.PAYMENT_RECEIPT_VIEW,
  PERMISSIONS.PAYMENT_RECEIPT_CREATE,
  PERMISSIONS.PAYMENT_RECEIPT_EDIT,
  PERMISSIONS.PAYMENT_RECEIPT_DELETE,
];

// Map roles to permissions
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS), // Full access
  [ROLES.PROJECT_MANAGER]: [
    ...PURCHASE_ORDER_PERMS,
    ...VENDOR_PERMS,
    ...VENDOR_INVOICE_PERMS,
    ...PAYMENT_VOUCHER_PERMS,
  ],
  [ROLES.USER]: [
    ...PAYMENT_VOUCHER_PERMS,
  ],
  [ROLES.ACCOUNTANT]: [
    ...PURCHASE_ORDER_PERMS,
    ...VENDOR_PERMS,
    ...VENDOR_INVOICE_PERMS,
    ...SALES_INVOICE_PERMS,
    ...PAYMENT_RECEIPT_PERMS,
    ...PAYMENT_VOUCHER_PERMS,
  ],
};

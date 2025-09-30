export type Signatory = {
  id: string;
  name: string;
  title: string;
};

export type BankAccount = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
};

export type CompanyProfile = {
  name: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  logoUrl: string;
  signatories: Signatory[];
  bankAccounts: BankAccount[];
};

export type PurchaseOrderItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  applyTax: boolean;
};

export type PurchaseOrder = {
    poNumber: string;
    date: Date;
    vendor: string;
    projectName: string;
    items: PurchaseOrderItem[];
    signatory1?: string;
    signatory2?: string;
}

export type PaymentVoucher = {
  voucherNumber: string;
  payeeName: string;
  date: Date;
  amount: number;
  paymentMethod: string;
  bankAccountId: string;
  description: string;
  preparedBy: string;
  approvedBy: string;
  payeeBankName?: string;
  payeeAccountName?: string;
  payeeAccountNumber?: string;
};

export type SalesInvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export type SalesInvoice = {
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  billTo: string;
  items: SalesInvoiceItem[];
  notes: string;
  applyVat: boolean;
  paymentAccountId: string;
};

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
  tax: number;
};

export type PaymentVoucher = {
  payeeName: string;
  date: Date;
  amount: number;
  paymentMethod: string;
  bankAccountId: string;
};

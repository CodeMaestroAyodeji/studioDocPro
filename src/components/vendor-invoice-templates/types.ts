
import type { Vendor, VendorInvoice, CompanyProfile, VendorInvoiceItem } from '@/lib/types';
import type { UseFormReturn, Control, FieldArrayWithId } from 'react-hook-form';

export type TemplateProps = {
  vendor: Vendor;
  invoice: VendorInvoice;
  companyProfile: CompanyProfile;
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  isEditing?: boolean;
  form?: UseFormReturn<any>;
};

export type EditableTemplateFieldsProps = {
    form: UseFormReturn<any>;
    formatCurrency: (amount: number) => string;
}

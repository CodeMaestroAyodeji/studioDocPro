import type { Vendor, VendorInvoice, CompanyProfile } from '@/lib/types';
import { format } from 'date-fns';
import Image from 'next/image';
import { numberToWords } from '@/lib/number-to-words';
import { Separator } from '../ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '../ui/table';
import { generateAvatar } from '@/lib/vendor-utils';
import type { TemplateProps } from './types';
import { EditableTemplateFields } from './editable-template-fields';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
};

export function InvoiceTemplate1({ vendor, invoice, companyProfile, subtotal, totalDiscount, totalTax, grandTotal, isEditing = false, form }: TemplateProps) {
  const amountInWords = numberToWords(grandTotal);
  const bankAccount = vendor.bankAccounts && vendor.bankAccounts[0];
  const TAX_RATE = 7.5;

  return (
    <div className="text-sm">
        <header className="grid grid-cols-2 gap-8 mb-12">
            <div>
                <Image
                src={vendor.logoUrl || generateAvatar(vendor.name)}
                alt={`${vendor.name} logo`}
                width={120}
                height={50}
                className="rounded-md object-contain mb-4"
                />
                <h1 className="font-bold text-lg">{vendor.name}</h1>
                <p className="text-muted-foreground whitespace-pre-wrap">{vendor.address}</p>
            </div>
            <div className="text-right">
                <h2 className="text-2xl font-bold text-primary mb-4">INVOICE</h2>
                <div className="space-y-1 text-muted-foreground">
                    <p><strong>Invoice #:</strong> {invoice.invoiceNumber}</p>
                    <p><strong>Date:</strong> {format(new Date(invoice.invoiceDate), 'dd MMMM, yyyy')}</p>
                    <p><strong>Due:</strong> {format(new Date(invoice.dueDate), 'dd MMMM, yyyy')}</p>
                </div>
            </div>
        </header>

        <section className="grid grid-cols-2 gap-8 mb-12">
            <div>
                <p className="text-muted-foreground font-semibold">BILLED TO:</p>
                <p className="font-bold">{companyProfile.name}</p>
                <p className="whitespace-pre-wrap">{companyProfile.address}</p>
            </div>
             <div className="text-right">
                {vendor.tin && <p><span className="text-muted-foreground">Vendor TIN:</span> {vendor.tin}</p>}
                <p><span className="text-muted-foreground">Project:</span> {invoice.projectName}</p>
             </div>
        </section>

        <section className="mb-8">
            {isEditing && form ? <EditableTemplateFields form={form} formatCurrency={formatCurrency} /> : (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Item Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoice.lineItems.map(item => {
                        const rate = item.tax ? item.unitPrice / (1 + TAX_RATE / 100) : item.unitPrice;
                        const amount = item.quantity * rate;
                        return (
                            <TableRow key={item.id}>
                                <TableCell>{item.description}</TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
                                <TableCell className="text-right">{formatCurrency(rate)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(amount)}</TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
                </Table>
            )}
        </section>

        <section className="grid grid-cols-2 gap-8 mb-12">
            <div className="space-y-2">
                <p className="font-semibold">Amount in Words</p>
                <p className="text-muted-foreground capitalize">{amountInWords}</p>
                 {invoice.notes && (
                    <div className="pt-4">
                        <p className="font-semibold">Notes</p>
                        <p className="text-muted-foreground">{invoice.notes}</p>
                    </div>
                )}
            </div>
            <div className="space-y-2 text-right">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                {totalDiscount > 0 && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Discount:</span>
                        <span className="font-semibold">{formatCurrency(totalDiscount)}</span>
                    </div>
                )}
                {totalTax > 0 && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">VAT (7.5%):</span>
                        <span className="font-semibold">{formatCurrency(totalTax)}</span>
                    </div>
                )}
                <Separator />
                 <div className="flex justify-between font-bold text-lg text-primary">
                    <span>Total:</span>
                    <span>{formatCurrency(grandTotal)}</span>
                </div>
            </div>
        </section>

        <footer className="text-center text-xs">
            <p className="font-semibold">Payment Details</p>
            {bankAccount ? (
                <p className="text-muted-foreground">
                    Bank: {bankAccount.bankName} | Account: {bankAccount.accountNumber} ({bankAccount.accountName})
                </p>
            ) : (
                <p className="text-muted-foreground">No bank details provided.</p>
            )}
        </footer>
    </div>
  );
}
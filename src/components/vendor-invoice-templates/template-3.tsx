
import type { Vendor, VendorInvoice, CompanyProfile } from '@/lib/types';
import { format } from 'date-fns';
import Image from 'next/image';
import { numberToWords } from '@/lib/number-to-words';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { generateAvatar } from '@/lib/vendor-utils';
import type { TemplateProps } from './types';
import { EditableTemplateFields } from './editable-template-fields';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
};

export function InvoiceTemplate3({ vendor, invoice, companyProfile, subtotal, totalDiscount, totalTax, grandTotal, isEditing = false, form }: TemplateProps) {
  const amountInWords = numberToWords(grandTotal);

  return (
    <div className="text-sm relative">
        <div className="absolute top-0 right-0 h-full w-1/3 bg-primary/10 -z-10"></div>
        <header className="flex justify-between items-center mb-16">
            <div>
                 <Image
                    src={vendor.logoUrl || generateAvatar(vendor.companyName)}
                    alt={`${vendor.companyName} logo`}
                    width={80}
                    height={80}
                    className="rounded-full object-cover mb-4"
                />
                <h1 className="font-bold text-2xl">{vendor.companyName}</h1>
                <p className="text-muted-foreground whitespace-pre-wrap">{vendor.address}</p>
            </div>
            <div className="text-right">
                <h2 className="text-4xl font-bold text-primary mb-2">INVOICE</h2>
                <p className="text-muted-foreground">{invoice.invoiceNumber}</p>
            </div>
        </header>

        <section className="grid grid-cols-2 gap-8 mb-12">
            <div>
                <p className="text-muted-foreground font-semibold">BILLED TO</p>
                <p className="font-bold">{companyProfile.name}</p>
                <p>{companyProfile.address}</p>
            </div>
            <div className="text-right pr-8">
                 <p className="text-muted-foreground">Invoice Date: {format(invoice.invoiceDate, 'dd MMM yyyy')}</p>
                 <p className="text-muted-foreground">Due Date: {format(invoice.dueDate, 'dd MMM yyyy')}</p>
                 <p className="text-muted-foreground mt-2">Project: {invoice.projectName}</p>
            </div>
        </section>

        <section className="mb-8 pr-8">
             {isEditing && form ? <EditableTemplateFields form={form} formatCurrency={formatCurrency} /> : (
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[50%]">Description</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoice.items.map(item => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.rate)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.quantity * item.rate)}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </section>

        <section className="grid grid-cols-2 gap-8 mb-12">
            <div>
                <p className="font-semibold text-primary">Thank you for your business.</p>
            </div>
            <div className="space-y-2 pr-8">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                {totalDiscount > 0 && <div className="flex justify-between text-muted-foreground"><span>Discount</span><span>- {formatCurrency(totalDiscount)}</span></div>}
                {totalTax > 0 && <div className="flex justify-between text-muted-foreground"><span>VAT (7.5%)</span><span>{formatCurrency(totalTax)}</span></div>}
                <div className="border-t border-primary pt-2 mt-2 flex justify-between font-bold text-lg text-primary"><span>Total Due</span><span>{formatCurrency(grandTotal)}</span></div>
            </div>
        </section>

        <footer className="border-t pt-4 text-xs text-center pr-8">
            <p className="font-semibold">PAYMENT DETAILS</p>
            <p className="text-muted-foreground">
                {vendor.bankName} &middot; {vendor.accountName} &middot; {vendor.accountNumber}
            </p>
             {invoice.notes && (
                <p className="mt-4 text-muted-foreground">Note: {invoice.notes}</p>
            )}
        </footer>
    </div>
  );
}

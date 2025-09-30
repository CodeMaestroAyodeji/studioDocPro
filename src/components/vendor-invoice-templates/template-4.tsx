
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

export function InvoiceTemplate4({ vendor, invoice, companyProfile, subtotal, totalDiscount, totalTax, grandTotal, isEditing = false, form }: TemplateProps) {
  const amountInWords = numberToWords(grandTotal);

  return (
    <div className="text-sm">
        <header className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary tracking-widest">INVOICE</h2>
            <div className="mt-4">
                <Image
                    src={vendor.logoUrl || generateAvatar(vendor.companyName)}
                    alt={`${vendor.companyName} logo`}
                    width={80}
                    height={80}
                    className="rounded-md object-contain mb-2 mx-auto"
                />
                <h1 className="font-bold text-lg">{vendor.companyName}</h1>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{vendor.address}</p>
            </div>
        </header>

        <section className="border-y py-4 mb-8">
            <div className="grid grid-cols-4 gap-4">
                <div>
                    <p className="font-semibold text-muted-foreground">BILLED TO</p>
                    <p>{companyProfile.name}</p>
                </div>
                 <div>
                    <p className="font-semibold text-muted-foreground">PROJECT</p>
                    <p>{invoice.projectName}</p>
                </div>
                 <div>
                    <p className="font-semibold text-muted-foreground">INVOICE #</p>
                    <p>{invoice.invoiceNumber}</p>
                </div>
                <div>
                    <p className="font-semibold text-muted-foreground">DATE</p>
                    <p>{format(invoice.invoiceDate, 'dd/MM/yyyy')}</p>
                </div>
            </div>
        </section>

        <section className="mb-8">
             {isEditing ? <EditableTemplateFields form={form} formatCurrency={formatCurrency} /> : (
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>DESCRIPTION</TableHead>
                        <TableHead className="text-center">QTY</TableHead>
                        <TableHead className="text-right">RATE</TableHead>
                        <TableHead className="text-right">AMOUNT</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoice.items.map(item => (
                        <TableRow key={item.id}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.rate)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.quantity * item.rate)}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </section>

        <section className="flex justify-end mb-8">
            <div className="w-full md:w-2/5 space-y-2">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                {totalDiscount > 0 && <div className="flex justify-between"><span>Discount</span><span>- {formatCurrency(totalDiscount)}</span></div>}
                {totalTax > 0 && <div className="flex justify-between"><span>VAT (7.5%)</span><span>{formatCurrency(totalTax)}</span></div>}
            </div>
        </section>
        <div className="flex justify-end mb-8">
             <div className="w-full md:w-2/5 bg-primary/10 p-4 rounded-md flex justify-between font-bold text-primary">
                <span>Total Due</span>
                <span>{formatCurrency(grandTotal)}</span>
            </div>
        </div>

        <footer className="border-t pt-4 text-xs text-muted-foreground space-y-4">
             <div>
                <p className="font-semibold text-foreground">Amount in Words:</p>
                <p className="capitalize">{amountInWords}</p>
            </div>
            <div>
                <p className="font-semibold text-foreground">Bank Details:</p>
                <p>Bank: {vendor.bankName}, Acct Name: {vendor.accountName}, Acct No: {vendor.accountNumber}</p>
            </div>
             {invoice.notes && <p>Note: {invoice.notes}</p>}
        </footer>
    </div>
  );
}


import type { Vendor, VendorInvoice, CompanyProfile } from '@/lib/types';
import { format } from 'date-fns';
import Image from 'next/image';
import { numberToWords } from '@/lib/number-to-words';
import { Separator } from '../ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { generateAvatar } from '@/lib/vendor-utils';
import type { TemplateProps } from './types';
import { EditableTemplateFields } from './editable-template-fields';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
};

export function InvoiceTemplate5({ vendor, invoice, companyProfile, subtotal, totalDiscount, totalTax, grandTotal, isEditing = false, ...props }: TemplateProps) {
  const amountInWords = numberToWords(grandTotal);

  return (
    <div className="text-sm border-t-8 border-primary">
        <header className="grid grid-cols-2 gap-8 my-12">
            <div className="space-y-1">
                <h1 className="text-4xl font-bold text-primary">INVOICE</h1>
                <p><strong>Invoice No:</strong> {invoice.invoiceNumber}</p>
                <p><strong>Project:</strong> {invoice.projectName}</p>
            </div>
            <div className="text-right">
                <Image
                    src={vendor.logoUrl || generateAvatar(vendor.companyName)}
                    alt={`${vendor.companyName} logo`}
                    width={100}
                    height={40}
                    className="rounded-md object-contain mb-2 ml-auto"
                />
                <p className="font-semibold">{vendor.companyName}</p>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{vendor.address}</p>
            </div>
        </header>

        <section className="grid grid-cols-2 gap-8 mb-8 bg-gray-50 p-4 rounded-md">
            <div>
                <p className="text-muted-foreground font-semibold text-xs">BILL TO</p>
                <p className="font-bold">{companyProfile.name}</p>
                <p className="text-xs">{companyProfile.address}</p>
            </div>
             <div className="text-right">
                <p><span className="text-muted-foreground">Date:</span> {format(invoice.invoiceDate, 'dd/MM/yyyy')}</p>
                <p><span className="text-muted-foreground">Due:</span> {format(invoice.dueDate, 'dd/MM/yyyy')}</p>
            </div>
        </section>

        <section className="mb-8">
             {isEditing ? <EditableTemplateFields {...props} formatCurrency={formatCurrency} /> : (
                <Table>
                    <TableHeader className="bg-primary text-primary-foreground">
                        <TableRow>
                        <TableHead className="text-primary-foreground">Item Description</TableHead>
                        <TableHead className="text-right text-primary-foreground">Qty</TableHead>
                        <TableHead className="text-right text-primary-foreground">Rate</TableHead>
                        <TableHead className="text-right text-primary-foreground">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoice.items.map(item => (
                        <TableRow key={item.id}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.rate)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.quantity * item.rate)}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </section>

        <section className="grid grid-cols-2 gap-8 items-start">
            <div className="text-xs space-y-4">
                 <p className="capitalize"><strong>Amount in words:</strong> {amountInWords}</p>
                 {invoice.notes && <p><strong>Notes:</strong> {invoice.notes}</p>}
            </div>
            <div className="space-y-2">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
                {totalDiscount > 0 && <div className="flex justify-between text-muted-foreground"><span>Discount:</span><span>- {formatCurrency(totalDiscount)}</span></div>}
                {totalTax > 0 && <div className="flex justify-between text-muted-foreground"><span>VAT (7.5%):</span><span>{formatCurrency(totalTax)}</span></div>}
                <Separator className="my-2"/>
                <div className="flex justify-between font-bold text-lg"><span>Total:</span><span>{formatCurrency(grandTotal)}</span></div>
            </div>
        </section>

        <footer className="mt-16 text-center text-xs text-muted-foreground border-t pt-4">
            <p className="font-semibold text-sm text-foreground">Make all payments to: {vendor.bankName}</p>
            <p>Account Name: {vendor.accountName} | Account Number: {vendor.accountNumber}</p>
        </footer>
    </div>
  );
}

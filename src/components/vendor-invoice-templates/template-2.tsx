
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

export function InvoiceTemplate2({ vendor, invoice, companyProfile, subtotal, totalDiscount, totalTax, grandTotal, isEditing = false, ...props }: TemplateProps) {
  const amountInWords = numberToWords(grandTotal);

  return (
    <div className="text-sm bg-gray-50 p-8 rounded-lg">
        <header className="flex justify-between items-start mb-12">
            <div>
                <h1 className="text-3xl font-bold text-primary mb-2">{vendor.companyName}</h1>
                <p className="text-muted-foreground whitespace-pre-wrap max-w-xs">{vendor.address}</p>
            </div>
            <h2 className="text-4xl font-extrabold text-gray-300 tracking-wider">INVOICE</h2>
        </header>

        <section className="grid grid-cols-3 gap-8 mb-12">
            <div>
                <p className="text-gray-500 font-semibold mb-2">BILLED TO</p>
                <p className="font-bold">{companyProfile.name}</p>
                <p>{companyProfile.address}</p>
            </div>
             <div>
                <p className="text-gray-500 font-semibold mb-2">INVOICE #</p>
                <p className="font-bold">{invoice.invoiceNumber}</p>
                 <p className="text-gray-500 font-semibold mt-4 mb-2">PROJECT</p>
                <p className="font-bold">{invoice.projectName}</p>
            </div>
             <div>
                <p className="text-gray-500 font-semibold mb-2">DATE</p>
                <p className="font-bold">{format(invoice.invoiceDate, 'dd/MM/yyyy')}</p>
                 <p className="text-gray-500 font-semibold mt-4 mb-2">DUE DATE</p>
                <p className="font-bold">{format(invoice.dueDate, 'dd/MM/yyyy')}</p>
            </div>
        </section>

        <section className="mb-8">
             {isEditing ? <EditableTemplateFields {...props} formatCurrency={formatCurrency} /> : (
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[50%]">Item</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Total</TableHead>
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

        <section className="flex justify-end mb-12">
            <div className="w-full md:w-1/2 space-y-2">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                {totalDiscount > 0 && <div className="flex justify-between"><span>Discount</span><span>- {formatCurrency(totalDiscount)}</span></div>}
                {totalTax > 0 && <div className="flex justify-between"><span>VAT (7.5%)</span><span>{formatCurrency(totalTax)}</span></div>}
                <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg text-primary"><span>Total</span><span>{formatCurrency(grandTotal)}</span></div>
            </div>
        </section>

        <footer className="space-y-4 text-xs text-muted-foreground">
            <div>
                <p className="font-bold text-foreground mb-1">Amount in Words</p>
                <p className="capitalize">{amountInWords}</p>
            </div>
             <div>
                <p className="font-bold text-foreground mb-1">Payment Details</p>
                <p>Bank: {vendor.bankName} | Account: {vendor.accountNumber} ({vendor.accountName})</p>
            </div>
             {invoice.notes && (
                <div>
                    <p className="font-bold text-foreground mb-1">Notes</p>
                    <p>{invoice.notes}</p>
                </div>
            )}
        </footer>
    </div>
  );
}

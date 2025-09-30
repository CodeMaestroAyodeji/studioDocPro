
'use client';

import { useCompanyProfile } from '@/contexts/company-profile-context';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Pencil, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { DocumentPage } from '@/components/document-page';
import type { VendorInvoice, Vendor } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getVendors } from '@/lib/vendor-utils';

import { InvoiceTemplate1 } from '@/components/vendor-invoice-templates/template-1';
import { InvoiceTemplate2 } from '@/components/vendor-invoice-templates/template-2';
import { InvoiceTemplate3 } from '@/components/vendor-invoice-templates/template-3';
import { InvoiceTemplate4 } from '@/components/vendor-invoice-templates/template-4';
import { InvoiceTemplate5 } from '@/components/vendor-invoice-templates/template-5';

type StoredVendorInvoice = Omit<VendorInvoice, 'invoiceDate' | 'dueDate'> & { invoiceDate: string; dueDate: string };

const TAX_RATE = 7.5; // 7.5% VAT

export default function VendorInvoicePreviewPage() {
  const { state: companyProfile } = useCompanyProfile();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState<VendorInvoice | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    setVendors(getVendors());
  }, []);

  useEffect(() => {
    try {
      const storedInvoice = localStorage.getItem(`vendor_invoice_${invoiceId}`);
      if (storedInvoice) {
        const parsed: StoredVendorInvoice = JSON.parse(storedInvoice);
        const invoiceData: VendorInvoice = {
          ...parsed,
          invoiceDate: new Date(parsed.invoiceDate),
          dueDate: new Date(parsed.dueDate),
        };
        setInvoice(invoiceData);
        const associatedVendor = vendors.find(v => v.id === invoiceData.vendorId);
        if (associatedVendor) {
            setVendor(associatedVendor);
        } else if (vendors.length > 0) {
            toast({ variant: 'destructive', title: 'Associated vendor not found' });
        }
      } else {
        toast({ variant: 'destructive', title: 'Invoice not found' });
        router.push('/vendor-invoice');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error loading invoice' });
      router.push('/vendor-invoice');
    }
  }, [invoiceId, router, toast, vendors]);

  const { subtotal, totalDiscount, totalTax, grandTotal } = useMemo(() => {
    if (!invoice) return { subtotal: 0, totalDiscount: 0, totalTax: 0, grandTotal: 0 };
    
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    invoice.items.forEach(item => {
      const amount = item.quantity * item.rate;
      const discount = item.discount || 0;
      subtotal += amount;
      totalDiscount += discount;
      if (item.tax) {
        totalTax += (amount - discount) * (TAX_RATE / 100);
      }
    });

    const grandTotal = subtotal - totalDiscount + totalTax;
    return { subtotal, totalDiscount, totalTax, grandTotal };
  }, [invoice]);

  const handlePrint = () => {
    window.print();
  };

  if (!invoice || !vendor) {
    return (
      <div className="flex flex-1 flex-col">
        <Header title="Loading Invoice..." className="no-print" />
        <main className="flex-1 p-6 text-center"><p>Loading invoice details...</p></main>
      </div>
    );
  }

  const renderTemplatePreview = () => {
    const templateProps = {
      vendor,
      invoice,
      companyProfile,
      subtotal,
      totalDiscount,
      totalTax,
      grandTotal,
    };
    
    switch (vendor.invoiceTemplate) {
      case 'template-1': return <InvoiceTemplate1 {...templateProps} />;
      case 'template-2': return <InvoiceTemplate2 {...templateProps} />;
      case 'template-3': return <InvoiceTemplate3 {...templateProps} />;
      case 'template-4': return <InvoiceTemplate4 {...templateProps} />;
      case 'template-5': return <InvoiceTemplate5 {...templateProps} />;
      default: return <InvoiceTemplate1 {...templateProps} />;
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <Header title={`Invoice ${invoice.invoiceNumber}`} className="no-print" />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <div className="mb-4 flex justify-end gap-2 no-print">
          <Button variant="outline" onClick={() => router.push(`/vendor-invoice/${invoiceId}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button onClick={handlePrint}>
            <Download className="mr-2 h-4 w-4" /> Print or Save PDF
          </Button>
        </div>

        <DocumentPage className="vendor-invoice-print">
          {renderTemplatePreview()}
        </DocumentPage>
      </main>
    </div>
  );
}

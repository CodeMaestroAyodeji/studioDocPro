'use client';

import { useCompanyProfile } from '@/contexts/company-profile-context';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Pencil, Download, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { DocumentPage } from '@/components/document-page';
import type { VendorInvoice, Vendor } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';

import { InvoiceTemplate1 } from '@/components/vendor-invoice-templates/template-1';
import { InvoiceTemplate2 } from '@/components/vendor-invoice-templates/template-2';
import { InvoiceTemplate3 } from '@/components/vendor-invoice-templates/template-3';
import { InvoiceTemplate4 } from '@/components/vendor-invoice-templates/template-4';
import { InvoiceTemplate5 } from '@/components/vendor-invoice-templates/template-5';

interface VendorInvoiceWithRelations extends VendorInvoice {
  vendor: Vendor;
}

const TAX_RATE = 7.5; // 7.5% VAT

export default function VendorInvoicePreviewPage() {
  const { state: companyProfile } = useCompanyProfile();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;
  const { firebaseUser } = useAuth();
  const [invoice, setInvoice] = useState<VendorInvoiceWithRelations | null>(null);

  useEffect(() => {
    if (!firebaseUser || !invoiceId) return;

    const fetchInvoice = async () => {
      const token = await firebaseUser.getIdToken();
      try {
        const response = await fetch(`/api/vendor-invoices/${invoiceId}?v=${new Date().getTime()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error('Failed to fetch invoice');
        }
        const data = await response.json();
        setInvoice(data);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error loading invoice' });
        router.push('/vendor-invoice');
      }
    };

    fetchInvoice();
  }, [invoiceId, router, toast, firebaseUser]);

  const { subtotal, totalDiscount, totalTax, grandTotal } = useMemo(() => {
    if (!invoice) return { subtotal: 0, totalDiscount: 0, totalTax: 0, grandTotal: 0 };

    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    invoice.lineItems.forEach(item => {
      const amount = item.quantity * item.unitPrice;
      const discount = item.discount || 0;
      
      if (item.tax) {
        // Amount is tax-inclusive. We need to find the base amount and tax.
        const baseAmount = amount / (1 + TAX_RATE / 100);
        const taxAmount = amount - baseAmount;
        subtotal += baseAmount;
        totalTax += taxAmount;
      } else {
        // Amount is pre-tax.
        subtotal += amount;
      }
      totalDiscount += discount;
    });

    const grandTotal = subtotal - totalDiscount + totalTax;
    return { subtotal, totalDiscount, totalTax, grandTotal };
  }, [invoice]);

  const handleDelete = async () => {
    if (!firebaseUser || !invoiceId) return;

    if (!confirm('Are you sure you want to delete this invoice?')) {
        return;
    }

    const token = await firebaseUser.getIdToken();

    try {
        const response = await fetch(`/api/vendor-invoices/${invoiceId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete invoice');
        }

        toast({
            title: 'Invoice Deleted',
            description: `Invoice "${invoice?.invoiceNumber}" has been deleted.`,
        });
        router.push('/vendor-invoice');
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error Deleting Invoice',
            description: 'Could not delete the invoice. Please try again.',
        });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!invoice) {
    return (
      <div className="flex flex-1 flex-col">
        <Header title="Loading Invoice..." className="no-print" />
        <main className="flex-1 p-6 text-center"><p>Loading invoice details...</p></main>
      </div>
    );
  }

  const renderTemplatePreview = () => {
    const templateProps = {
      vendor: invoice.vendor,
      invoice,
      companyProfile,
      subtotal,
      totalDiscount,
      totalTax,
      grandTotal,
    };
    
    switch (invoice.vendor.invoiceTemplate) {
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
          <Button variant="destructive" onClick={handleDelete}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
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
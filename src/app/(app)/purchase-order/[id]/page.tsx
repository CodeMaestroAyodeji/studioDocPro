
'use client';

import { useCompanyProfile } from '@/contexts/company-profile-context';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import { Pencil, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { DocumentPage } from '@/components/document-page';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { PurchaseOrder } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

type StoredPurchaseOrder = Omit<PurchaseOrder, 'date' | 'items'> & { date: string, items: (Omit<PurchaseOrder['items'][0], 'grossUp'> & {grossUp?: boolean})[] };

const DEFAULT_TAX_RATE = 5; // 5%

export default function PurchaseOrderPreviewPage() {
  const { state: companyProfile } = useCompanyProfile();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const poId = params.id as string;
  const [po, setPo] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    try {
      const storedPo = localStorage.getItem(`po_${poId}`);
      if (storedPo) {
        const parsed: StoredPurchaseOrder = JSON.parse(storedPo);
        setPo({
          ...parsed,
          date: new Date(parsed.date),
          items: parsed.items.map(item => ({...item, applyTax: item.applyTax || false}))
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Purchase Order not found',
        });
        router.push('/purchase-order');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error loading Purchase Order',
      });
      router.push('/purchase-order');
    }
  }, [poId, router, toast]);

  const logoPlaceholder = PlaceHolderImages.find((p) => p.id === 'logo');

  const handlePrint = () => {
    if (!po) return;
    window.print();
  };

  if (!po) {
    return (
      <div className="flex flex-1 flex-col">
        <Header title="Loading PO..." className="no-print" />
        <main className="flex-1 p-4 sm:px-6 sm:py-0 text-center">
            <p>Loading purchase order details...</p>
        </main>
      </div>
    );
  }

  const formattedDate = format(po.date, 'dd/MM/yyyy');
  const signatory1 = companyProfile.signatories.find(s => s.id === po.signatory1);
  const signatory2 = companyProfile.signatories.find(s => s.id === po.signatory2);
  
  const getDisplayUnitPrice = (item: PurchaseOrder['items'][0]) => {
    if (item.applyTax) {
      return item.unitPrice * (1 + DEFAULT_TAX_RATE / 100);
    }
    return item.unitPrice;
  }

  const getItemAmount = (item: PurchaseOrder['items'][0]) => {
      const displayUnitPrice = getDisplayUnitPrice(item);
      return (item.quantity || 0) * displayUnitPrice;
  }

  const calculateTotals = () => {
    if (!po) return { subtotal: 0, totalTax: 0, grandTotal: 0 };
    
    const subtotal = po.items.reduce((acc, item) => acc + getItemAmount(item), 0);

    const totalTax = po.items.reduce((acc, item) => {
        if (item.applyTax) {
            const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
            return acc + (itemTotal * (DEFAULT_TAX_RATE / 100));
        }
        return acc;
    }, 0);
    
    const grandTotal = subtotal - totalTax;

    return { subtotal, totalTax, grandTotal };
  };

  const { subtotal, totalTax, grandTotal } = calculateTotals();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };
  
  return (
    <div className="flex flex-1 flex-col">
      <Header title={`Purchase Order ${po.poNumber}`} className="no-print" />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <div className="mb-4 flex justify-end gap-2 no-print">
            <Button variant="outline" onClick={() => router.push(`/purchase-order/${poId}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
            </Button>
            <Button onClick={handlePrint}>
                <Download className="mr-2 h-4 w-4" />
                Print to A4
            </Button>
        </div>

        <DocumentPage className="purchase-order-print">
             <header className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  {logoPlaceholder && (
                    <Image
                      src={companyProfile.logoUrl || logoPlaceholder.imageUrl}
                      alt="Company Logo"
                      width={150}
                      height={50}
                      data-ai-hint={logoPlaceholder.imageHint}
                      className="rounded-md object-contain mb-4"
                    />
                  )}
                </div>
                <div className="text-right">
                  <h1 className="text-4xl font-bold font-headline text-primary mb-2">PURCHASE ORDER</h1>
                  <div className="grid grid-cols-2 gap-1 text-sm">
                    <span className="font-semibold">PO #</span><span>{po.poNumber}</span>
                    <span className="font-semibold">Date</span><span>{formattedDate}</span>
                  </div>
                </div>
              </header>

              <section className="grid md:grid-cols-2 gap-x-8 mb-8">
                  <div>
                      <p className="font-semibold text-muted-foreground">VENDOR:</p>
                      <pre className="font-sans whitespace-pre-wrap">{po.vendor}</pre>
                  </div>
                  <div>
                      <p className="font-semibold text-muted-foreground">PROJECT NAME:</p>
                      <p>{po.projectName}</p>
                  </div>
              </section>
              
               <section className="mb-8">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Description</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="w-[150px] text-right">Unit Price</TableHead>
                      <TableHead className="text-center print-hide">Tax (5%)</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {po.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(getDisplayUnitPrice(item))}</TableCell>
                        <TableCell className="text-center print-hide">{item.applyTax ? 'Yes' : 'No'}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(getItemAmount(item))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                     <TableRow>
                         <TableCell colSpan={4} className="text-right font-semibold">Subtotal</TableCell>
                         <TableCell className="text-right font-bold">{formatCurrency(subtotal)}</TableCell>
                     </TableRow>
                     <TableRow>
                         <TableCell colSpan={4} className="text-right font-semibold">Withholding Tax (5%)</TableCell>
                         <TableCell className="text-right font-bold">({formatCurrency(totalTax)})</TableCell>
                     </TableRow>
                     <TableRow className="text-lg">
                         <TableCell colSpan={4} className="text-right font-bold">Grand Total</TableCell>
                         <TableCell className="text-right font-bold text-primary">{formatCurrency(grandTotal)}</TableCell>
                     </TableRow>
                  </TableFooter>
                </Table>
              </section>

              <Separator className="my-8" />
              
              <footer className="space-y-4">
                 <div className="grid grid-cols-2 gap-8 pt-8">
                    <div className="text-center">
                        <div className="h-12"></div>
                        <div className="border-b border-foreground w-2/3 mx-auto"></div>
                        <p className="font-semibold mt-2">{signatory1?.name}</p>
                        <p className="text-sm text-muted-foreground">{signatory1?.title}</p>
                    </div>
                    <div className="text-center">
                        <div className="h-12"></div>
                        <div className="border-b border-foreground w-2/3 mx-auto"></div>
                        <p className="font-semibold mt-2">{signatory2?.name}</p>
                        <p className="text-sm text-muted-foreground">{signatory2?.title}</p>
                    </div>
                 </div>
                 <div className="text-center text-xs text-muted-foreground pt-4">
                    <p className='font-bold text-sm text-foreground'>{companyProfile.name}</p>
                    <p>{companyProfile.address}</p>
                    <p>
                        <span>{companyProfile.phone}</span> | <span>{companyProfile.email}</span> | <span>{companyProfile.website}</span>
                    </p>
                 </div>
              </footer>
        </DocumentPage>
      </main>
    </div>
  );
}

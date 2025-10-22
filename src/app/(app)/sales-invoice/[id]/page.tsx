"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useCompanyProfile } from "@/contexts/company-profile-context";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { SalesInvoice, InvoiceLineItem, Client } from "@prisma/client";
import { numberToWords } from "@/lib/number-to-words";

type InvoiceDetails = SalesInvoice & {
  client: Client;
  lineItems: InvoiceLineItem[];
};

export default function SalesInvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { firebaseUser } = useAuth();
  const { state: companyProfile } = useCompanyProfile();
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const id = params.id;

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!firebaseUser || !id) return;

      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/sales-invoices/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvoice(data);
      } else {
        console.error("Failed to fetch invoice");
      }
      setLoading(false);
    };

    fetchInvoice();
  }, [firebaseUser, id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!invoice) {
    return <div>Invoice not found</div>;
  }

  // Currency formatter for NGN (Naira) with commas
  const fmt = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Determine discount amount:
  // - If discount is undefined -> 0
  // - If discount <= 1 -> treat as percentage (e.g. 0.05 = 5%)
  // - Else treat as absolute amount
  const discountRaw = invoice.discount ?? 0;
  const subtotal = Number(invoice.subtotal ?? 0);

  const discountAmount =
    discountRaw === 0
      ? 0
      : discountRaw > 0 && discountRaw <= 1
      ? subtotal * discountRaw // percentage
      : discountRaw; // absolute

  // Tax: assume stored invoice.tax is the computed tax or compute from subtotal after discount
  // If invoice.tax exists/ >0 use it; otherwise calculate 7.5% on (subtotal - discountAmount) if addVat true.
  const taxRate = 0.075;
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const tax =
    typeof invoice.tax === "number" && invoice.tax > 0
      ? invoice.tax
      : invoice.addVat
      ? taxableBase * taxRate
      : 0;

  const total = subtotal - discountAmount + tax;

  // Amount in words
  const amountInWords = `${numberToWords(Math.round(total))} Naira${
    Math.round(total) % 1 === 0 ? " Only" : ""
  }`;

  // Bank details: try to match invoice.bankAccountId with companyProfile.bankAccounts
  const bankAccount = companyProfile?.bankAccounts?.find((b: any) => {
    if (!b) return false;
    // compare flexible: string/number
    return (
      String(b.id) === String(invoice.bankAccountId) ||
      b.accountNumber === invoice.bankAccountId
    );
  });

  // Signatories: match preparedById / approvedById if present, else attempt fallback via companyProfile.signatories[0/1]
  const preparedBy =
    companyProfile?.signatories?.find(
      (s: any) => String(s.id) === String(invoice.preparedById)
    ) ||
    companyProfile?.signatories?.[0] ||
    null;
  const approvedBy =
    companyProfile?.signatories?.find(
      (s: any) => String(s.id) === String(invoice.approvedById)
    ) ||
    companyProfile?.signatories?.[1] ||
    null;

  return (
    <div className="flex flex-1 flex-col">
      <Header title={`Invoice ${invoice.invoiceNumber}`} />
      <main className="flex-1 p-4 sm:px-6 sm:py-0 space-y-4">
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/sales-invoice")}
          >
            Back to List
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/sales-invoice/${id}/edit`)}
          >
            Edit
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            Print
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <img
                src={companyProfile.logoUrl}
                alt="Company Logo"
                className="h-16 w-16 object-contain"
              />
              <div className="text-right">
                <CardTitle>Sales Invoice</CardTitle>
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <div>
                <p className="font-bold">{companyProfile.name}</p>
                <p className="text-sm text-gray-500">
                  {companyProfile.address}
                </p>
                <p className="text-sm text-gray-500">{companyProfile.phone}</p>
                <p className="text-sm text-gray-500">{companyProfile.email}</p>
                <p className="text-sm text-gray-500">
                  {companyProfile.website}
                </p>
              </div>
              <div className="text-right">
                <p>
                  <strong>Invoice #:</strong> {invoice.invoiceNumber}
                </p>
                <p>
                  <strong>Issue Date:</strong>{" "}
                  {format(new Date(invoice.issueDate), "PPP")}
                </p>
                {companyProfile.tin && (
                  <p>
                    <strong>TIN:</strong> {companyProfile.tin}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">Billed To</h3>
              <p>{invoice.client.name}</p>
              {invoice.client.address && <p>{invoice.client.address}</p>}
              {invoice.client.email && <p>{invoice.client.email}</p>}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.lineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {fmt.format(Number(item.unitPrice))}
                    </TableCell>
                    <TableCell className="text-right">
                      {fmt.format(Number(item.total))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">
                    Subtotal
                  </span>
                  <span>{fmt.format(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">
                      Discounts
                    </span>
                    <span className="text-red-600">-{fmt.format(discountAmount)}</span>
                  </div>
                )}

                {tax > 0 && (
                  <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">Tax</span>
                    <span>{fmt.format(tax)}</span>
                  </div>
                )}

                <div className="flex justify-between border-t pt-2 font-bold text-lg">
                  <span>Grand Total</span>
                  <span>{fmt.format(total)}</span>
                </div>

                <div className="mt-2 text-sm text-muted-foreground">
                  <p>
                    <strong>Amount in words:</strong>
                  </p>
                  <p className="capitalize">{amountInWords}</p>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div>
                <h3 className="font-semibold">Notes</h3>
                <p>{invoice.notes}</p>
              </div>
            )}

            {/* Bank details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <h4 className="font-semibold">Company Bank Details</h4>
                {bankAccount ? (
                  <div>
                    <p>
                      <strong>Bank:</strong> {bankAccount.bankName}
                    </p>
                    <p>
                      <strong>Account Name:</strong> {bankAccount.accountName}
                    </p>
                    <p>
                      <strong>Account Number:</strong>{" "}
                      {bankAccount.accountNumber}
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Fallback: show all bank accounts if none matched */}
                    {companyProfile.bankAccounts?.length ? (
                      companyProfile.bankAccounts.map((b: any) => (
                        <div key={b.id} className="mb-2">
                          <p>
                            <strong>Bank:</strong> {b.bankName}
                          </p>
                          <p>
                            <strong>Account Name:</strong> {b.accountName}
                          </p>
                          <p>
                            <strong>Account Number:</strong> {b.accountNumber}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No bank details available
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Prepared / Approved signature area */}
              <div className="flex flex-col justify-between">
                <div className="flex justify-between items-end mt-6">
                  <div className="text-center w-1/2">
                    <p className="text-sm">Prepared By</p>
                    <div className="h-12"></div>
                    <div className="border-b border-foreground w-3/4 mx-auto"></div>
                    <p className="text-sm font-semibold mt-1">
                      {preparedBy?.name ?? "__________"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {preparedBy?.title ?? ""}
                    </p>
                  </div>

                  <div className="text-center w-1/2">
                    <p className="text-sm">Approved By</p>
                    <div className="h-12"></div>
                    <div className="border-b border-foreground w-3/4 mx-auto"></div>
                    <p className="text-sm font-semibold mt-1">
                      {approvedBy?.name ?? "__________"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {approvedBy?.title ?? ""}
                    </p>
                  </div>
                </div>

                {/* Company footer for print */}
                <div className="text-center text-xs text-muted-foreground pt-8">
                  <p className="font-bold text-sm text-foreground">
                    {companyProfile.name}
                  </p>
                  <p>{companyProfile.address}</p>
                  <p>
                    <span>{companyProfile.phone}</span> |{" "}
                    <span>{companyProfile.email}</span> |{" "}
                    <span>{companyProfile.website}</span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

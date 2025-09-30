
const VENDOR_INVOICE_SEQUENCE_KEY_PREFIX = 'docupro_vendor_invoice_sequence_';

type VendorInvoiceSequence = {
  lastNumber: number;
  year: number;
};

function getSequence(vendorId: string): VendorInvoiceSequence {
  try {
    const stored = localStorage.getItem(`${VENDOR_INVOICE_SEQUENCE_KEY_PREFIX}${vendorId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      const currentYear = new Date().getFullYear();
      if (parsed.year === currentYear) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to read vendor invoice sequence from localStorage', error);
  }
  return { lastNumber: 0, year: new Date().getFullYear() };
}

function saveSequence(vendorId: string, sequence: VendorInvoiceSequence) {
  try {
    localStorage.setItem(`${VENDOR_INVOICE_SEQUENCE_KEY_PREFIX}${vendorId}`, JSON.stringify(sequence));
  } catch (error) {
    console.error('Failed to save vendor invoice sequence to localStorage', error);
  }
}

export function getNextVendorInvoiceNumber(vendorName: string, increment: boolean = false): string {
  const vendorInitials = vendorName.substring(0, 3).toUpperCase();
  const sequence = getSequence(vendorInitials);
  let nextNumber = sequence.lastNumber + 1;
  
  if (increment) {
     const newSequence = { ...sequence, lastNumber: nextNumber };
     saveSequence(vendorInitials, newSequence);
  }

  const year = sequence.year;
  const paddedNumber = String(nextNumber).padStart(4, '0');

  return `INV/${vendorInitials}/${year}/${paddedNumber}`;
}

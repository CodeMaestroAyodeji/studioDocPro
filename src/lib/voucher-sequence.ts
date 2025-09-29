const VOUCHER_SEQUENCE_KEY = 'docupro_voucher_sequence';

type VoucherSequence = {
  lastNumber: number;
  year: number;
};

function getSequence(): VoucherSequence {
  try {
    const stored = localStorage.getItem(VOUCHER_SEQUENCE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const currentYear = new Date().getFullYear();
      if (parsed.year === currentYear) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to read voucher sequence from localStorage', error);
  }
  // Return default if not found or year has changed
  return { lastNumber: 0, year: new Date().getFullYear() };
}

function saveSequence(sequence: VoucherSequence) {
  try {
    localStorage.setItem(VOUCHER_SEQUENCE_KEY, JSON.stringify(sequence));
  } catch (error) {
    console.error('Failed to save voucher sequence to localStorage', error);
  }
}

export function getNextVoucherNumber(increment: boolean = false): string {
  const sequence = getSequence();
  let nextNumber = sequence.lastNumber;
  
  if (increment) {
     nextNumber++;
     const newSequence = { ...sequence, lastNumber: nextNumber };
     saveSequence(newSequence);
  } else {
    nextNumber++;
  }

  const year = sequence.year;
  const paddedNumber = String(nextNumber).padStart(4, '0');

  return `PV-BSL-${year}-${paddedNumber}`;
}

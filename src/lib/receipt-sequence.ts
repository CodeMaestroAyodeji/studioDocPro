
const RECEIPT_SEQUENCE_KEY = 'docupro_receipt_sequence';

type ReceiptSequence = {
  lastNumber: number;
  year: number;
};

function getSequence(): ReceiptSequence {
  try {
    const stored = localStorage.getItem(RECEIPT_SEQUENCE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const currentYear = new Date().getFullYear();
      if (parsed.year === currentYear) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to read receipt sequence from localStorage', error);
  }
  // Return default if not found or year has changed
  return { lastNumber: 0, year: new Date().getFullYear() };
}

function saveSequence(sequence: ReceiptSequence) {
  try {
    localStorage.setItem(RECEIPT_SEQUENCE_KEY, JSON.stringify(sequence));
  } catch (error) {
    console.error('Failed to save receipt sequence to localStorage', error);
  }
}

export function getNextReceiptNumber(increment: boolean = false): string {
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

  return `RCPT-BSL-${year}-${paddedNumber}`;
}

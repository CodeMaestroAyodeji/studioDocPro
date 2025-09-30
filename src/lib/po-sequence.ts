const PO_SEQUENCE_KEY = 'docupro_po_sequence';

type PoSequence = {
  lastNumber: number;
  year: number;
};

function getSequence(): PoSequence {
  try {
    const stored = localStorage.getItem(PO_SEQUENCE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const currentYear = new Date().getFullYear();
      if (parsed.year === currentYear) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to read PO sequence from localStorage', error);
  }
  // Return default if not found or year has changed
  return { lastNumber: 0, year: new Date().getFullYear() };
}

function saveSequence(sequence: PoSequence) {
  try {
    localStorage.setItem(PO_SEQUENCE_KEY, JSON.stringify(sequence));
  } catch (error) {
    console.error('Failed to save PO sequence to localStorage', error);
  }
}

export function getNextPoNumber(increment: boolean = false): string {
  const sequence = getSequence();
  let nextNumber = sequence.lastNumber + 1;
  
  if (increment) {
     const newSequence = { ...sequence, lastNumber: nextNumber };
     saveSequence(newSequence);
  }

  const year = sequence.year;
  const paddedNumber = String(nextNumber).padStart(4, '0');

  return `PO-BSL-${year}-${paddedNumber}`;
}

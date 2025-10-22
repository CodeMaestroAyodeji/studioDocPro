// lib/finance-utils.ts
export const formatCurrency = (amount: number | string = 0): string => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(num);
};

export const formatDate = (date: string | Date | null): string => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

export const calculateTotals = (items: { quantity: number; unitPrice: number }[], discount = 0, addVat = false) => {
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const discountAmount = discount > 0 ? subtotal * (discount / 100) : 0;
  const tax = addVat ? (subtotal - discountAmount) * 0.075 : 0;
  const total = subtotal - discountAmount + tax;
  return { subtotal, discountAmount, tax, total };
};

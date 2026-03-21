export function formatCurrency(amount: number): string {
  return "$" + Math.abs(Math.round(amount)).toLocaleString();
}

export function formatSignedCurrency(amount: number): string {
  const sign = amount < 0 ? "−" : "+";
  return sign + "$" + Math.abs(Math.round(amount)).toLocaleString();
}

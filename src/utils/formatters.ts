export function formatCurrency(amount: number): string {
  return `NT$${Math.abs(amount).toLocaleString()}`;
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

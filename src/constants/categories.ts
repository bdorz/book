export interface Category {
  name: string;
  color: string;
  emoji: string;
}

export const EXPENSE_CATEGORIES: Category[] = [
  { name: '餐飲', color: '#FF6B6B', emoji: '🍜' },
  { name: '購物', color: '#FF9F43', emoji: '🛍️' },
  { name: '娛樂', color: '#A29BFE', emoji: '🎮' },
  { name: '交通', color: '#74B9FF', emoji: '🚌' },
  { name: '醫療', color: '#55EFC4', emoji: '💊' },
  { name: '教育', color: '#FDCB6E', emoji: '📚' },
  { name: '居家', color: '#81ECEC', emoji: '🏠' },
  { name: '其他', color: '#B2BEC3', emoji: '📦' },
];

export const INCOME_CATEGORIES: Category[] = [
  { name: '薪資', color: '#00B894', emoji: '💰' },
  { name: '獎金', color: '#FDCB6E', emoji: '🎁' },
  { name: '兼職', color: '#74B9FF', emoji: '💼' },
  { name: '投資', color: '#A29BFE', emoji: '📈' },
  { name: '其他', color: '#B2BEC3', emoji: '💵' },
];

export function getCategoryColor(name: string): string {
  const all = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
  return all.find((c) => c.name === name)?.color ?? '#B2BEC3';
}

export function getCategoryEmoji(name: string): string {
  const all = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
  return all.find((c) => c.name === name)?.emoji ?? '📦';
}

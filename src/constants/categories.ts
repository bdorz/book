export interface Category {
  label: string;
  value: string;
  icon: string;
  color: string;
}

export const EXPENSE_CATEGORIES: Category[] = [
  { label: '餐飲', value: '餐飲', icon: 'food-fork-drink', color: '#FF9F43' },
  { label: '購物', value: '購物', icon: 'shopping', color: '#FF4757' },
  { label: '交通', value: '交通', icon: 'car', color: '#2D9CDB' },
  { label: '娛樂', value: '娛樂', icon: 'gamepad-variant', color: '#A29BFE' },
  { label: '醫療', value: '醫療', icon: 'hospital-box', color: '#00CEC9' },
  { label: '住房', value: '住房', icon: 'home', color: '#6C5CE7' },
  { label: '教育', value: '教育', icon: 'book-open-variant', color: '#0984E3' },
  { label: '其他', value: '其他', icon: 'dots-horizontal-circle', color: '#636E72' },
];

export const INCOME_CATEGORIES: Category[] = [
  { label: '薪資', value: '薪資', icon: 'cash-multiple', color: '#00C897' },
  { label: '獎金', value: '獎金', icon: 'gift', color: '#FDCB6E' },
  { label: '投資', value: '投資', icon: 'trending-up', color: '#00B894' },
  { label: '其他', value: '其他', icon: 'dots-horizontal-circle', color: '#636E72' },
];

export const CREDIT_CATEGORIES: Category[] = [
  { label: '餐飲', value: '餐飲', icon: 'food-fork-drink', color: '#FF9F43' },
  { label: '購物', value: '購物', icon: 'shopping', color: '#FF4757' },
  { label: '娛樂', value: '娛樂', icon: 'gamepad-variant', color: '#A29BFE' },
  { label: '交通', value: '交通', icon: 'car', color: '#2D9CDB' },
  { label: '其他', value: '其他', icon: 'dots-horizontal-circle', color: '#636E72' },
];

export const FAMILY_CATEGORIES: Category[] = [
  { label: '代付', value: '代付', icon: 'account-arrow-left', color: '#FF9F43' },
  { label: '代收', value: '代收', icon: 'account-arrow-right', color: '#00C897' },
];

export function getCategoriesForType(type: string): Category[] {
  switch (type) {
    case 'expense': return EXPENSE_CATEGORIES;
    case 'income': return INCOME_CATEGORIES;
    case 'credit_card': return CREDIT_CATEGORIES;
    case 'family_in':
    case 'family_out': return FAMILY_CATEGORIES;
    default: return EXPENSE_CATEGORIES;
  }
}

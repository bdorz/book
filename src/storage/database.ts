import AsyncStorage from '@react-native-async-storage/async-storage';
import {Transaction, AppSettings, TransactionType, MonthlyReport} from '../types';

const TRANSACTIONS_KEY = '@book_transactions';
const SETTINGS_KEY = '@book_settings';
const REPORTS_KEY = '@book_monthly_reports';

export const defaultSettings: AppSettings = {
  base_savings: 0,
  user_name: '使用者',
  fixed_expenses: [],
  estimated_incomes: [],
};

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function getAllTransactions(): Promise<Transaction[]> {
  try {
    const data = await AsyncStorage.getItem(TRANSACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function getTransactionsByMonth(
  year: number,
  month: number,
): Promise<Transaction[]> {
  const all = await getAllTransactions();
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return all.filter(t => t.date.startsWith(prefix));
}

export async function getTransactionsByTypes(
  types: TransactionType[],
  year?: number,
  month?: number,
): Promise<Transaction[]> {
  let all = await getAllTransactions();
  if (year !== undefined && month !== undefined) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    all = all.filter(t => t.date.startsWith(prefix));
  }
  return all.filter(t => types.includes(t.type));
}

export async function createTransaction(
  data: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>,
): Promise<Transaction> {
  const now = new Date().toISOString();
  const transaction: Transaction = {
    ...data,
    id: generateId(),
    created_at: now,
    updated_at: now,
  };
  const all = await getAllTransactions();
  all.unshift(transaction);
  await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(all));
  return transaction;
}

export async function updateTransaction(
  id: string,
  data: Partial<Omit<Transaction, 'id' | 'created_at'>>,
): Promise<void> {
  const all = await getAllTransactions();
  const idx = all.findIndex(t => t.id === id);
  if (idx === -1) {return;}
  all[idx] = {...all[idx], ...data, updated_at: new Date().toISOString()};
  await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(all));
}

export async function deleteTransaction(id: string): Promise<void> {
  const all = await getAllTransactions();
  const filtered = all.filter(t => t.id !== id);
  await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(filtered));
}

export async function getTransactionById(
  id: string,
): Promise<Transaction | null> {
  const all = await getAllTransactions();
  return all.find(t => t.id === id) ?? null;
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!data) {return defaultSettings;}
    const parsed = JSON.parse(data);
    // 相容舊版單一數值格式
    if (typeof parsed.fixed_expense === 'number' && !parsed.fixed_expenses) {
      parsed.fixed_expenses = parsed.fixed_expense > 0
        ? [{id: 'legacy_fe', name: '固定支出', amount: parsed.fixed_expense}]
        : [];
    }
    if (typeof parsed.estimated_income === 'number' && !parsed.estimated_incomes) {
      parsed.estimated_incomes = parsed.estimated_income > 0
        ? [{id: 'legacy_ei', name: '預估收入', amount: parsed.estimated_income}]
        : [];
    }
    return {...defaultSettings, ...parsed};
  } catch {
    return defaultSettings;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ── 月結報表 ──────────────────────────────────────────────

export async function getAllMonthlyReports(): Promise<MonthlyReport[]> {
  try {
    const data = await AsyncStorage.getItem(REPORTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function getMonthlyReport(
  year: number,
  month: number,
): Promise<MonthlyReport | null> {
  const all = await getAllMonthlyReports();
  return all.find(r => r.year === year && r.month === month) ?? null;
}

export async function saveMonthlyReport(
  report: Omit<MonthlyReport, 'id' | 'created_at'>,
): Promise<void> {
  const all = await getAllMonthlyReports();
  const existing = all.findIndex(r => r.year === report.year && r.month === report.month);
  const full: MonthlyReport = {
    ...report,
    id: `${report.year}-${String(report.month).padStart(2, '0')}`,
    created_at: new Date().toISOString(),
  };
  if (existing >= 0) {
    all[existing] = full;
  } else {
    all.push(full);
  }
  await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(all));
}

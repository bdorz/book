import AsyncStorage from '@react-native-async-storage/async-storage';
import {Transaction, AppSettings, TransactionType} from '../types';

const TRANSACTIONS_KEY = '@book_transactions';
const SETTINGS_KEY = '@book_settings';

export const defaultSettings: AppSettings = {
  base_savings: 0,
  user_name: '使用者',
  fixed_expense: 0,
  estimated_income: 0,
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
    return data ? {...defaultSettings, ...JSON.parse(data)} : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

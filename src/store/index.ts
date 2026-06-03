import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Transaction, AppSettings } from './types';

interface AppStore {
  transactions: Transaction[];
  settings: AppSettings;
  addTransaction: (t: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  toggleFamilyRepaid: (id: string) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  updateSavingsBase: (amount: number) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  userName: '智豪',
  monthlyBudget: 15000,
  savingsBase: 0,
  periodStartDay: 5,
  estimatedIncome: 1150,
  creditCardName: '中信',
  familyMembers: ['大姊'],
  regularExpenses: [],
};

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      transactions: [],
      settings: DEFAULT_SETTINGS,

      addTransaction: (t) =>
        set((state) => ({ transactions: [t, ...state.transactions] })),

      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      toggleFamilyRepaid: (id) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, familyRepaid: !t.familyRepaid } : t
          ),
        })),

      updateSettings: (updates) =>
        set((state) => ({ settings: { ...state.settings, ...updates } })),

      updateSavingsBase: (amount) =>
        set((state) => ({
          settings: { ...state.settings, savingsBase: amount },
        })),
    }),
    {
      name: 'book-app-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

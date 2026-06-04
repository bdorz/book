export type TransactionType = 'expense' | 'income' | 'credit_card' | 'family_in' | 'family_out';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

export interface FixedItem {
  id: string;
  name: string;
  amount: number;
}

export interface AppSettings {
  base_savings: number;
  user_name: string;
  fixed_expenses: FixedItem[];
  estimated_incomes: FixedItem[];
}

export interface MonthlyReport {
  id: string;
  year: number;
  month: number;
  opening_balance: number;
  income: number;
  cash_expense: number;
  credit_expense: number;
  closing_balance: number;
  created_at: string;
}

export type RootStackParamList = {
  MainTabs: undefined;
  AddEditTransaction: {
    transactionId?: string;
    initialType?: TransactionType;
  };
};

export type TabParamList = {
  Home: undefined;
  Transactions: undefined;
  Family: undefined;
  MonthlyReport: undefined;
  Settings: undefined;
};

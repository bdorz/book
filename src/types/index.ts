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

export interface AppSettings {
  base_savings: number;
  user_name: string;
  fixed_expense: number;
  estimated_income: number;
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
  Settings: undefined;
};

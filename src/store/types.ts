export type PaymentMethod = 'cash' | 'credit_card' | 'transfer';
export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  paymentMethod: PaymentMethod;
  date: string; // YYYY-MM-DD
  note: string;
  isForFamily: boolean;
  familyMember: string;
  familyRepaid: boolean;
}

export interface RegularExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  paymentMethod: PaymentMethod;
}

export interface AppSettings {
  userName: string;
  monthlyBudget: number;
  savingsBase: number;
  periodStartDay: number;
  estimatedIncome: number;
  creditCardName: string;
  familyMembers: string[];
  regularExpenses: RegularExpense[];
}

export interface PeriodRange {
  start: Date;
  end: Date;
  totalDays: number;
  daysElapsed: number;
}

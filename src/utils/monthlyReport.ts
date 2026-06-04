import {
  getTransactionsByMonth,
  getMonthlyReport,
  saveMonthlyReport,
  getSettings,
} from '../storage/database';

function prevMonth(year: number, month: number): {year: number; month: number} {
  return month === 1 ? {year: year - 1, month: 12} : {year, month: month - 1};
}

async function generateReport(year: number, month: number): Promise<number> {
  const transactions = await getTransactionsByMonth(year, month);
  const main = transactions.filter(t => t.type !== 'family_in' && t.type !== 'family_out');

  const income = main.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const cashExpense = main.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const creditExpense = main.filter(t => t.type === 'credit_card').reduce((s, t) => s + t.amount, 0);

  const prev = prevMonth(year, month);
  const prevReport = await getMonthlyReport(prev.year, prev.month);
  const settings = await getSettings();
  const openingBalance = prevReport ? prevReport.closing_balance : settings.base_savings;
  const closingBalance = openingBalance + income - cashExpense - creditExpense;

  await saveMonthlyReport({year, month, opening_balance: openingBalance, income, cash_expense: cashExpense, credit_expense: creditExpense, closing_balance: closingBalance});
  return closingBalance;
}

// 自動補產生所有尚未記錄的已過月份
export async function autoGenerateMissingReports(): Promise<void> {
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;

  // 從 2025/1 或最早交易月份開始，補到上個月
  const target = prevMonth(curYear, curMonth);

  // 從 2026/01 補到上個月
  const START_YEAR = 2026;
  const START_MONTH = 1;
  const months: {year: number; month: number}[] = [];
  let y = target.year;
  let m = target.month;
  while (y > START_YEAR || (y === START_YEAR && m >= START_MONTH)) {
    months.unshift({year: y, month: m});
    const p = prevMonth(y, m);
    y = p.year;
    m = p.month;
  }

  for (const {year, month} of months) {
    const existing = await getMonthlyReport(year, month);
    if (!existing) {
      await generateReport(year, month);
    }
  }
}

// 取得當月的即時統計（不儲存）
export async function getCurrentMonthStats(): Promise<{
  opening_balance: number;
  income: number;
  cash_expense: number;
  credit_expense: number;
  closing_balance: number;
}> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const transactions = await getTransactionsByMonth(year, month);
  const main = transactions.filter(t => t.type !== 'family_in' && t.type !== 'family_out');

  const income = main.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const cashExpense = main.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const creditExpense = main.filter(t => t.type === 'credit_card').reduce((s, t) => s + t.amount, 0);

  const prev = prevMonth(year, month);
  const prevReport = await getMonthlyReport(prev.year, prev.month);
  const settings = await getSettings();
  const openingBalance = prevReport ? prevReport.closing_balance : settings.base_savings;
  const closingBalance = openingBalance + income - cashExpense - creditExpense;

  return {opening_balance: openingBalance, income, cash_expense: cashExpense, credit_expense: creditExpense, closing_balance: closingBalance};
}

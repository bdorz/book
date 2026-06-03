import { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { useStore } from '@/store';
import {
  getCurrentPeriod,
  formatPeriod,
  isInPeriod,
  getDayGreeting,
  getWeekdayStr,
} from '@/utils/dateUtils';
import { getCategoryColor } from '@/constants/categories';
import DonutChart from '@/components/DonutChart';
import type { DonutSlice } from '@/components/DonutChart';
import StatCard from '@/components/StatCard';
import BudgetProgress from '@/components/BudgetProgress';
import TransactionItem from '@/components/TransactionItem';

export default function HomeScreen() {
  const { transactions, settings, updateSavingsBase } = useStore();
  const today = new Date();

  const period = useMemo(
    () => getCurrentPeriod(settings.periodStartDay),
    [settings.periodStartDay]
  );

  const periodTransactions = useMemo(
    () => transactions.filter((t) => isInPeriod(t.date, period)),
    [transactions, period]
  );

  const regularExpensesTotal = settings.regularExpenses.reduce(
    (sum, e) => sum + e.amount,
    0
  );

  const periodExpenses = useMemo(
    () =>
      periodTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0),
    [periodTransactions]
  );

  const creditCardSpending = useMemo(
    () =>
      periodTransactions
        .filter((t) => t.type === 'expense' && t.paymentMethod === 'credit_card')
        .reduce((sum, t) => sum + t.amount, 0),
    [periodTransactions]
  );

  const periodIncome = useMemo(
    () =>
      periodTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0),
    [periodTransactions]
  );

  const cashExpenses = useMemo(
    () =>
      periodTransactions
        .filter((t) => t.type === 'expense' && t.paymentMethod === 'cash')
        .reduce((sum, t) => sum + t.amount, 0),
    [periodTransactions]
  );

  const cashOnHand = periodIncome - cashExpenses;
  const periodBalance = periodIncome - periodExpenses;
  const currentSavings = settings.savingsBase + periodBalance;

  const expenseSlices: DonutSlice[] = useMemo(() => {
    const map: Record<string, number> = {};
    periodTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map).map(([label, value]) => ({
      label,
      value,
      color: getCategoryColor(label),
    }));
  }, [periodTransactions]);

  const creditCardSlices: DonutSlice[] = useMemo(() => {
    const map: Record<string, number> = {};
    periodTransactions
      .filter((t) => t.type === 'expense' && t.paymentMethod === 'credit_card')
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map).map(([label, value]) => ({
      label,
      value,
      color: getCategoryColor(label),
    }));
  }, [periodTransactions]);

  const recentTransactions = periodTransactions.slice(0, 5);

  const handleUpdateBase = () => {
    Alert.alert(
      '更新存款基準',
      `將存款基準更新為目前的當前存款 NT$${currentSavings.toLocaleString()}？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          onPress: () => updateSavingsBase(currentSavings),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.dateText}>
              {today.getFullYear()}年{today.getMonth() + 1}月{today.getDate()}日{' '}
              {getWeekdayStr()}
            </Text>
            <Text style={styles.greeting}>
              你好，{settings.userName}！{getDayGreeting()}！今天也要加油 ☀️
            </Text>
          </View>
          <View style={styles.savingsBadge}>
            <Text style={styles.badgeLabel}>存款（自動）</Text>
            <Text style={styles.badgeAmount}>
              NT${currentSavings.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* ── Period ── */}
        <View style={styles.periodRow}>
          <Text style={styles.periodText}>
            📅 本期 {formatPeriod(period)}
          </Text>
        </View>

        {/* ── 4 Stat Cards ── */}
        <View style={styles.statsRow}>
          <StatCard
            title="定期支出"
            amount={regularExpensesTotal}
            amountColor="#EF4444"
            iconName="repeat-outline"
            iconColor="#EF4444"
          />
          <View style={styles.cardGap} />
          <StatCard
            title="預估收入"
            amount={settings.estimatedIncome}
            amountColor="#1F2937"
            iconName="trending-up-outline"
            iconColor="#22C55E"
          />
        </View>
        <View style={[styles.statsRow, styles.statsRowGap]}>
          <StatCard
            title="刷卡"
            amount={creditCardSpending}
            amountColor="#3B82F6"
            iconName="card-outline"
            iconColor="#3B82F6"
          />
          <View style={styles.cardGap} />
          <StatCard
            title="現金手存"
            amount={Math.max(cashOnHand, 0)}
            amountColor="#22C55E"
            iconName="cash-outline"
            iconColor="#22C55E"
          />
        </View>

        {/* ── Savings Card ── */}
        <TouchableOpacity onPress={handleUpdateBase} activeOpacity={0.85}>
          <LinearGradient
            colors={['#EAE6FF', '#D8D0FC']}
            style={styles.savingsCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.savingsLeft}>
              <Text style={styles.savingsLabel}>當前存款（自動計算）</Text>
              <Text style={styles.savingsAmount}>
                NT${currentSavings.toLocaleString()}
              </Text>
              <Text style={styles.savingsSub}>
                存款基準 + 本期結餘 ｜ 點擊更新基準
              </Text>
            </View>
            <Text style={styles.piggy}>🐷</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Budget Progress ── */}
        <BudgetProgress
          spent={periodExpenses}
          budget={settings.monthlyBudget}
          totalDays={period.totalDays}
          daysElapsed={period.daysElapsed}
        />

        {/* ── Quick Actions ── */}
        <Text style={styles.sectionTitle}>快捷操作</Text>
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/add-expense')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionPlus}>+</Text>
            <Text style={[styles.actionLabel, { color: '#EF4444' }]}>新增支出</Text>
            <Text style={styles.actionEmoji}>☕🛒</Text>
          </TouchableOpacity>
          <View style={styles.cardGap} />
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/add-income')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionPlus}>+</Text>
            <Text style={[styles.actionLabel, { color: '#3B82F6' }]}>新增收入</Text>
            <Text style={styles.actionEmoji}>💰🤝</Text>
          </TouchableOpacity>
        </View>

        {/* ── Charts ── */}
        <View style={[styles.statsRow, styles.statsRowGap]}>
          {/* Expense categories */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>支出分類</Text>
            <View style={styles.chartInner}>
              <DonutChart data={expenseSlices} size={90} strokeWidth={20} />
              <View style={styles.legend}>
                {expenseSlices.slice(0, 4).map((item, i) => {
                  const pct =
                    periodExpenses > 0
                      ? Math.round((item.value / periodExpenses) * 100)
                      : 0;
                  return (
                    <View key={i} style={styles.legendRow}>
                      <View
                        style={[styles.legendDot, { backgroundColor: item.color }]}
                      />
                      <Text style={styles.legendLabel} numberOfLines={1}>
                        {item.label}
                      </Text>
                      <Text style={styles.legendPct}>({pct}%)</Text>
                    </View>
                  );
                })}
                {expenseSlices.length === 0 && (
                  <Text style={styles.noData}>暫無資料</Text>
                )}
              </View>
            </View>
          </View>
          <View style={styles.cardGap} />
          {/* Credit card categories */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>{settings.creditCardName}卡分類</Text>
            <View style={styles.chartInner}>
              <DonutChart data={creditCardSlices} size={90} strokeWidth={20} />
              <View style={styles.legend}>
                {creditCardSlices.slice(0, 4).map((item, i) => {
                  const pct =
                    creditCardSpending > 0
                      ? Math.round((item.value / creditCardSpending) * 100)
                      : 0;
                  return (
                    <View key={i} style={styles.legendRow}>
                      <View
                        style={[styles.legendDot, { backgroundColor: item.color }]}
                      />
                      <Text style={styles.legendLabel} numberOfLines={1}>
                        {item.label}
                      </Text>
                      <Text style={styles.legendPct}>({pct}%)</Text>
                    </View>
                  );
                })}
                {creditCardSlices.length === 0 && (
                  <Text style={styles.noData}>暫無資料</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* ── Recent Transactions ── */}
        <View style={styles.transCard}>
          <View style={styles.transHeader}>
            <Text style={styles.sectionTitle}>本期明細</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
              <Text style={styles.seeAll}>查看全部 →</Text>
            </TouchableOpacity>
          </View>
          {recentTransactions.length === 0 ? (
            <Text style={styles.emptyText}>本期尚無交易記錄</Text>
          ) : (
            recentTransactions.map((t) => (
              <TransactionItem key={t.id} transaction={t} showDelete />
            ))
          )}
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_RADIUS = 16;
const SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 2,
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F5F8',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
  },
  dateText: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },
  greeting: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 24,
  },
  savingsBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'flex-end',
    ...SHADOW,
  },
  badgeLabel: {
    fontSize: 10,
    color: '#888',
  },
  badgeAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },

  // Period
  periodRow: {
    marginBottom: 14,
  },
  periodText: {
    fontSize: 13,
    color: '#555',
  },

  // Stats grid
  statsRow: {
    flexDirection: 'row',
  },
  statsRowGap: {
    marginTop: 10,
    marginBottom: 14,
  },
  cardGap: {
    width: 10,
  },

  // Savings card
  savingsCard: {
    borderRadius: CARD_RADIUS,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    ...SHADOW,
  },
  savingsLeft: {
    flex: 1,
  },
  savingsLabel: {
    fontSize: 12,
    color: '#7C5FBB',
    marginBottom: 4,
  },
  savingsAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4B2D8A',
    marginBottom: 4,
  },
  savingsSub: {
    fontSize: 11,
    color: '#9575CD',
  },
  piggy: {
    fontSize: 48,
  },

  // Quick actions
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_RADIUS,
    paddingVertical: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...SHADOW,
  },
  actionPlus: {
    fontSize: 18,
    fontWeight: '300',
    color: '#888',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  actionEmoji: {
    fontSize: 16,
  },

  // Charts
  chartCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_RADIUS,
    padding: 12,
    ...SHADOW,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  chartInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legend: {
    flex: 1,
    gap: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: '#555',
    flex: 1,
  },
  legendPct: {
    fontSize: 11,
    color: '#888',
  },
  noData: {
    fontSize: 11,
    color: '#AAA',
  },

  // Transactions
  transCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_RADIUS,
    padding: 14,
    marginTop: 14,
    ...SHADOW,
  },
  transHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  seeAll: {
    fontSize: 13,
    color: '#7C6EE6',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 13,
    color: '#AAA',
    textAlign: 'center',
    paddingVertical: 16,
  },

  bottomPad: {
    height: 24,
  },
});

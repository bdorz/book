import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {CompositeNavigationProp} from '@react-navigation/native';
import {RootStackParamList, TabParamList, Transaction} from '../types';
import {Colors, CategoryColors} from '../constants/colors';
import {getTransactionsByMonth, getAllTransactions, getSettings} from '../storage/database';
import StatCard from '../components/StatCard';
import DonutChart from '../components/DonutChart';
import TransactionItem from '../components/TransactionItem';

type NavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return '早安';
  if (h >= 12 && h < 18) return '午安';
  return '晚上好';
}

function getTimeEmoji(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return '☀️';
  if (h >= 12 && h < 18) return '🌤️';
  return '🌙';
}

function formatDate(date: Date): string {
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
}

function buildChartSegments(transactions: Transaction[], type: 'expense' | 'credit_card') {
  const filtered = transactions.filter(t => t.type === type);
  const map = new Map<string, number>();
  filtered.forEach(t => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
  return Array.from(map.entries()).map(([label, value]) => ({
    label,
    value,
    color: CategoryColors[label] ?? '#636E72',
  }));
}

export default function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [baseSavings, setBaseSavings] = useState(0);
  const [fixedExpense, setFixedExpense] = useState(0);
  const [estimatedIncome, setEstimatedIncome] = useState(0);
  const [userName, setUserName] = useState('');


  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = now.getDate();
  const lastDay = new Date(year, month, 0).getDate();
  const daysLeft = lastDay - today;

  useFocusEffect(
    useCallback(() => {
      getTransactionsByMonth(year, month).then(ts => {
        setTransactions(ts.filter(t => t.type !== 'family_in' && t.type !== 'family_out'));
      });
      // 存款跨月累積，需要全部交易
      getAllTransactions().then(all => {
        setAllTransactions(all.filter(t => t.type !== 'family_in' && t.type !== 'family_out'));
      });
      getSettings().then(s => {
        setBaseSavings(s.base_savings);
        setFixedExpense(s.fixed_expenses.reduce((sum, i) => sum + i.amount, 0));
        setEstimatedIncome(s.estimated_incomes.reduce((sum, i) => sum + i.amount, 0));
        setUserName(s.user_name);
      });
    }, [month, year]),
  );

  // 當月統計（統計卡用）
  const actualExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const actualIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const creditCard = transactions
    .filter(t => t.type === 'credit_card')
    .reduce((s, t) => s + t.amount, 0);
  const cashBalance = actualIncome - actualExpense;

  // 累積存款（跨所有月份，不會因換月重置）
  const allIncome = allTransactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const allExpense = allTransactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const allCredit = allTransactions
    .filter(t => t.type === 'credit_card')
    .reduce((s, t) => s + t.amount, 0);
  const currentSavings = baseSavings + allIncome - allExpense - allCredit;

  const totalExpense = actualExpense + creditCard;
  const baseForRatio = estimatedIncome > 0 ? estimatedIncome : (actualIncome || 1);
  const expenseRatio = Math.min(totalExpense / baseForRatio, 1);

  const expenseSegments = buildChartSegments(transactions, 'expense');
  const creditSegments = buildChartSegments(transactions, 'credit_card');
  const recentTransactions = transactions.slice(0, 5);

  const goToAdd = (type: 'expense' | 'income' | 'credit_card') => {
    navigation.navigate('AddEditTransaction', {initialType: type});
  };

  const goToEdit = (t: Transaction) => {
    navigation.navigate('AddEditTransaction', {transactionId: t.id});
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.dateText}>{formatDate(now)}</Text>
            <Text style={styles.greetText}>
              {userName ? `你好，${userName}！` : '你好！'}{getGreeting()}！今天也要加油
            </Text>
            <Text style={styles.emoji}>{getTimeEmoji()}</Text>
          </View>
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsBadgeLabel}>盒存款(自動)</Text>
            <Text style={styles.savingsBadgeAmount}>
              NT${currentSavings.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Period */}
        <View style={styles.periodRow}>
          <Icon name="calendar-month" size={14} color={Colors.textSecondary} />
          <Text style={styles.periodText}>
            {'  '}本月 {month}/1 ~ {month}/{lastDay}
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard title="定期支出" amount={fixedExpense} icon="wallet-outline" color={Colors.expense} />
            <StatCard title="預估收入" amount={estimatedIncome} icon="trending-up" color={Colors.income} />
          </View>
          <View style={styles.statsRow}>
            <StatCard title="刷卡" amount={creditCard} icon="credit-card-outline" color={Colors.creditCard} />
            <StatCard title="現金手存" amount={cashBalance} icon="cash" color={cashBalance >= 0 ? Colors.income : Colors.expense} />
          </View>
        </View>

        {/* Savings Card */}
        <View style={styles.savingsCard}>
          <View>
            <Text style={styles.savingsLabel}>當前存款（自動計算）</Text>
            <Text style={styles.savingsAmount}>
              NT${currentSavings.toLocaleString()}
            </Text>
            <Text style={styles.savingsHint}>存款基準 + 本月結餘</Text>
          </View>
          <Icon name="piggy-bank" size={56} color="rgba(255,255,255,0.3)" />
        </View>

        {/* Monthly Expense Bar */}
        <View style={styles.card}>
          <View style={styles.expenseBarHeader}>
            <Text style={styles.sectionTitle}>每月總支出（第{today}/{lastDay}天）</Text>
            <Text style={styles.daysLeft}>剩{daysLeft}天</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, {width: `${expenseRatio * 100}%`}]} />
          </View>
          <View style={styles.expenseBarFooter}>
            <Text style={styles.expenseUsed}>已用 NT${totalExpense.toLocaleString()}</Text>
            <Text style={styles.expenseIncome}>收入 NT${actualIncome.toLocaleString()}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.expenseBtn]} onPress={() => goToAdd('expense')} activeOpacity={0.8}>
            <Icon name="plus" size={18} color={Colors.expense} />
            <Text style={[styles.actionBtnText, {color: Colors.expense}]}> 新增支出</Text>
            <Text style={styles.actionBtnEmoji}> 🍜🛒</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.incomeBtn]} onPress={() => goToAdd('income')} activeOpacity={0.8}>
            <Icon name="plus" size={18} color={Colors.income} />
            <Text style={[styles.actionBtnText, {color: Colors.income}]}> 新增收入</Text>
            <Text style={styles.actionBtnEmoji}> 💰🤝</Text>
          </TouchableOpacity>
        </View>

        {/* Charts */}
        <View style={[styles.card, styles.chartsRow]}>
          <DonutChart title="支出分類" segments={expenseSegments} size={110} />
          <View style={styles.chartDivider} />
          <DonutChart title="信用卡分類" segments={creditSegments} size={110} />
        </View>

        {/* Recent Transactions */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>本月明細</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.seeAll}>查看全部</Text>
            </TouchableOpacity>
          </View>
          {recentTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="receipt" size={40} color={Colors.border} />
              <Text style={styles.emptyText}>本月尚無記錄</Text>
            </View>
          ) : (
            recentTransactions.map(t => (
              <TransactionItem key={t.id} transaction={t} onPress={goToEdit} />
            ))
          )}
        </View>

        {/* Bottom Padding */}
        <View style={{height: 20}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: Colors.background},
  scroll: {flex: 1},
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {flex: 1},
  dateText: {fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4},
  greetText: {fontSize: 15, fontWeight: '700', color: '#fff', lineHeight: 22},
  emoji: {fontSize: 22, marginTop: 4},
  savingsBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 90,
  },
  savingsBadgeLabel: {fontSize: 10, color: 'rgba(255,255,255,0.8)', marginBottom: 2},
  savingsBadgeAmount: {fontSize: 14, fontWeight: '700', color: '#fff'},
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginTop: -8,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  periodText: {fontSize: 12, color: Colors.textSecondary},
  statsGrid: {marginHorizontal: 12, marginTop: 12},
  statsRow: {flexDirection: 'row'},
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  savingsCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  savingsLabel: {fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 6},
  savingsAmount: {fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4},
  savingsHint: {fontSize: 11, color: 'rgba(255,255,255,0.6)'},
  expenseBarHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10},
  sectionTitle: {fontSize: 14, fontWeight: '600', color: Colors.textPrimary},
  daysLeft: {fontSize: 12, color: Colors.textSecondary},
  progressBg: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.expense,
    borderRadius: 4,
    minWidth: 4,
  },
  expenseBarFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  expenseUsed: {fontSize: 12, color: Colors.expense, fontWeight: '600'},
  expenseIncome: {fontSize: 12, color: Colors.textSecondary},
  actionsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  expenseBtn: {
    backgroundColor: Colors.expense + '10',
    borderColor: Colors.expense + '40',
  },
  incomeBtn: {
    backgroundColor: Colors.income + '10',
    borderColor: Colors.income + '40',
  },
  actionBtnText: {fontSize: 14, fontWeight: '700'},
  actionBtnEmoji: {fontSize: 14},
  chartsRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  chartDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
    alignSelf: 'stretch',
  },
  recentSection: {marginHorizontal: 16, marginTop: 16},
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  seeAll: {fontSize: 13, color: Colors.primary, fontWeight: '600'},
  emptyState: {alignItems: 'center', paddingVertical: 24},
  emptyText: {fontSize: 14, color: Colors.textLight, marginTop: 8},
});

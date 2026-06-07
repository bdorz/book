import React, {useState, useCallback, useMemo} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {CompositeNavigationProp} from '@react-navigation/native';
import {RootStackParamList, TabParamList, Transaction} from '../types';
import {CategoryColors} from '../constants/colors';
import {useColors, AppColors} from '../context/ThemeContext';
import {getTransactionsByMonth, getAllTransactions, getSettings} from '../storage/database';
import StatCard from '../components/StatCard';
import DonutChart from '../components/DonutChart';
import TransactionItem from '../components/TransactionItem';

type NavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) {return '早安';}
  if (h >= 12 && h < 18) {return '午安';}
  return '晚上好';
}

function getTimeEmoji() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) {return '☀️';}
  if (h >= 12 && h < 18) {return '🌤️';}
  return '🌙';
}

function formatDate(date: Date) {
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
}

function buildChartSegments(transactions: Transaction[], type: 'expense' | 'credit_card') {
  const filtered = transactions.filter(t => t.type === type);
  const map = new Map<string, number>();
  filtered.forEach(t => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
  return Array.from(map.entries()).map(([label, value]) => ({label, value, color: CategoryColors[label] ?? '#636E72'}));
}

export default function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [baseSavings, setBaseSavings] = useState(0);
  const [fixedExpense, setFixedExpense] = useState(0);
  const [estimatedIncome, setEstimatedIncome] = useState(0);
  const [userName, setUserName] = useState('');
  const [selectedExpCat, setSelectedExpCat] = useState<string | null>(null);
  const [selectedCCCat, setSelectedCCCat] = useState<string | null>(null);
  const [catModal, setCatModal] = useState<{type: 'expense' | 'credit_card'; label: string} | null>(null);

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

  const actualExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const actualIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const creditCard = transactions.filter(t => t.type === 'credit_card').reduce((s, t) => s + t.amount, 0);
  const cashBalance = actualIncome - actualExpense;
  const allIncome = allTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const allExpense = allTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const allCredit = allTransactions.filter(t => t.type === 'credit_card').reduce((s, t) => s + t.amount, 0);
  const currentSavings = baseSavings + allIncome - allExpense - allCredit;
  const totalExpense = actualExpense + creditCard;
  const expenseRatio = Math.min(totalExpense / (estimatedIncome > 0 ? estimatedIncome : actualIncome || 1), 1);

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.dateText}>{formatDate(now)}</Text>
            <Text style={styles.greetText}>{userName ? `你好，${userName}！` : '你好！'}{getGreeting()}！今天也要加油</Text>
            <Text style={styles.emoji}>{getTimeEmoji()}</Text>
          </View>
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsBadgeLabel}>盒存款(自動)</Text>
            <Text style={styles.savingsBadgeAmount}>NT${currentSavings.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.periodRow}>
          <Icon name="calendar-month" size={14} color={colors.textSecondary} />
          <Text style={styles.periodText}>{'  '}本月 {month}/1 ~ {month}/{lastDay}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard title="定期支出" amount={fixedExpense} icon="wallet-outline" color={colors.expense} />
            <StatCard title="預估收入" amount={estimatedIncome} icon="trending-up" color={colors.income} />
          </View>
          <View style={styles.statsRow}>
            <StatCard title="刷卡" amount={creditCard} icon="credit-card-outline" color={colors.creditCard} />
            <StatCard title="現金手存" amount={cashBalance} icon="cash" color={cashBalance >= 0 ? colors.income : colors.expense} />
          </View>
        </View>

        <View style={[styles.savingsCard, {backgroundColor: colors.primary}]}>
          <View>
            <Text style={styles.savingsLabel}>當前存款（自動計算）</Text>
            <Text style={styles.savingsAmount}>NT${currentSavings.toLocaleString()}</Text>
            <Text style={styles.savingsHint}>存款基準 + 本月結餘</Text>
          </View>
          <Icon name="piggy-bank" size={56} color="rgba(255,255,255,0.3)" />
        </View>

        <View style={styles.card}>
          <View style={styles.expenseBarHeader}>
            <Text style={styles.sectionTitle}>每月總支出（第{today}/{lastDay}天）</Text>
            <Text style={styles.daysLeft}>剩{daysLeft}天</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, {width: `${expenseRatio * 100}%`, backgroundColor: colors.expense}]} />
          </View>
          <View style={styles.expenseBarFooter}>
            <Text style={[styles.expenseUsed, {color: colors.expense}]}>已用 NT${totalExpense.toLocaleString()}</Text>
            <Text style={styles.expenseIncome}>收入 NT${actualIncome.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, {backgroundColor: colors.expense + '10', borderColor: colors.expense + '40'}]} onPress={() => navigation.navigate('AddEditTransaction', {initialType: 'expense'})} activeOpacity={0.8}>
            <Icon name="plus" size={18} color={colors.expense} />
            <Text style={[styles.actionBtnText, {color: colors.expense}]}> 新增支出</Text>
            <Text style={styles.actionBtnEmoji}> 🍜🛒</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, {backgroundColor: colors.income + '10', borderColor: colors.income + '40'}]} onPress={() => navigation.navigate('AddEditTransaction', {initialType: 'income'})} activeOpacity={0.8}>
            <Icon name="plus" size={18} color={colors.income} />
            <Text style={[styles.actionBtnText, {color: colors.income}]}> 新增收入</Text>
            <Text style={styles.actionBtnEmoji}> 💰🤝</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, styles.chartsRow]}>
          <DonutChart
            title="支出分類"
            segments={buildChartSegments(transactions, 'expense')}
            size={110}
            selectedLabel={selectedExpCat ?? undefined}
            onSegmentPress={label => {
              if (selectedExpCat === label) {
                setSelectedExpCat(null);
              } else {
                setSelectedExpCat(label);
                setSelectedCCCat(null);
                setCatModal({type: 'expense', label});
              }
            }}
          />
          <View style={styles.chartDivider} />
          <DonutChart
            title="信用卡分類"
            segments={buildChartSegments(transactions, 'credit_card')}
            size={110}
            selectedLabel={selectedCCCat ?? undefined}
            onSegmentPress={label => {
              if (selectedCCCat === label) {
                setSelectedCCCat(null);
              } else {
                setSelectedCCCat(label);
                setSelectedExpCat(null);
                setCatModal({type: 'credit_card', label});
              }
            }}
          />
        </View>

        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>本月明細</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={[styles.seeAll, {color: colors.primary}]}>查看全部</Text>
            </TouchableOpacity>
          </View>
          {transactions.slice(0, 5).length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="receipt" size={40} color={colors.border} />
              <Text style={styles.emptyText}>本月尚無記錄</Text>
            </View>
          ) : (
            transactions.slice(0, 5).map(t => (
              <TransactionItem key={t.id} transaction={t} onPress={tx => navigation.navigate('AddEditTransaction', {transactionId: tx.id})} />
            ))
          )}
        </View>

        <View style={{height: 20}} />
      </ScrollView>

      <Modal visible={!!catModal} animationType="slide" transparent onRequestClose={() => { setCatModal(null); setSelectedExpCat(null); setSelectedCCCat(null); }}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => { setCatModal(null); setSelectedExpCat(null); setSelectedCCCat(null); }}>
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>{catModal?.label}</Text>
              <TouchableOpacity onPress={() => { setCatModal(null); setSelectedExpCat(null); setSelectedCCCat(null); }}>
                <Icon name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {transactions
                .filter(t => catModal && t.type === catModal.type && t.category === catModal.label)
                .map(t => (
                  <TransactionItem
                    key={t.id}
                    transaction={t}
                    onPress={tx => {
                      setCatModal(null);
                      setSelectedExpCat(null);
                      setSelectedCCCat(null);
                      navigation.navigate('AddEditTransaction', {transactionId: tx.id});
                    }}
                  />
                ))}
              <View style={{height: 20}} />
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: {flex: 1, backgroundColor: c.background},
    scroll: {flex: 1},
    header: {backgroundColor: c.primary, paddingTop: 16, paddingBottom: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between'},
    headerLeft: {flex: 1},
    dateText: {fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4},
    greetText: {fontSize: 15, fontWeight: '700', color: '#fff', lineHeight: 22},
    emoji: {fontSize: 22, marginTop: 4},
    savingsBadge: {backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', minWidth: 90},
    savingsBadgeLabel: {fontSize: 10, color: 'rgba(255,255,255,0.8)', marginBottom: 2},
    savingsBadgeAmount: {fontSize: 14, fontWeight: '700', color: '#fff'},
    periodRow: {flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, marginHorizontal: 16, marginTop: -8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, elevation: 2, shadowColor: c.shadow, shadowOffset: {width: 0, height: 1}, shadowOpacity: 1, shadowRadius: 4},
    periodText: {fontSize: 12, color: c.textSecondary},
    statsGrid: {marginHorizontal: 12, marginTop: 12},
    statsRow: {flexDirection: 'row'},
    card: {backgroundColor: c.card, borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 12, elevation: 2, shadowColor: c.shadow, shadowOffset: {width: 0, height: 2}, shadowOpacity: 1, shadowRadius: 6},
    savingsCard: {borderRadius: 16, padding: 20, marginHorizontal: 16, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 4, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.4, shadowRadius: 8},
    savingsLabel: {fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 6},
    savingsAmount: {fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4},
    savingsHint: {fontSize: 11, color: 'rgba(255,255,255,0.6)'},
    expenseBarHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10},
    sectionTitle: {fontSize: 14, fontWeight: '600', color: c.textPrimary},
    daysLeft: {fontSize: 12, color: c.textSecondary},
    progressBg: {height: 8, backgroundColor: c.border, borderRadius: 4, overflow: 'hidden'},
    progressFill: {height: '100%', borderRadius: 4, minWidth: 4},
    expenseBarFooter: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 6},
    expenseUsed: {fontSize: 12, fontWeight: '600'},
    expenseIncome: {fontSize: 12, color: c.textSecondary},
    actionsRow: {flexDirection: 'row', marginHorizontal: 16, marginTop: 12, gap: 10},
    actionBtn: {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5},
    actionBtnText: {fontSize: 14, fontWeight: '700'},
    actionBtnEmoji: {fontSize: 14},
    chartsRow: {flexDirection: 'row', paddingVertical: 12, alignItems: 'flex-start'},
    chartDivider: {width: 1, backgroundColor: c.border, marginHorizontal: 8, alignSelf: 'stretch'},
    recentSection: {marginHorizontal: 16, marginTop: 16},
    recentHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10},
    seeAll: {fontSize: 13, fontWeight: '600'},
    emptyState: {alignItems: 'center', paddingVertical: 24},
    emptyText: {fontSize: 14, color: c.textLight, marginTop: 8},
    modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end'},
    modalSheet: {backgroundColor: c.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingBottom: 0, maxHeight: '70%'},
    modalHandle: {width: 40, height: 4, backgroundColor: c.border, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 12},
    modalTitleRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12},
    modalTitle: {fontSize: 16, fontWeight: '700', color: c.textPrimary},
  });
}

import React, {useState, useCallback, useMemo} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RootStackParamList, Transaction, TransactionType} from '../types';
import {useColors, AppColors} from '../context/ThemeContext';
import {getAllTransactions} from '../storage/database';
import TransactionItem from '../components/TransactionItem';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const FILTERS: {key: TransactionType | 'all'; label: string}[] = [
  {key: 'all', label: '全部'},
  {key: 'expense', label: '支出'},
  {key: 'income', label: '收入'},
  {key: 'credit_card', label: '刷卡'},
];

export default function TransactionsScreen() {
  const navigation = useNavigation<NavProp>();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<TransactionType | 'all'>('all');

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  useFocusEffect(
    useCallback(() => {
      getAllTransactions().then(all => {
        setTransactions(all.filter(t => t.type !== 'family_in' && t.type !== 'family_out'));
      });
    }, []),
  );

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);

  const thisMonth = filtered.filter(t => {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return t.date.startsWith(prefix);
  });

  const totalExpense = thisMonth.filter(t => t.type === 'expense' || t.type === 'credit_card').reduce((s, t) => s + t.amount, 0);
  const totalIncome = thisMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  const grouped = new Map<string, Transaction[]>();
  filtered.forEach(t => {
    const [y, m] = t.date.split('-');
    const key = `${y}-${m}`;
    if (!grouped.has(key)) {grouped.set(key, []);}
    grouped.get(key)!.push(t);
  });
  const sections = Array.from(grouped.entries()).sort(([a], [b]) => b.localeCompare(a));

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>全部記錄</Text>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>本月支出</Text>
          <Text style={[styles.summaryAmount, {color: colors.expense}]}>-NT${totalExpense.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>本月收入</Text>
          <Text style={[styles.summaryAmount, {color: colors.income}]}>+NT${totalIncome.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>本月結餘</Text>
          <Text style={[styles.summaryAmount, {color: totalIncome - totalExpense >= 0 ? colors.income : colors.expense}]}>
            NT${(totalIncome - totalExpense).toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && {backgroundColor: colors.primary, borderColor: colors.primary}]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.7}>
            <Text style={[styles.filterText, filter === f.key && {color: '#fff'}]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="receipt" size={48} color={colors.border} />
          <Text style={styles.emptyText}>暫無記錄</Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={([key]) => key}
          contentContainerStyle={styles.listContent}
          renderItem={({item: [monthKey, items]}) => {
            const [y, m] = monthKey.split('-');
            return (
              <View style={styles.monthSection}>
                <Text style={styles.monthLabel}>{y}年{parseInt(m, 10)}月</Text>
                {items.map(t => (
                  <TransactionItem key={t.id} transaction={t} onPress={tx => navigation.navigate('AddEditTransaction', {transactionId: tx.id})} />
                ))}
              </View>
            );
          }}
        />
      )}

      <TouchableOpacity style={[styles.fab, {backgroundColor: colors.primary, shadowColor: colors.primary}]} onPress={() => navigation.navigate('AddEditTransaction', {initialType: 'expense'})} activeOpacity={0.85}>
        <Icon name="plus" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: {flex: 1, backgroundColor: c.background},
    header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.card, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, elevation: 2, shadowColor: c.shadow, shadowOffset: {width: 0, height: 1}, shadowOpacity: 1, shadowRadius: 3},
    headerTitle: {fontSize: 20, fontWeight: '700', color: c.textPrimary},
    summary: {flexDirection: 'row', backgroundColor: c.card, paddingVertical: 14, paddingHorizontal: 8, marginHorizontal: 16, marginTop: 12, borderRadius: 14, elevation: 2, shadowColor: c.shadow, shadowOffset: {width: 0, height: 1}, shadowOpacity: 1, shadowRadius: 4},
    summaryItem: {flex: 1, alignItems: 'center'},
    summaryDivider: {width: 1, backgroundColor: c.border},
    summaryLabel: {fontSize: 11, color: c.textSecondary, marginBottom: 4},
    summaryAmount: {fontSize: 15, fontWeight: '700'},
    filters: {flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8},
    filterChip: {paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: c.card, borderWidth: 1.5, borderColor: c.border},
    filterText: {fontSize: 13, fontWeight: '600', color: c.textSecondary},
    listContent: {paddingHorizontal: 16, paddingBottom: 80},
    monthSection: {marginBottom: 8},
    monthLabel: {fontSize: 14, fontWeight: '700', color: c.textSecondary, marginBottom: 8, marginTop: 4},
    empty: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80},
    emptyText: {fontSize: 15, color: c.textLight, marginTop: 12},
    fab: {position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.4, shadowRadius: 8},
  });
}

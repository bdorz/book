import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RootStackParamList, Transaction, TransactionType} from '../types';
import {Colors} from '../constants/colors';
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<TransactionType | 'all'>('all');

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  useFocusEffect(
    useCallback(() => {
      getAllTransactions().then(all => {
        const main = all.filter(t => t.type !== 'family_in' && t.type !== 'family_out');
        setTransactions(main);
      });
    }, []),
  );

  const filtered =
    filter === 'all'
      ? transactions
      : transactions.filter(t => t.type === filter);

  const thisMonth = filtered.filter(t => {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return t.date.startsWith(prefix);
  });

  const totalExpense = thisMonth
    .filter(t => t.type === 'expense' || t.type === 'credit_card')
    .reduce((s, t) => s + t.amount, 0);
  const totalIncome = thisMonth
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>全部記錄</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddEditTransaction', {initialType: 'expense'})}>
          <Icon name="plus" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>本月支出</Text>
          <Text style={[styles.summaryAmount, {color: Colors.expense}]}>
            -NT${totalExpense.toLocaleString()}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>本月收入</Text>
          <Text style={[styles.summaryAmount, {color: Colors.income}]}>
            +NT${totalIncome.toLocaleString()}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>本月結餘</Text>
          <Text style={[styles.summaryAmount, {color: totalIncome - totalExpense >= 0 ? Colors.income : Colors.expense}]}>
            NT${(totalIncome - totalExpense).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.7}>
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="receipt" size={48} color={Colors.border} />
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
                <Text style={styles.monthLabel}>
                  {y}年{parseInt(m, 10)}月
                </Text>
                {items.map(t => (
                  <TransactionItem
                    key={t.id}
                    transaction={t}
                    onPress={tx => navigation.navigate('AddEditTransaction', {transactionId: tx.id})}
                  />
                ))}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: Colors.background},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  headerTitle: {fontSize: 20, fontWeight: '700', color: Colors.textPrimary},
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  summaryItem: {flex: 1, alignItems: 'center'},
  summaryDivider: {width: 1, backgroundColor: Colors.border},
  summaryLabel: {fontSize: 11, color: Colors.textSecondary, marginBottom: 4},
  summaryAmount: {fontSize: 15, fontWeight: '700'},
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {fontSize: 13, fontWeight: '600', color: Colors.textSecondary},
  filterTextActive: {color: '#fff'},
  listContent: {paddingHorizontal: 16, paddingBottom: 20},
  monthSection: {marginBottom: 8},
  monthLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 4,
  },
  empty: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80},
  emptyText: {fontSize: 15, color: Colors.textLight, marginTop: 12},
});

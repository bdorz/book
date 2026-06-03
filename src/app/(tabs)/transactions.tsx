import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useStore } from '@/store';
import { getCurrentPeriod, isInPeriod, formatFullDate } from '@/utils/dateUtils';
import TransactionItem from '@/components/TransactionItem';

type Filter = 'all' | 'expense' | 'income';

export default function TransactionsScreen() {
  const { transactions, settings } = useStore();
  const [filter, setFilter] = useState<Filter>('all');

  const period = useMemo(
    () => getCurrentPeriod(settings.periodStartDay),
    [settings.periodStartDay]
  );

  const filtered = useMemo(
    () =>
      transactions
        .filter((t) => isInPeriod(t.date, period))
        .filter((t) => filter === 'all' || t.type === filter),
    [transactions, period, filter]
  );

  const totalIncome = useMemo(
    () => filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [filtered]
  );
  const totalExpense = useMemo(
    () => filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [filtered]
  );

  const sections = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    filtered.forEach((t) => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, data]) => ({ title: formatFullDate(date), data }));
  }, [filtered]);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'expense', label: '支出' },
    { key: 'income', label: '收入' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>本期明細</Text>
        <Text style={styles.subtitle}>
          收入 NT${totalIncome.toLocaleString()} ／ 支出 NT${totalExpense.toLocaleString()}
        </Text>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterLabel, filter === f.key && styles.filterLabelActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>本期尚無記錄</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index, section }) => (
            <View
              style={[
                styles.itemWrapper,
                index === 0 && styles.itemFirst,
                index === section.data.length - 1 && styles.itemLast,
              ]}
            >
              <TransactionItem transaction={item} showDelete />
            </View>
          )}
          renderSectionHeader={({ section }) => (
            <Text style={styles.dateHeader}>{section.title}</Text>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
}

const PURPLE = '#7C6EE6';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F5F8',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#EEEEF2',
  },
  filterChipActive: {
    backgroundColor: PURPLE,
  },
  filterLabel: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  filterLabelActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  dateHeader: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    paddingTop: 12,
    paddingBottom: 6,
  },
  itemWrapper: {
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  itemFirst: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  itemLast: {
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 15, color: '#AAA' },
});

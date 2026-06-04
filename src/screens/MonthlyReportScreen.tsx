import React, {useState, useCallback} from 'react';
import {View, Text, StyleSheet, FlatList, ActivityIndicator} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors} from '../constants/colors';
import {MonthlyReport} from '../types';
import {getAllMonthlyReports} from '../storage/database';
import {autoGenerateMissingReports, getCurrentMonthStats} from '../utils/monthlyReport';

interface CurrentStats {
  opening_balance: number;
  income: number;
  cash_expense: number;
  credit_expense: number;
  closing_balance: number;
}

function lastDay(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function periodLabel(year: number, month: number): string {
  const now = new Date();
  const d = lastDay(year, month);
  const yearStr = year !== now.getFullYear() ? `${year}/` : '';
  return `${yearStr}${month}/1 ~ ${yearStr}${month}/${d}`;
}

function amountColor(v: number): string {
  if (v > 0) {return Colors.income;}
  if (v < 0) {return Colors.expense;}
  return Colors.textSecondary;
}

interface StatCellProps {
  label: string;
  value: number;
  color?: string;
}

function StatCell({label, value, color}: StatCellProps) {
  return (
    <View style={cellStyles.wrap}>
      <Text style={cellStyles.label}>{label}</Text>
      <Text style={[cellStyles.value, {color: color ?? Colors.textPrimary}]}>
        NT${Math.abs(value).toLocaleString()}
      </Text>
    </View>
  );
}

const cellStyles = StyleSheet.create({
  wrap: {flex: 1, alignItems: 'center'},
  label: {fontSize: 10, color: Colors.textSecondary, marginBottom: 2},
  value: {fontSize: 13, fontWeight: '700'},
});

interface ReportCardProps {
  year: number;
  month: number;
  data: Pick<MonthlyReport, 'opening_balance' | 'income' | 'cash_expense' | 'credit_expense' | 'closing_balance'>;
  isCurrent?: boolean;
}

function ReportCard({year, month, data, isCurrent}: ReportCardProps) {
  const closing = data.closing_balance;
  return (
    <View style={[cardStyles.card, isCurrent && cardStyles.currentCard]}>
      <View style={cardStyles.header}>
        <View style={cardStyles.titleRow}>
          {isCurrent && <View style={cardStyles.dot} />}
          <Text style={cardStyles.monthTitle}>{year}年{month}月</Text>
          {isCurrent && <Text style={cardStyles.currentBadge}>本月</Text>}
        </View>
        <Text style={cardStyles.period}>{periodLabel(year, month)}</Text>
      </View>

      <View style={cardStyles.statsRow}>
        <StatCell label="月初餘額" value={data.opening_balance} color={Colors.primary} />
        <View style={cardStyles.sep} />
        <StatCell label="現金支出" value={data.cash_expense} color={Colors.expense} />
        <View style={cardStyles.sep} />
        <StatCell label="信用卡" value={data.credit_expense} color={Colors.creditCard} />
        <View style={cardStyles.sep} />
        <StatCell label="收入" value={data.income} color={Colors.income} />
      </View>

      <View style={[cardStyles.closing, {backgroundColor: amountColor(closing) + '12'}]}>
        <Text style={cardStyles.closingLabel}>月底結餘</Text>
        <Text style={[cardStyles.closingValue, {color: amountColor(closing)}]}>
          {closing < 0 ? '-' : ''}NT${Math.abs(closing).toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  currentCard: {
    borderWidth: 1.5,
    borderColor: Colors.primary + '50',
  },
  header: {padding: 14, paddingBottom: 10},
  titleRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2},
  dot: {width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.income},
  monthTitle: {fontSize: 16, fontWeight: '800', color: Colors.textPrimary},
  currentBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  period: {fontSize: 11, color: Colors.textSecondary},
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sep: {width: 1, backgroundColor: Colors.border, marginHorizontal: 2},
  closing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  closingLabel: {fontSize: 12, color: Colors.textSecondary, fontWeight: '600'},
  closingValue: {fontSize: 18, fontWeight: '800'},
});

export default function MonthlyReportScreen() {
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [currentStats, setCurrentStats] = useState<CurrentStats | null>(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([
        autoGenerateMissingReports(),
        getCurrentMonthStats(),
      ]).then(([, stats]) => {
        setCurrentStats(stats);
        return getAllMonthlyReports();
      }).then(all => {
        const sorted = [...all].sort((a, b) =>
          b.year !== a.year ? b.year - a.year : b.month - a.month,
        );
        setReports(sorted);
        setLoading(false);
      });
    }, []),
  );

  const headerSection = (
    <View style={styles.listHeader}>
      {currentStats && (
        <ReportCard
          year={curYear}
          month={curMonth}
          data={currentStats}
          isCurrent
        />
      )}
      {reports.length > 0 && (
        <Text style={styles.historyLabel}>歷史紀錄</Text>
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Icon name="chart-line" size={22} color="#fff" />
        <Text style={styles.headerTitle}>月結報表</Text>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>自動計算中...</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={r => r.id}
          ListHeaderComponent={headerSection}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Icon name="calendar-blank-outline" size={40} color={Colors.border} />
              <Text style={styles.emptyText}>尚無歷史月結記錄</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          renderItem={({item}) => (
            <ReportCard
              year={item.year}
              month={item.month}
              data={item}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: Colors.background},
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
  },
  headerTitle: {fontSize: 20, fontWeight: '800', color: '#fff'},
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12},
  loadingText: {fontSize: 14, color: Colors.textSecondary},
  listContent: {paddingTop: 16, paddingBottom: 30},
  listHeader: {marginBottom: 4},
  historyLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginHorizontal: 20,
    marginBottom: 10,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  emptyWrap: {alignItems: 'center', paddingTop: 20, gap: 8},
  emptyText: {fontSize: 14, color: Colors.textLight},
});

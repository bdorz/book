import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
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

interface YearSection {
  year: number;
  data: MonthlyReport[];
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

function StatCell({label, value, color}: {label: string; value: number; color?: string}) {
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

function ReportCard({
  year,
  month,
  data,
  isCurrent,
}: {
  year: number;
  month: number;
  data: Pick<MonthlyReport, 'opening_balance' | 'income' | 'cash_expense' | 'credit_expense' | 'closing_balance'>;
  isCurrent?: boolean;
}) {
  const closing = data.closing_balance;
  return (
    <View style={[cardStyles.card, isCurrent && cardStyles.currentCard]}>
      <View style={cardStyles.header}>
        <View style={cardStyles.titleRow}>
          {isCurrent && <View style={cardStyles.dot} />}
          <Text style={cardStyles.monthTitle}>{year}年{month}月</Text>
          {isCurrent && (
            <Text style={cardStyles.currentBadge}>本月</Text>
          )}
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
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  currentCard: {borderWidth: 1.5, borderColor: Colors.primary + '50'},
  header: {padding: 14, paddingBottom: 10},
  titleRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2},
  dot: {width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.income},
  monthTitle: {fontSize: 16, fontWeight: '800', color: Colors.textPrimary},
  currentBadge: {
    fontSize: 10, fontWeight: '700', color: Colors.primary,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  period: {fontSize: 11, color: Colors.textSecondary},
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  sep: {width: 1, backgroundColor: Colors.border, marginHorizontal: 2},
  closing: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  closingLabel: {fontSize: 12, color: Colors.textSecondary, fontWeight: '600'},
  closingValue: {fontSize: 18, fontWeight: '800'},
});

export default function MonthlyReportScreen() {
  const [sections, setSections] = useState<YearSection[]>([]);
  const [currentStats, setCurrentStats] = useState<CurrentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedYears, setExpandedYears] = useState<Set<number>>(
    new Set([new Date().getFullYear()]),
  );

  const curYear = new Date().getFullYear();
  const curMonth = new Date().getMonth() + 1;

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([autoGenerateMissingReports(), getCurrentMonthStats()])
        .then(([, stats]) => {
          setCurrentStats(stats);
          return getAllMonthlyReports();
        })
        .then(all => {
          // 依年份分組，年份降冪，月份降冪
          const byYear = new Map<number, MonthlyReport[]>();
          all.forEach(r => {
            if (!byYear.has(r.year)) {byYear.set(r.year, []);}
            byYear.get(r.year)!.push(r);
          });
          const sorted: YearSection[] = Array.from(byYear.entries())
            .sort(([a], [b]) => b - a)
            .map(([year, data]) => ({
              year,
              data: [...data].sort((a, b) => b.month - a.month),
            }));
          setSections(sorted);
          setLoading(false);
        });
    }, []),
  );

  const toggleYear = (year: number) => {
    setExpandedYears(prev => {
      const next = new Set(prev);
      if (next.has(year)) {next.delete(year);} else {next.add(year);}
      return next;
    });
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <Icon name="chart-bar" size={22} color="#fff" />
          <Text style={styles.headerTitle}>月結報表</Text>
        </View>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>自動計算中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Icon name="chart-bar" size={22} color="#fff" />
        <Text style={styles.headerTitle}>月結報表</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          currentStats ? (
            <View style={styles.currentWrap}>
              <ReportCard year={curYear} month={curMonth} data={currentStats} isCurrent />
              {sections.length > 0 && (
                <Text style={styles.historyLabel}>歷史紀錄</Text>
              )}
            </View>
          ) : null
        }
        renderSectionHeader={({section}) => {
          const isExpanded = expandedYears.has(section.year);
          const yearTotal = section.data.reduce((s, r) => s + r.income - r.cash_expense - r.credit_expense, 0);
          return (
            <TouchableOpacity
              style={styles.yearHeader}
              onPress={() => toggleYear(section.year)}
              activeOpacity={0.7}>
              <Icon
                name={isExpanded ? 'chevron-down' : 'chevron-right'}
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.yearTitle}>{section.year}年</Text>
              <Text style={styles.yearCount}>{section.data.length}個月</Text>
              <Text style={[styles.yearNet, {color: amountColor(yearTotal)}]}>
                年度結餘 NT${yearTotal.toLocaleString()}
              </Text>
            </TouchableOpacity>
          );
        }}
        renderItem={({item, section}) => {
          if (!expandedYears.has(section.year)) {return null;}
          return (
            <ReportCard
              year={item.year}
              month={item.month}
              data={item}
            />
          );
        }}
        ListEmptyComponent={
          !currentStats ? (
            <View style={styles.emptyWrap}>
              <Icon name="calendar-blank-outline" size={40} color={Colors.border} />
              <Text style={styles.emptyText}>尚無月結記錄</Text>
            </View>
          ) : null
        }
      />
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
  currentWrap: {marginBottom: 8},
  historyLabel: {
    fontSize: 12, fontWeight: '700', color: Colors.textSecondary,
    marginHorizontal: 20, marginTop: 8, marginBottom: 4,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  yearHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    elevation: 1,
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 1,
    shadowRadius: 2,
    gap: 6,
  },
  yearTitle: {fontSize: 16, fontWeight: '800', color: Colors.textPrimary, flex: 1},
  yearCount: {fontSize: 11, color: Colors.textSecondary},
  yearNet: {fontSize: 13, fontWeight: '700'},
  emptyWrap: {alignItems: 'center', paddingTop: 40, gap: 8},
  emptyText: {fontSize: 14, color: Colors.textLight},
});

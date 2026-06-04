import React, {useState, useCallback, useMemo} from 'react';
import {View, Text, StyleSheet, SectionList, ActivityIndicator, TouchableOpacity} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {MonthlyReport} from '../types';
import {useColors, AppColors} from '../context/ThemeContext';
import {getAllMonthlyReports} from '../storage/database';
import {autoGenerateMissingReports, getCurrentMonthStats} from '../utils/monthlyReport';

interface CurrentStats {
  opening_balance: number; income: number; cash_expense: number; credit_expense: number; closing_balance: number;
}
interface YearSection { year: number; data: MonthlyReport[]; }

function lastDay(year: number, month: number) { return new Date(year, month, 0).getDate(); }

function periodLabel(year: number, month: number) {
  const now = new Date();
  const d = lastDay(year, month);
  const y = year !== now.getFullYear() ? `${year}/` : '';
  return `${y}${month}/1 ~ ${y}${month}/${d}`;
}

function ReportCard({year, month, data, isCurrent, colors, styles}: {year: number; month: number; data: Pick<MonthlyReport, 'opening_balance' | 'income' | 'cash_expense' | 'credit_expense' | 'closing_balance'>; isCurrent?: boolean; colors: AppColors; styles: any}) {
  const closing = data.closing_balance;
  const closingColor = closing > 0 ? colors.income : closing < 0 ? colors.expense : colors.textSecondary;

  return (
    <View style={[styles.card, isCurrent && {borderWidth: 1.5, borderColor: colors.primary + '60'}]}>
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          {isCurrent && <View style={[styles.dot, {backgroundColor: colors.income}]} />}
          <Text style={styles.monthTitle}>{year}年{month}月</Text>
          {isCurrent && <Text style={[styles.badge, {color: colors.primary, backgroundColor: colors.primary + '15'}]}>本月</Text>}
        </View>
        <Text style={styles.period}>{periodLabel(year, month)}</Text>
      </View>
      <View style={styles.statsRow}>
        {[
          {label: '月初餘額', value: data.opening_balance, color: colors.primary},
          {label: '現金支出', value: data.cash_expense, color: colors.expense},
          {label: '信用卡', value: data.credit_expense, color: colors.creditCard},
          {label: '收入', value: data.income, color: colors.income},
        ].map((item, i, arr) => (
          <React.Fragment key={item.label}>
            <View style={styles.statCell}>
              <Text style={styles.cellLabel}>{item.label}</Text>
              <Text style={[styles.cellValue, {color: item.color}]}>NT${Math.abs(item.value).toLocaleString()}</Text>
            </View>
            {i < arr.length - 1 && <View style={styles.sep} />}
          </React.Fragment>
        ))}
      </View>
      <View style={[styles.closing, {backgroundColor: closingColor + '12'}]}>
        <Text style={styles.closingLabel}>月底結餘</Text>
        <Text style={[styles.closingValue, {color: closingColor}]}>
          {closing < 0 ? '-' : ''}NT${Math.abs(closing).toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

export default function MonthlyReportScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [sections, setSections] = useState<YearSection[]>([]);
  const [currentStats, setCurrentStats] = useState<CurrentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set([new Date().getFullYear()]));
  const curYear = new Date().getFullYear();
  const curMonth = new Date().getMonth() + 1;

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([autoGenerateMissingReports(), getCurrentMonthStats()])
        .then(([, stats]) => { setCurrentStats(stats); return getAllMonthlyReports(); })
        .then(all => {
          const byYear = new Map<number, MonthlyReport[]>();
          all.forEach(r => { if (!byYear.has(r.year)) {byYear.set(r.year, []);} byYear.get(r.year)!.push(r); });
          const sorted: YearSection[] = Array.from(byYear.entries())
            .sort(([a], [b]) => b - a)
            .map(([year, data]) => ({year, data: [...data].sort((a, b) => b.month - a.month)}));
          setSections(sorted);
          setLoading(false);
        });
    }, []),
  );

  const toggleYear = (year: number) => {
    setExpandedYears(prev => { const next = new Set(prev); if (next.has(year)) {next.delete(year);} else {next.add(year);} return next; });
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <View style={styles.header}><Icon name="chart-bar" size={22} color="#fff" /><Text style={styles.headerTitle}>月結報表</Text></View>
        <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>自動計算中...</Text></View>
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
              <ReportCard year={curYear} month={curMonth} data={currentStats} isCurrent colors={colors} styles={styles} />
              {sections.length > 0 && <Text style={styles.historyLabel}>歷史紀錄</Text>}
            </View>
          ) : null
        }
        renderSectionHeader={({section}) => {
          const isExpanded = expandedYears.has(section.year);
          const yearTotal = section.data.reduce((s, r) => s + r.income - r.cash_expense - r.credit_expense, 0);
          const ytColor = yearTotal > 0 ? colors.income : yearTotal < 0 ? colors.expense : colors.textSecondary;
          return (
            <TouchableOpacity style={styles.yearHeader} onPress={() => toggleYear(section.year)} activeOpacity={0.7}>
              <Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} size={20} color={colors.primary} />
              <Text style={styles.yearTitle}>{section.year}年</Text>
              <Text style={styles.yearCount}>{section.data.length}個月</Text>
              <Text style={[styles.yearNet, {color: ytColor}]}>年度結餘 NT${yearTotal.toLocaleString()}</Text>
            </TouchableOpacity>
          );
        }}
        renderItem={({item, section}) => {
          if (!expandedYears.has(section.year)) {return null;}
          return <ReportCard year={item.year} month={item.month} data={item} colors={colors} styles={styles} />;
        }}
      />
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: {flex: 1, backgroundColor: c.background},
    header: {backgroundColor: c.primary, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 18},
    headerTitle: {fontSize: 20, fontWeight: '800', color: '#fff'},
    loading: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12},
    loadingText: {fontSize: 14, color: c.textSecondary},
    listContent: {paddingTop: 16, paddingBottom: 30},
    currentWrap: {marginBottom: 4},
    historyLabel: {fontSize: 12, fontWeight: '700', color: c.textSecondary, marginHorizontal: 20, marginTop: 8, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8},
    yearHeader: {flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, marginTop: 4, backgroundColor: c.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, elevation: 1, shadowColor: c.shadow, shadowOffset: {width: 0, height: 1}, shadowOpacity: 1, shadowRadius: 2, gap: 6},
    yearTitle: {fontSize: 16, fontWeight: '800', color: c.textPrimary, flex: 1},
    yearCount: {fontSize: 11, color: c.textSecondary},
    yearNet: {fontSize: 13, fontWeight: '700'},
    card: {backgroundColor: c.card, borderRadius: 16, marginHorizontal: 16, marginBottom: 10, overflow: 'hidden', elevation: 2, shadowColor: c.shadow, shadowOffset: {width: 0, height: 2}, shadowOpacity: 1, shadowRadius: 4},
    cardHeader: {padding: 14, paddingBottom: 10},
    titleRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2},
    dot: {width: 8, height: 8, borderRadius: 4},
    monthTitle: {fontSize: 16, fontWeight: '800', color: c.textPrimary},
    badge: {fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6},
    period: {fontSize: 11, color: c.textSecondary},
    statsRow: {flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.border},
    statCell: {flex: 1, alignItems: 'center'},
    cellLabel: {fontSize: 10, color: c.textSecondary, marginBottom: 2},
    cellValue: {fontSize: 13, fontWeight: '700'},
    sep: {width: 1, backgroundColor: c.border, marginHorizontal: 2},
    closing: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10},
    closingLabel: {fontSize: 12, color: c.textSecondary, fontWeight: '600'},
    closingValue: {fontSize: 18, fontWeight: '800'},
  });
}

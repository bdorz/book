import React, {useState, useCallback, useMemo} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RootStackParamList, Transaction} from '../types';
import {useColors, AppColors} from '../context/ThemeContext';
import {getTransactionsByTypes} from '../storage/database';
import TransactionItem from '../components/TransactionItem';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function FamilyScreen() {
  const navigation = useNavigation<NavProp>();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  useFocusEffect(
    useCallback(() => {
      getTransactionsByTypes(['family_in', 'family_out']).then(setTransactions);
    }, []),
  );

  const thisMonth = transactions.filter(t => {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return t.date.startsWith(prefix);
  });

  const totalOut = thisMonth.filter(t => t.type === 'family_out').reduce((s, t) => s + t.amount, 0);
  const totalIn = thisMonth.filter(t => t.type === 'family_in').reduce((s, t) => s + t.amount, 0);
  const netBalance = totalIn - totalOut;

  const grouped = new Map<string, Transaction[]>();
  transactions.forEach(t => {
    const [y, m] = t.date.split('-');
    const key = `${y}-${m}`;
    if (!grouped.has(key)) {grouped.set(key, []);}
    grouped.get(key)!.push(t);
  });
  const sections = Array.from(grouped.entries()).sort(([a], [b]) => b.localeCompare(a));

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>家人代買</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, {borderLeftColor: colors.family}]}>
          <Text style={styles.summaryLabel}>本月代付</Text>
          <Text style={[styles.summaryAmount, {color: colors.family}]}>-NT${totalOut.toLocaleString()}</Text>
        </View>
        <View style={[styles.summaryCard, {borderLeftColor: colors.income}]}>
          <Text style={styles.summaryLabel}>本月代收</Text>
          <Text style={[styles.summaryAmount, {color: colors.income}]}>+NT${totalIn.toLocaleString()}</Text>
        </View>
        <View style={[styles.summaryCard, {borderLeftColor: colors.primary}]}>
          <Text style={styles.summaryLabel}>淨餘額</Text>
          <Text style={[styles.summaryAmount, {color: netBalance >= 0 ? colors.income : colors.expense}]}>
            NT${netBalance.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.infoBanner}>
        <Icon name="information-outline" size={14} color={colors.primary} />
        <Text style={[styles.infoText, {color: colors.primary}]}>{'  '}代付 = 幫家人付錢，代收 = 收到家人還款</Text>
      </View>

      {transactions.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="account-group-outline" size={56} color={colors.border} />
          <Text style={styles.emptyText}>尚無家人代買記錄</Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={([key]) => key}
          contentContainerStyle={styles.listContent}
          renderItem={({item: [monthKey, items]}) => {
            const [y, m] = monthKey.split('-');
            const monthOut = items.filter(t => t.type === 'family_out').reduce((s, t) => s + t.amount, 0);
            const monthIn = items.filter(t => t.type === 'family_in').reduce((s, t) => s + t.amount, 0);
            return (
              <View style={styles.monthSection}>
                <View style={styles.monthHeader}>
                  <Text style={styles.monthLabel}>{y}年{parseInt(m, 10)}月</Text>
                  <Text style={styles.monthNet}>結餘 NT${(monthIn - monthOut).toLocaleString()}</Text>
                </View>
                {items.map(t => (
                  <TransactionItem key={t.id} transaction={t} onPress={tx => navigation.navigate('AddEditTransaction', {transactionId: tx.id})} />
                ))}
              </View>
            );
          }}
        />
      )}

      <TouchableOpacity style={[styles.fab, {backgroundColor: colors.family, shadowColor: colors.family}]} onPress={() => navigation.navigate('AddEditTransaction', {initialType: 'family_out'})} activeOpacity={0.85}>
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
    summaryRow: {flexDirection: 'row', marginHorizontal: 16, marginTop: 12, gap: 8},
    summaryCard: {flex: 1, backgroundColor: c.card, borderRadius: 12, padding: 12, borderLeftWidth: 3, elevation: 2, shadowColor: c.shadow, shadowOffset: {width: 0, height: 1}, shadowOpacity: 1, shadowRadius: 3},
    summaryLabel: {fontSize: 11, color: c.textSecondary, marginBottom: 4},
    summaryAmount: {fontSize: 14, fontWeight: '700'},
    infoBanner: {flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 10, backgroundColor: '#9B87F518', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8},
    infoText: {fontSize: 12},
    listContent: {paddingHorizontal: 16, paddingBottom: 80, paddingTop: 12},
    monthSection: {marginBottom: 8},
    monthHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
    monthLabel: {fontSize: 14, fontWeight: '700', color: c.textSecondary},
    monthNet: {fontSize: 12, color: c.textSecondary},
    empty: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80},
    emptyText: {fontSize: 15, color: c.textLight, marginTop: 12},
    fab: {position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.4, shadowRadius: 8},
  });
}

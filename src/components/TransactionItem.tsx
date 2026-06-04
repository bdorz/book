import React, {useMemo} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Transaction} from '../types';
import {CategoryColors} from '../constants/colors';
import {useColors, AppColors} from '../context/ThemeContext';
import {EXPENSE_CATEGORIES, INCOME_CATEGORIES, CREDIT_CATEGORIES, FAMILY_CATEGORIES} from '../constants/categories';

interface Props {
  transaction: Transaction;
  onPress: (t: Transaction) => void;
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'expense': return '支出';
    case 'income': return '收入';
    case 'credit_card': return '刷卡';
    case 'family_in': return '代收';
    case 'family_out': return '代付';
    default: return '';
  }
}

function getCategoryIcon(type: string, category: string): string {
  const all = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES, ...CREDIT_CATEGORIES, ...FAMILY_CATEGORIES];
  return all.find(c => c.value === category)?.icon ?? 'circle';
}

export default function TransactionItem({transaction, onPress}: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const catColor = CategoryColors[transaction.category] ?? colors.textSecondary;
  const icon = getCategoryIcon(transaction.type, transaction.category);
  const typeLabel = getTypeLabel(transaction.type);
  const isPositive = transaction.type === 'income' || transaction.type === 'family_in';
  const amountColor = transaction.type === 'income' || transaction.type === 'family_in'
    ? colors.income
    : transaction.type === 'credit_card'
    ? colors.creditCard
    : transaction.type === 'family_out'
    ? colors.family
    : colors.expense;

  const [, month, day] = transaction.date.split('-');

  return (
    <TouchableOpacity style={styles.row} onPress={() => onPress(transaction)} activeOpacity={0.7}>
      <View style={[styles.iconWrap, {backgroundColor: catColor + '20'}]}>
        <Icon name={icon} size={18} color={catColor} />
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.category}>{transaction.category}</Text>
          <View style={[styles.typeBadge, {backgroundColor: amountColor + '18'}]}>
            <Text style={[styles.typeText, {color: amountColor}]}>{typeLabel}</Text>
          </View>
        </View>
        {transaction.description ? <Text style={styles.desc} numberOfLines={1}>{transaction.description}</Text> : null}
        <Text style={styles.date}>{`${month}/${day}`}</Text>
      </View>
      <Text style={[styles.amount, {color: amountColor}]}>
        {isPositive ? '+' : '-'}NT${transaction.amount.toLocaleString()}
      </Text>
    </TouchableOpacity>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: c.card, borderRadius: 12, padding: 12, marginBottom: 8,
      elevation: 2, shadowColor: c.shadow, shadowOffset: {width: 0, height: 1}, shadowOpacity: 1, shadowRadius: 4,
    },
    iconWrap: {width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12},
    info: {flex: 1},
    topRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
    category: {fontSize: 15, fontWeight: '600', color: c.textPrimary},
    typeBadge: {paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6},
    typeText: {fontSize: 10, fontWeight: '600'},
    desc: {fontSize: 12, color: c.textSecondary, marginTop: 2},
    date: {fontSize: 11, color: c.textLight, marginTop: 2},
    amount: {fontSize: 16, fontWeight: '700'},
  });
}

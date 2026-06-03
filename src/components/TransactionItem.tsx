import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Transaction} from '../types';
import {Colors, CategoryColors} from '../constants/colors';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  CREDIT_CATEGORIES,
  FAMILY_CATEGORIES,
} from '../constants/categories';

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

function getAmountColor(type: string): string {
  switch (type) {
    case 'income':
    case 'family_in': return Colors.income;
    case 'expense': return Colors.expense;
    case 'credit_card': return Colors.creditCard;
    case 'family_out': return Colors.family;
    default: return Colors.textPrimary;
  }
}

function getAmountPrefix(type: string): string {
  return type === 'income' || type === 'family_in' ? '+' : '-';
}

function getCategoryIcon(type: string, category: string): string {
  const allCats = [
    ...EXPENSE_CATEGORIES,
    ...INCOME_CATEGORIES,
    ...CREDIT_CATEGORIES,
    ...FAMILY_CATEGORIES,
  ];
  return allCats.find(c => c.value === category)?.icon ?? 'circle';
}

export default function TransactionItem({transaction, onPress}: Props) {
  const color = CategoryColors[transaction.category] ?? Colors.textSecondary;
  const icon = getCategoryIcon(transaction.type, transaction.category);
  const amountColor = getAmountColor(transaction.type);
  const prefix = getAmountPrefix(transaction.type);
  const typeLabel = getTypeLabel(transaction.type);

  const [, month, day] = transaction.date.split('-');

  return (
    <TouchableOpacity style={styles.row} onPress={() => onPress(transaction)} activeOpacity={0.7}>
      <View style={[styles.iconWrap, {backgroundColor: color + '20'}]}>
        <Icon name={icon} size={18} color={color} />
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.category}>{transaction.category}</Text>
          <View style={[styles.typeBadge, {backgroundColor: amountColor + '18'}]}>
            <Text style={[styles.typeText, {color: amountColor}]}>{typeLabel}</Text>
          </View>
        </View>
        {transaction.description ? (
          <Text style={styles.desc} numberOfLines={1}>{transaction.description}</Text>
        ) : null}
        <Text style={styles.date}>{`${month}/${day}`}</Text>
      </View>
      <Text style={[styles.amount, {color: amountColor}]}>
        {prefix}NT${transaction.amount.toLocaleString()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  category: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  desc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  date: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
});

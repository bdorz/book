import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { Transaction } from '@/store/types';
import { getCategoryColor, getCategoryEmoji } from '@/constants/categories';
import { formatDate } from '@/utils/dateUtils';
import { useStore } from '@/store';

interface Props {
  transaction: Transaction;
  showDelete?: boolean;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: '現金',
  credit_card: '信用卡',
  transfer: '轉帳',
};

export default function TransactionItem({ transaction, showDelete = false }: Props) {
  const deleteTransaction = useStore((s) => s.deleteTransaction);
  const isExpense = transaction.type === 'expense';
  const color = getCategoryColor(transaction.category);
  const emoji = getCategoryEmoji(transaction.category);

  const handleDelete = () => {
    Alert.alert('刪除', '確定要刪除這筆紀錄嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: () => deleteTransaction(transaction.id),
      },
    ]);
  };

  const handleEdit = () => {
    router.push({ pathname: '/edit-transaction', params: { id: transaction.id } });
  };

  return (
    <TouchableOpacity style={styles.row} onPress={handleEdit} activeOpacity={0.7}>
      <View style={[styles.icon, { backgroundColor: color + '28' }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.category}>{transaction.category}</Text>
          {transaction.isForFamily && (
            <View style={styles.familyTag}>
              <Text style={styles.familyTagText}>代買</Text>
            </View>
          )}
        </View>
        <Text style={styles.meta}>
          {formatDate(transaction.date)}
          {transaction.note ? ` · ${transaction.note}` : ''}
          {' · '}{PAYMENT_LABELS[transaction.paymentMethod]}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.amount, { color: isExpense ? '#EF4444' : '#22C55E' }]}>
          {isExpense ? '-' : '+'}NT${transaction.amount.toLocaleString()}
        </Text>
        {showDelete && (
          <TouchableOpacity onPress={handleDelete} hitSlop={10} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={15} color="#D1D5DB" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 18,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  familyTag: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  familyTagText: {
    fontSize: 10,
    color: '#7C3AED',
    fontWeight: '600',
  },
  meta: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 2,
  },
});

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useStore } from '@/store';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants/categories';
import type { PaymentMethod } from '@/store/types';

const EXPENSE_PAYMENTS: { key: PaymentMethod; label: string }[] = [
  { key: 'cash', label: '現金' },
  { key: 'credit_card', label: '信用卡' },
  { key: 'transfer', label: '轉帳' },
];

const INCOME_PAYMENTS: { key: PaymentMethod; label: string }[] = [
  { key: 'cash', label: '現金' },
  { key: 'transfer', label: '轉帳' },
  { key: 'credit_card', label: '其他' },
];

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transactions, settings, updateTransaction } = useStore();

  const tx = transactions.find((t) => t.id === id);

  if (!tx) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>找不到此筆記錄</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>返回</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isExpense = tx.type === 'expense';
  const categories = isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const paymentOptions = isExpense ? EXPENSE_PAYMENTS : INCOME_PAYMENTS;
  const accentColor = isExpense ? '#EF4444' : '#22C55E';

  const [amount, setAmount] = useState(String(tx.amount));
  const [category, setCategory] = useState(tx.category);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(tx.paymentMethod);
  const [note, setNote] = useState(tx.note);
  const [isForFamily, setIsForFamily] = useState(tx.isForFamily);
  const [familyMember, setFamilyMember] = useState(
    tx.familyMember || settings.familyMembers[0] || ''
  );

  const handleSave = () => {
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) {
      Alert.alert('請輸入有效金額');
      return;
    }
    updateTransaction(tx.id, {
      amount: num,
      category,
      paymentMethod,
      note: note.trim(),
      isForFamily,
      familyMember: isForFamily ? familyMember : '',
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>
            編輯{isExpense ? '支出' : '收入'}
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={[styles.saveBtn, { color: accentColor }]}>儲存</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* 金額 */}
          <View style={styles.amountSection}>
            <Text style={styles.currency}>NT$</Text>
            <TextInput
              style={[styles.amountInput, { color: accentColor }]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#CCC"
              autoFocus
            />
          </View>

          {/* 類別 */}
          <Text style={styles.fieldLabel}>類別</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
            contentContainerStyle={styles.chipContent}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.name}
                style={[styles.chip, category === cat.name && styles.chipActive]}
                onPress={() => setCategory(cat.name)}
              >
                <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                <Text style={[styles.chipLabel, category === cat.name && styles.chipLabelActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 付款方式 */}
          <Text style={styles.fieldLabel}>{isExpense ? '付款方式' : '收款方式'}</Text>
          <View style={styles.payRow}>
            {paymentOptions.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.payChip, paymentMethod === opt.key && styles.payChipActive]}
                onPress={() => setPaymentMethod(opt.key)}
              >
                <Text style={[styles.payLabel, paymentMethod === opt.key && styles.payLabelActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 備註 */}
          <Text style={styles.fieldLabel}>備註</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="選填"
            placeholderTextColor="#CCC"
          />

          {/* 代買（僅支出） */}
          {isExpense && (
            <>
              <View style={styles.familyRow}>
                <View style={styles.familyLeft}>
                  <Text style={styles.familyTitle}>代家人購買</Text>
                  <Text style={styles.familySub}>啟用後列入代買紀錄</Text>
                </View>
                <TouchableOpacity
                  style={[styles.toggle, isForFamily && styles.toggleOn]}
                  onPress={() => setIsForFamily((v) => !v)}
                >
                  <View style={[styles.thumb, isForFamily && styles.thumbOn]} />
                </TouchableOpacity>
              </View>

              {isForFamily && settings.familyMembers.length > 0 && (
                <>
                  <Text style={styles.fieldLabel}>代買對象</Text>
                  <View style={styles.memberRow}>
                    {settings.familyMembers.map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.memberChip, familyMember === m && styles.memberChipActive]}
                        onPress={() => setFamilyMember(m)}
                      >
                        <Text style={[styles.memberLabel, familyMember === m && styles.memberLabelActive]}>
                          {m}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const PURPLE = '#7C6EE6';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEE',
  },
  title: { fontSize: 17, fontWeight: '600', color: '#1F2937' },
  saveBtn: { fontSize: 16, fontWeight: '600' },
  scroll: { flex: 1, paddingHorizontal: 16 },

  amountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 20,
  },
  currency: { fontSize: 28, color: '#888', fontWeight: '300', marginRight: 4 },
  amountInput: { fontSize: 52, fontWeight: '700', minWidth: 120, textAlign: 'center' },

  fieldLabel: { fontSize: 13, color: '#888', fontWeight: '500', marginBottom: 8, marginTop: 4 },
  chipScroll: { marginBottom: 20, marginHorizontal: -16 },
  chipContent: { paddingHorizontal: 16, gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F8',
    alignItems: 'center',
    minWidth: 64,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipActive: { backgroundColor: '#EDE9FE', borderColor: PURPLE },
  chipEmoji: { fontSize: 20, marginBottom: 2 },
  chipLabel: { fontSize: 11, color: '#666' },
  chipLabelActive: { color: PURPLE, fontWeight: '600' },

  payRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  payChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F5F5F8',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  payChipActive: { backgroundColor: '#EDE9FE', borderColor: PURPLE },
  payLabel: { fontSize: 14, color: '#555', fontWeight: '500' },
  payLabelActive: { color: PURPLE, fontWeight: '600' },

  noteInput: {
    backgroundColor: '#F5F5F8',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 20,
  },

  familyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  familyLeft: { flex: 1 },
  familyTitle: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  familySub: { fontSize: 12, color: '#888', marginTop: 2 },
  toggle: {
    width: 46, height: 26, borderRadius: 13,
    backgroundColor: '#D1D5DB', justifyContent: 'center', paddingHorizontal: 2,
  },
  toggleOn: { backgroundColor: PURPLE },
  thumb: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15, shadowRadius: 2, elevation: 2,
  },
  thumbOn: { alignSelf: 'flex-end' },

  memberRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 16 },
  memberChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F5F5F8', borderWidth: 1.5, borderColor: 'transparent',
  },
  memberChipActive: { backgroundColor: '#EDE9FE', borderColor: PURPLE },
  memberLabel: { fontSize: 14, color: '#555' },
  memberLabelActive: { color: PURPLE, fontWeight: '600' },

  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 16, color: '#888' },
  backLink: { fontSize: 15, color: PURPLE, fontWeight: '600' },
});

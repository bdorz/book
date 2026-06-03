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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useStore } from '@/store';
import { INCOME_CATEGORIES } from '@/constants/categories';
import { getTodayStr } from '@/utils/dateUtils';
import { generateId } from '@/utils/formatters';
import type { PaymentMethod } from '@/store/types';

const PAYMENT_OPTIONS: { key: PaymentMethod; label: string }[] = [
  { key: 'cash', label: '現金' },
  { key: 'transfer', label: '轉帳' },
  { key: 'credit_card', label: '其他' },
];

export default function AddIncomeScreen() {
  const { addTransaction } = useStore();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(INCOME_CATEGORIES[0].name);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');

  const handleSave = () => {
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) {
      Alert.alert('請輸入有效金額');
      return;
    }
    addTransaction({
      id: generateId(),
      type: 'income',
      amount: num,
      category,
      paymentMethod,
      date: getTodayStr(),
      note: note.trim(),
      isForFamily: false,
      familyMember: '',
      familyRepaid: false,
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>新增收入</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveBtn}>儲存</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Amount */}
          <View style={styles.amountSection}>
            <Text style={styles.currency}>NT$</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#CCC"
              autoFocus
            />
          </View>

          {/* Category */}
          <Text style={styles.fieldLabel}>類別</Text>
          <View style={styles.categoryGrid}>
            {INCOME_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.name}
                style={[
                  styles.categoryChip,
                  category === cat.name && styles.categoryChipActive,
                ]}
                onPress={() => setCategory(cat.name)}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text
                  style={[
                    styles.categoryName,
                    category === cat.name && styles.categoryNameActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Payment method */}
          <Text style={styles.fieldLabel}>收款方式</Text>
          <View style={styles.paymentRow}>
            {PAYMENT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.paymentChip,
                  paymentMethod === opt.key && styles.paymentChipActive,
                ]}
                onPress={() => setPaymentMethod(opt.key)}
              >
                <Text
                  style={[
                    styles.paymentLabel,
                    paymentMethod === opt.key && styles.paymentLabelActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Note */}
          <Text style={styles.fieldLabel}>備註</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="選填，例如：五月薪資"
            placeholderTextColor="#CCC"
          />

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const GREEN = '#22C55E';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  saveBtn: {
    fontSize: 16,
    fontWeight: '600',
    color: GREEN,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 20,
  },
  currency: {
    fontSize: 28,
    color: '#888',
    fontWeight: '300',
    marginRight: 4,
  },
  amountInput: {
    fontSize: 52,
    fontWeight: '700',
    color: GREEN,
    minWidth: 120,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F8',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  categoryChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: GREEN,
  },
  categoryEmoji: {
    fontSize: 18,
  },
  categoryName: {
    fontSize: 13,
    color: '#555',
  },
  categoryNameActive: {
    color: '#16A34A',
    fontWeight: '600',
  },
  paymentRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  paymentChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F5F5F8',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  paymentChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: GREEN,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  paymentLabelActive: {
    color: '#16A34A',
    fontWeight: '600',
  },
  noteInput: {
    backgroundColor: '#F5F5F8',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 20,
  },
});

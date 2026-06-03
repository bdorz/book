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
import { EXPENSE_CATEGORIES } from '@/constants/categories';
import { getTodayStr } from '@/utils/dateUtils';
import { generateId } from '@/utils/formatters';
import type { PaymentMethod } from '@/store/types';

const PAYMENT_OPTIONS: { key: PaymentMethod; label: string }[] = [
  { key: 'cash', label: '現金' },
  { key: 'credit_card', label: '信用卡' },
  { key: 'transfer', label: '轉帳' },
];

export default function AddExpenseScreen() {
  const { addTransaction, settings } = useStore();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].name);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');
  const [isForFamily, setIsForFamily] = useState(false);
  const [familyMember, setFamilyMember] = useState(
    settings.familyMembers[0] ?? ''
  );

  const handleSave = () => {
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) {
      Alert.alert('請輸入有效金額');
      return;
    }
    addTransaction({
      id: generateId(),
      type: 'expense',
      amount: num,
      category,
      paymentMethod,
      date: getTodayStr(),
      note: note.trim(),
      isForFamily,
      familyMember: isForFamily ? familyMember : '',
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
          <Text style={styles.modalTitle}>新增支出</Text>
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContent}
          >
            {EXPENSE_CATEGORIES.map((cat) => (
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
          </ScrollView>

          {/* Payment method */}
          <Text style={styles.fieldLabel}>付款方式</Text>
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
            placeholder="選填，例如：午餐"
            placeholderTextColor="#CCC"
          />

          {/* Family purchase toggle */}
          <View style={styles.familyRow}>
            <View style={styles.familyLeft}>
              <Text style={styles.familyTitle}>代家人購買</Text>
              <Text style={styles.familySubtitle}>
                啟用後此筆支出將列入代買紀錄
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, isForFamily && styles.toggleOn]}
              onPress={() => setIsForFamily((v) => !v)}
            >
              <View
                style={[styles.toggleThumb, isForFamily && styles.toggleThumbOn]}
              />
            </TouchableOpacity>
          </View>

          {/* Family member selector */}
          {isForFamily && settings.familyMembers.length > 0 && (
            <View style={styles.memberSection}>
              <Text style={styles.fieldLabel}>代買對象</Text>
              <View style={styles.memberRow}>
                {settings.familyMembers.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.memberChip,
                      familyMember === m && styles.memberChipActive,
                    ]}
                    onPress={() => setFamilyMember(m)}
                  >
                    <Text
                      style={[
                        styles.memberLabel,
                        familyMember === m && styles.memberLabelActive,
                      ]}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const PURPLE = '#7C6EE6';

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
    color: '#EF4444',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Amount
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
    color: '#EF4444',
    minWidth: 120,
    textAlign: 'center',
  },

  // Category
  fieldLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 4,
  },
  categoryScroll: {
    marginBottom: 20,
    marginHorizontal: -16,
  },
  categoryContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F8',
    alignItems: 'center',
    minWidth: 64,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  categoryChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: PURPLE,
  },
  categoryEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  categoryName: {
    fontSize: 11,
    color: '#666',
  },
  categoryNameActive: {
    color: PURPLE,
    fontWeight: '600',
  },

  // Payment
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
    backgroundColor: '#EDE9FE',
    borderColor: PURPLE,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  paymentLabelActive: {
    color: PURPLE,
    fontWeight: '600',
  },

  // Note
  noteInput: {
    backgroundColor: '#F5F5F8',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 20,
  },

  // Family
  familyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  familyLeft: {
    flex: 1,
  },
  familyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  familySubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  toggle: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleOn: {
    backgroundColor: PURPLE,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },

  // Member
  memberSection: {
    marginBottom: 16,
  },
  memberRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  memberChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F8',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  memberChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: PURPLE,
  },
  memberLabel: {
    fontSize: 14,
    color: '#555',
  },
  memberLabelActive: {
    color: PURPLE,
    fontWeight: '600',
  },
});

import { Fragment, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useStore } from '@/store';
import { generateId } from '@/utils/formatters';
import type { RegularExpense } from '@/store/types';

export default function SettingsScreen() {
  const { settings, updateSettings } = useStore();

  const [userName, setUserName] = useState(settings.userName);
  const [budget, setBudget] = useState(String(settings.monthlyBudget));
  const [income, setIncome] = useState(String(settings.estimatedIncome));
  const [startDay, setStartDay] = useState(String(settings.periodStartDay));
  const [creditCard, setCreditCard] = useState(settings.creditCardName);
  const [newMember, setNewMember] = useState('');
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');

  const handleSave = () => {
    const b = parseInt(budget, 10);
    const i = parseInt(income, 10);
    const d = parseInt(startDay, 10);
    if (isNaN(b) || b <= 0) { Alert.alert('請輸入有效預算'); return; }
    if (isNaN(i) || i < 0) { Alert.alert('請輸入有效收入'); return; }
    if (isNaN(d) || d < 1 || d > 28) { Alert.alert('請輸入 1~28 的日期'); return; }
    updateSettings({
      userName: userName.trim() || '我',
      monthlyBudget: b,
      estimatedIncome: i,
      periodStartDay: d,
      creditCardName: creditCard.trim() || '信用卡',
    });
    Alert.alert('已儲存');
  };

  const handleAddMember = () => {
    const m = newMember.trim();
    if (!m) return;
    if (settings.familyMembers.includes(m)) {
      Alert.alert('已存在此成員');
      return;
    }
    updateSettings({ familyMembers: [...settings.familyMembers, m] });
    setNewMember('');
  };

  const handleRemoveMember = (m: string) => {
    Alert.alert('移除成員', `移除「${m}」？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '移除',
        style: 'destructive',
        onPress: () =>
          updateSettings({
            familyMembers: settings.familyMembers.filter((x) => x !== m),
          }),
      },
    ]);
  };

  const handleAddRegularExpense = () => {
    const name = newExpenseName.trim();
    const amt = parseInt(newExpenseAmount, 10);
    if (!name) { Alert.alert('請輸入支出名稱'); return; }
    if (isNaN(amt) || amt <= 0) { Alert.alert('請輸入有效金額'); return; }
    const newExpense: RegularExpense = {
      id: generateId(),
      name,
      amount: amt,
      category: '其他',
      paymentMethod: 'cash',
    };
    updateSettings({ regularExpenses: [...settings.regularExpenses, newExpense] });
    setNewExpenseName('');
    setNewExpenseAmount('');
  };

  const handleRemoveRegularExpense = (id: string) => {
    updateSettings({
      regularExpenses: settings.regularExpenses.filter((e) => e.id !== id),
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>設定</Text>

        {/* Basic info */}
        <Text style={styles.section}>基本資訊</Text>
        <View style={styles.card}>
          <Row label="使用者名稱">
            <TextInput style={styles.input} value={userName} onChangeText={setUserName} placeholder="智豪" />
          </Row>
          <Divider />
          <Row label="月預算（NT$）">
            <TextInput style={styles.input} value={budget} onChangeText={setBudget} keyboardType="numeric" placeholder="15000" />
          </Row>
          <Divider />
          <Row label="預估收入（NT$）">
            <TextInput style={styles.input} value={income} onChangeText={setIncome} keyboardType="numeric" placeholder="1150" />
          </Row>
          <Divider />
          <Row label="週期起始日（1~28）">
            <TextInput style={styles.input} value={startDay} onChangeText={setStartDay} keyboardType="numeric" placeholder="5" />
          </Row>
          <Divider />
          <Row label="信用卡名稱">
            <TextInput style={styles.input} value={creditCard} onChangeText={setCreditCard} placeholder="中信" />
          </Row>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>儲存設定</Text>
        </TouchableOpacity>

        {/* Family members */}
        <Text style={styles.section}>代買家人名單</Text>
        <View style={styles.card}>
          {settings.familyMembers.map((m) => (
            <Fragment key={m}>
              <View style={styles.memberRow}>
                <Text style={styles.memberName}>👤 {m}</Text>
                <TouchableOpacity onPress={() => handleRemoveMember(m)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
              <Divider />
            </Fragment>
          ))}
          <View style={styles.addRow}>
            <TextInput
              style={styles.addInput}
              value={newMember}
              onChangeText={setNewMember}
              placeholder="輸入名稱（如：爸爸）"
              onSubmitEditing={handleAddMember}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleAddMember}>
              <Text style={styles.addBtnText}>新增</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Regular expenses */}
        <Text style={styles.section}>定期支出</Text>
        <View style={styles.card}>
          {settings.regularExpenses.length === 0 && (
            <Text style={styles.emptyText}>尚無定期支出</Text>
          )}
          {settings.regularExpenses.map((e, i) => (
            <Fragment key={e.id}>
              {i > 0 && <Divider />}
              <View style={styles.memberRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{e.name}</Text>
                  <Text style={styles.memberSub}>NT${e.amount.toLocaleString()} / 期</Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveRegularExpense(e.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </Fragment>
          ))}
          {settings.regularExpenses.length > 0 && <Divider />}
          <View style={styles.addRow}>
            <TextInput
              style={[styles.addInput, { flex: 2 }]}
              value={newExpenseName}
              onChangeText={setNewExpenseName}
              placeholder="名稱（如：Netflix）"
            />
            <TextInput
              style={[styles.addInput, { flex: 1 }]}
              value={newExpenseAmount}
              onChangeText={setNewExpenseAmount}
              placeholder="金額"
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleAddRegularExpense}>
              <Text style={styles.addBtnText}>新增</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      {children}
    </View>
  );
}

function Divider() {
  return (
    <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: '#F0F0F0' }} />
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  label: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
});

const PURPLE = '#7C6EE6';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F8' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8 },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  section: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  input: {
    fontSize: 14,
    color: '#1F2937',
    textAlign: 'right',
    flex: 1,
    minWidth: 80,
  },
  saveBtn: {
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  memberName: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  memberSub: {
    fontSize: 12,
    color: '#888',
    marginTop: 1,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  addInput: {
    flex: 1,
    backgroundColor: '#F5F5F8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1F2937',
  },
  addBtn: {
    backgroundColor: PURPLE,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    color: '#AAA',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});

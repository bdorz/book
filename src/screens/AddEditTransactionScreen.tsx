import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RootStackParamList, TransactionType} from '../types';
import {Colors} from '../constants/colors';
import {getCategoriesForType} from '../constants/categories';
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionById,
} from '../storage/database';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'AddEditTransaction'>;

interface TypeTab {
  key: TransactionType;
  label: string;
  color: string;
}

const TYPE_TABS: TypeTab[] = [
  {key: 'expense', label: '支出', color: Colors.expense},
  {key: 'income', label: '收入', color: Colors.income},
  {key: 'credit_card', label: '刷卡', color: Colors.creditCard},
  {key: 'family_out', label: '代付', color: Colors.family},
  {key: 'family_in', label: '代收', color: Colors.income},
];

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${y}年${parseInt(m, 10)}月${parseInt(d, 10)}日`;
}

export default function AddEditTransactionScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const {transactionId, initialType} = route.params ?? {};
  const isEdit = !!transactionId;

  const [type, setType] = useState<TransactionType>(initialType ?? 'expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayStr());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transactionId) {
      getTransactionById(transactionId).then(t => {
        if (t) {
          setType(t.type);
          setAmount(String(t.amount));
          setCategory(t.category);
          setDescription(t.description);
          setDate(t.date);
        }
      });
    } else {
      setCategory(getCategoriesForType(initialType ?? 'expense')[0]?.value ?? '');
    }
  }, [transactionId, initialType]);

  useEffect(() => {
    const firstCategory = getCategoriesForType(type)[0]?.value ?? '';
    setCategory(firstCategory);
  }, [type]);

  const openDatePicker = useCallback(() => {
    const [y, m, d] = date.split('-').map(Number);
    DateTimePickerAndroid.open({
      value: new Date(y, m - 1, d),
      mode: 'date',
      onChange: (_, selected) => {
        if (selected) {
          const ny = selected.getFullYear();
          const nm = String(selected.getMonth() + 1).padStart(2, '0');
          const nd = String(selected.getDate()).padStart(2, '0');
          setDate(`${ny}-${nm}-${nd}`);
        }
      },
    });
  }, [date]);

  const handleSave = useCallback(async () => {
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('請輸入有效金額');
      return;
    }
    if (!category) {
      Alert.alert('請選擇分類');
      return;
    }
    setLoading(true);
    try {
      if (isEdit && transactionId) {
        await updateTransaction(transactionId, {
          type,
          amount: amountNum,
          category,
          description,
          date,
        });
      } else {
        await createTransaction({
          type,
          amount: amountNum,
          category,
          description,
          date,
        });
      }
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [amount, category, date, description, isEdit, navigation, transactionId, type]);

  const handleDelete = useCallback(() => {
    if (!transactionId) {return;}
    Alert.alert('確認刪除', '確定要刪除這筆記錄嗎？', [
      {text: '取消', style: 'cancel'},
      {
        text: '刪除',
        style: 'destructive',
        onPress: async () => {
          await deleteTransaction(transactionId);
          navigation.goBack();
        },
      },
    ]);
  }, [navigation, transactionId]);

  const categories = getCategoriesForType(type);
  const activeTab = TYPE_TABS.find(t => t.key === type) ?? TYPE_TABS[0];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? '編輯記錄' : `新增${activeTab.label}`}</Text>
        {isEdit ? (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <Icon name="trash-can-outline" size={22} color={Colors.expense} />
          </TouchableOpacity>
        ) : (
          <View style={styles.deleteBtn} />
        )}
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Type Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeTabs} contentContainerStyle={styles.typeTabsContent}>
          {TYPE_TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.typeTab, type === tab.key && {backgroundColor: tab.color, borderColor: tab.color}]}
              onPress={() => setType(tab.key)}
              activeOpacity={0.8}>
              <Text style={[styles.typeTabText, type === tab.key && {color: '#fff'}]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Amount Input */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>金額</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.amountCurrency, {color: activeTab.color}]}>NT$</Text>
            <TextInput
              style={[styles.amountInput, {color: activeTab.color}]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.textLight}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>分類</Text>
          <View style={styles.categoryGrid}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryChip,
                  category === cat.value && {
                    backgroundColor: cat.color,
                    borderColor: cat.color,
                  },
                ]}
                onPress={() => setCategory(cat.value)}
                activeOpacity={0.7}>
                <Icon
                  name={cat.icon}
                  size={16}
                  color={category === cat.value ? '#fff' : cat.color}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    category === cat.value && {color: '#fff'},
                  ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date */}
        <TouchableOpacity style={styles.section} onPress={openDatePicker} activeOpacity={0.8}>
          <Text style={styles.sectionLabel}>日期</Text>
          <View style={styles.dateRow}>
            <Icon name="calendar" size={18} color={Colors.primary} />
            <Text style={styles.dateText}>{formatDisplayDate(date)}</Text>
            <Icon name="chevron-right" size={18} color={Colors.textLight} />
          </View>
        </TouchableOpacity>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>說明（選填）</Text>
          <TextInput
            style={styles.descInput}
            value={description}
            onChangeText={setDescription}
            placeholder="輸入備註..."
            placeholderTextColor={Colors.textLight}
            multiline
            maxLength={100}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, {backgroundColor: activeTab.color}]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>
            {loading ? '儲存中...' : isEdit ? '更新記錄' : '儲存'}
          </Text>
        </TouchableOpacity>

        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: Colors.background},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: 8,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  backBtn: {padding: 8},
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  deleteBtn: {padding: 8, width: 40},
  scroll: {flex: 1},
  typeTabs: {marginTop: 16},
  typeTabsContent: {paddingHorizontal: 16, gap: 8},
  typeTab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  typeTabText: {fontSize: 14, fontWeight: '600', color: Colors.textSecondary},
  amountCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  amountLabel: {fontSize: 13, color: Colors.textSecondary, marginBottom: 8},
  amountRow: {flexDirection: 'row', alignItems: 'center'},
  amountCurrency: {fontSize: 24, fontWeight: '700', marginRight: 4},
  amountInput: {
    fontSize: 36,
    fontWeight: '800',
    flex: 1,
    padding: 0,
  },
  section: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  sectionLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    gap: 4,
  },
  categoryChipText: {fontSize: 13, fontWeight: '600', color: Colors.textPrimary},
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {flex: 1, fontSize: 16, color: Colors.textPrimary, fontWeight: '500'},
  descInput: {
    fontSize: 15,
    color: Colors.textPrimary,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  saveBtn: {
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});

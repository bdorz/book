import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useStore } from '@/store';
import { formatDate } from '@/utils/dateUtils';
import { getCategoryEmoji } from '@/constants/categories';

export default function FamilyScreen() {
  const { transactions, settings, toggleFamilyRepaid } = useStore();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const familyTransactions = useMemo(
    () => transactions.filter((t) => t.isForFamily),
    [transactions]
  );

  // Total owed per member (only not repaid)
  const memberTotals = useMemo(() => {
    const map: Record<string, { total: number; unpaid: number }> = {};
    settings.familyMembers.forEach((m) => {
      map[m] = { total: 0, unpaid: 0 };
    });
    familyTransactions.forEach((t) => {
      if (!map[t.familyMember]) {
        map[t.familyMember] = { total: 0, unpaid: 0 };
      }
      map[t.familyMember].total += t.amount;
      if (!t.familyRepaid) {
        map[t.familyMember].unpaid += t.amount;
      }
    });
    return map;
  }, [familyTransactions, settings.familyMembers]);

  const displayedTransactions = useMemo(() => {
    if (!selectedMember) return familyTransactions;
    return familyTransactions.filter((t) => t.familyMember === selectedMember);
  }, [familyTransactions, selectedMember]);

  const totalUnpaid = Object.values(memberTotals).reduce(
    (s, v) => s + v.unpaid,
    0
  );

  const allMembers = Array.from(
    new Set([...settings.familyMembers, ...familyTransactions.map((t) => t.familyMember)])
  ).filter(Boolean);

  const handleToggleRepaid = (id: string, currentRepaid: boolean) => {
    Alert.alert(
      currentRepaid ? '標記為未還款' : '標記為已還款',
      currentRepaid
        ? '將此筆代購標記為未還款？'
        : '確認家人已還款？',
      [
        { text: '取消', style: 'cancel' },
        { text: '確定', onPress: () => toggleFamilyRepaid(id) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>代買紀錄</Text>
        <Text style={styles.subtitle}>
          待收回金額：NT${totalUnpaid.toLocaleString()}
        </Text>

        {/* Member summary cards */}
        {allMembers.length === 0 ? (
          <View style={styles.emptyHint}>
            <Text style={styles.emptyHintText}>
              尚無代買紀錄。新增支出時開啟「代家人購買」即可在此追蹤。
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.memberScroll}
            contentContainerStyle={styles.memberContent}
          >
            <TouchableOpacity
              style={[
                styles.memberCard,
                selectedMember === null && styles.memberCardActive,
              ]}
              onPress={() => setSelectedMember(null)}
            >
              <Text style={styles.memberEmoji}>👥</Text>
              <Text style={styles.memberName}>全部</Text>
              <Text style={styles.memberUnpaid}>
                NT${totalUnpaid.toLocaleString()}
              </Text>
              <Text style={styles.memberUnpaidLabel}>未收回</Text>
            </TouchableOpacity>

            {allMembers.map((m) => {
              const info = memberTotals[m] ?? { total: 0, unpaid: 0 };
              return (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.memberCard,
                    selectedMember === m && styles.memberCardActive,
                  ]}
                  onPress={() =>
                    setSelectedMember(selectedMember === m ? null : m)
                  }
                >
                  <Text style={styles.memberEmoji}>👤</Text>
                  <Text style={styles.memberName}>{m}</Text>
                  <Text style={styles.memberUnpaid}>
                    NT${info.unpaid.toLocaleString()}
                  </Text>
                  <Text style={styles.memberUnpaidLabel}>未收回</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Transaction list */}
        {displayedTransactions.length === 0 && allMembers.length > 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>✅</Text>
            <Text style={styles.emptyText}>全部已結清</Text>
          </View>
        )}

        {displayedTransactions.map((t) => (
          <View key={t.id} style={styles.txCard}>
            <View style={styles.txLeft}>
              <Text style={styles.txEmoji}>{getCategoryEmoji(t.category)}</Text>
            </View>
            <View style={styles.txInfo}>
              <View style={styles.txTopRow}>
                <Text style={styles.txCategory}>{t.category}</Text>
                <Text style={styles.txMember}>👤 {t.familyMember}</Text>
              </View>
              <Text style={styles.txMeta}>
                {formatDate(t.date)}
                {t.note ? ` · ${t.note}` : ''}
              </Text>
            </View>
            <View style={styles.txRight}>
              <Text style={styles.txAmount}>
                NT${t.amount.toLocaleString()}
              </Text>
              <TouchableOpacity
                style={[
                  styles.repaidBtn,
                  t.familyRepaid && styles.repaidBtnDone,
                ]}
                onPress={() => handleToggleRepaid(t.id, t.familyRepaid)}
              >
                <Text
                  style={[
                    styles.repaidBtnText,
                    t.familyRepaid && styles.repaidBtnTextDone,
                  ]}
                >
                  {t.familyRepaid ? '已還款' : '未還款'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const PURPLE = '#7C6EE6';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F5F8',
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8 },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
    marginBottom: 16,
  },

  emptyHint: {
    backgroundColor: '#F0EDFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  emptyHintText: {
    fontSize: 13,
    color: '#7C6EE6',
    lineHeight: 20,
  },

  memberScroll: {
    marginHorizontal: -16,
    marginBottom: 16,
  },
  memberContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  memberCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    minWidth: 90,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  memberCardActive: {
    borderColor: PURPLE,
    backgroundColor: '#F0EDFF',
  },
  memberEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  memberName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  memberUnpaid: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  memberUnpaidLabel: {
    fontSize: 10,
    color: '#AAA',
  },

  txCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  txLeft: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txEmoji: {
    fontSize: 18,
  },
  txInfo: {
    flex: 1,
  },
  txTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  txCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  txMember: {
    fontSize: 11,
    color: '#888',
    backgroundColor: '#F0F0F5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  txMeta: {
    fontSize: 11,
    color: '#AAA',
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  repaidBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  repaidBtnDone: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  repaidBtnText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
  repaidBtnTextDone: {
    color: '#16A34A',
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyEmoji: { fontSize: 36 },
  emptyText: { fontSize: 15, color: '#AAA' },
});

import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface BudgetProgressProps {
  spent: number;
  budget: number;
  totalDays: number;
  daysElapsed: number;
}

export default function BudgetProgress({ spent, budget, totalDays, daysElapsed }: BudgetProgressProps) {
  const progressPct = budget > 0 ? Math.min(spent / budget, 1) : 0;
  const daysRemaining = Math.max(totalDays - daysElapsed, 0);
  const barWidth = Math.max(progressPct * 100, progressPct > 0 ? 2 : 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          本期預算（第 {daysElapsed}/{totalDays} 天）
        </Text>
        <Text style={styles.days}>剩 {daysRemaining} 天</Text>
      </View>
      <View style={styles.barBg}>
        <LinearGradient
          colors={['#667EEA', '#764BA2', '#F093FB', '#F5576C', '#FFA07A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.bar, { width: `${barWidth}%` as `${number}%` }]}
        />
      </View>
      <View style={styles.footer}>
        <Text style={styles.spent}>已用 NT${spent.toLocaleString()}</Text>
        <Text style={styles.budget}>預算 NT${budget.toLocaleString()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  days: {
    fontSize: 13,
    color: '#666',
  },
  barBg: {
    height: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  spent: {
    fontSize: 13,
    color: '#333',
  },
  budget: {
    fontSize: 13,
    color: '#888',
  },
});

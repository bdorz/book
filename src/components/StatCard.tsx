import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  title: string;
  amount: number;
  amountColor: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}

export default function StatCard({ title, amount, amountColor, iconName, iconColor }: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Ionicons name={iconName} size={18} color={iconColor} />
      </View>
      <Text style={[styles.amount, { color: amountColor }]}>
        NT${amount.toLocaleString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
  },
});

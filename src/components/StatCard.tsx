import React, {useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useColors, AppColors} from '../context/ThemeContext';

interface Props {
  title: string;
  amount: number;
  icon: string;
  color: string;
}

export default function StatCard({title, amount, icon, color}: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, {backgroundColor: color + '20'}]}>
        <Icon name={icon} size={20} color={color} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.amount, {color}]}>
        NT${amount.toLocaleString()}
      </Text>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: 14,
      padding: 14,
      margin: 4,
      elevation: 3,
      shadowColor: c.shadow,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 1,
      shadowRadius: 6,
    },
    iconWrap: {
      width: 36, height: 36, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    },
    title: {fontSize: 12, color: c.textSecondary, marginBottom: 4},
    amount: {fontSize: 16, fontWeight: '700'},
  });
}

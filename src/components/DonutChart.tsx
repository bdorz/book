import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Svg, {Path, G} from 'react-native-svg';
import {Colors} from '../constants/colors';

interface Segment {
  value: number;
  color: string;
  label: string;
}

interface Props {
  segments: Segment[];
  size?: number;
  strokeWidth?: number;
  title: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad)};
}

function arcPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const s1 = polarToCartesian(cx, cy, outerR, startAngle);
  const e1 = polarToCartesian(cx, cy, outerR, endAngle);
  const s2 = polarToCartesian(cx, cy, innerR, startAngle);
  const e2 = polarToCartesian(cx, cy, innerR, endAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${s1.x} ${s1.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${e1.x} ${e1.y}`,
    `L ${e2.x} ${e2.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${s2.x} ${s2.y}`,
    'Z',
  ].join(' ');
}

export default function DonutChart({
  segments,
  size = 100,
  strokeWidth = 22,
  title,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = (size - 8) / 2;
  const innerR = outerR - strokeWidth;
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  const hasData = total > 0;
  let currentAngle = 0;

  const topCategories = segments
    .filter(s => s.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Svg width={size} height={size}>
        <G>
          {hasData ? (
            segments
              .filter(s => s.value > 0)
              .map((seg, i) => {
                const pct = seg.value / total;
                const sweep = pct * 358;
                const start = currentAngle;
                const end = currentAngle + sweep;
                currentAngle = end + 1;
                return (
                  <Path
                    key={i}
                    d={arcPath(cx, cy, outerR, innerR, start, end)}
                    fill={seg.color}
                  />
                );
              })
          ) : (
            <Path
              d={arcPath(cx, cy, outerR, innerR, 0, 359.9)}
              fill={Colors.border}
            />
          )}
        </G>
      </Svg>
      <View style={styles.legend}>
        {hasData ? (
          topCategories.map((seg, i) => (
            <View key={i} style={styles.legendRow}>
              <View style={[styles.dot, {backgroundColor: seg.color}]} />
              <Text style={styles.legendLabel} numberOfLines={1}>
                {seg.label}
              </Text>
              <Text style={styles.legendPct}>
                ({Math.round((seg.value / total) * 100)}%)
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>無資料</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  legend: {
    marginTop: 8,
    width: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: Colors.textPrimary,
    flex: 1,
  },
  legendPct: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  emptyText: {
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'center',
  },
});

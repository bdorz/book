import React, {useMemo} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Svg, {Path, G} from 'react-native-svg';
import {useColors, AppColors} from '../context/ThemeContext';

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
  selectedLabel?: string;
  onSegmentPress?: (label: string) => void;
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad)};
}

function arcPath(cx: number, cy: number, outerR: number, innerR: number, startAngle: number, endAngle: number): string {
  const s1 = polarToCartesian(cx, cy, outerR, startAngle);
  const e1 = polarToCartesian(cx, cy, outerR, endAngle);
  const s2 = polarToCartesian(cx, cy, innerR, startAngle);
  const e2 = polarToCartesian(cx, cy, innerR, endAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return [`M ${s1.x} ${s1.y}`, `A ${outerR} ${outerR} 0 ${large} 1 ${e1.x} ${e1.y}`, `L ${e2.x} ${e2.y}`, `A ${innerR} ${innerR} 0 ${large} 0 ${s2.x} ${s2.y}`, 'Z'].join(' ');
}

export default function DonutChart({segments, size = 100, strokeWidth = 22, title, selectedLabel, onSegmentPress}: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = (size - 8) / 2;
  const innerR = outerR - strokeWidth;
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const hasData = total > 0;
  const topCategories = segments.filter(s => s.value > 0).sort((a, b) => b.value - a.value).slice(0, 3);

  // Pre-calculate angles so we can render selected arc larger
  let currentAngle = 0;
  const segmentAngles = segments.filter(s => s.value > 0).map(seg => {
    const sweep = (seg.value / total) * 358;
    const start = currentAngle;
    const end = start + sweep;
    currentAngle = end + 1;
    return {seg, start, end};
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Svg width={size} height={size}>
        <G>
          {hasData ? (
            segmentAngles.map(({seg, start, end}, i) => {
              const isSelected = seg.label === selectedLabel;
              const hasSelection = !!selectedLabel;
              const expandedOuter = isSelected ? outerR + 3 : outerR;
              const expandedInner = isSelected ? innerR - 2 : innerR;
              return (
                <Path
                  key={i}
                  d={arcPath(cx, cy, expandedOuter, expandedInner, start, end)}
                  fill={seg.color}
                  opacity={hasSelection && !isSelected ? 0.35 : 1}
                  onPress={() => onSegmentPress?.(seg.label)}
                />
              );
            })
          ) : (
            <Path d={arcPath(cx, cy, outerR, innerR, 0, 359.9)} fill={colors.border} />
          )}
        </G>
      </Svg>
      <View style={styles.legend}>
        {hasData ? (
          topCategories.map((seg, i) => {
            const isSelected = seg.label === selectedLabel;
            const hasSelection = !!selectedLabel;
            return (
              <TouchableOpacity key={i} style={styles.legendRow} onPress={() => onSegmentPress?.(seg.label)} activeOpacity={0.7}>
                <View style={[styles.dot, {backgroundColor: seg.color, opacity: hasSelection && !isSelected ? 0.35 : 1}]} />
                <Text style={[styles.legendLabel, {opacity: hasSelection && !isSelected ? 0.35 : 1}]} numberOfLines={1}>{seg.label}</Text>
                <Text style={[styles.legendPct, {opacity: hasSelection && !isSelected ? 0.35 : 1}]}>({Math.round((seg.value / total) * 100)}%)</Text>
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={styles.emptyText}>無資料</Text>
        )}
      </View>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: {alignItems: 'center', flex: 1},
    title: {fontSize: 13, fontWeight: '600', color: c.textPrimary, marginBottom: 8},
    legend: {marginTop: 8, width: '100%'},
    legendRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 3},
    dot: {width: 8, height: 8, borderRadius: 4, marginRight: 4},
    legendLabel: {fontSize: 11, color: c.textPrimary, flex: 1},
    legendPct: {fontSize: 11, color: c.textSecondary},
    emptyText: {fontSize: 11, color: c.textLight, textAlign: 'center'},
  });
}

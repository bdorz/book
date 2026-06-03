import Svg, { Circle, G } from 'react-native-svg';

export interface DonutSlice {
  value: number;
  color: string;
  label: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  size?: number;
  strokeWidth?: number;
}

export default function DonutChart({ data, size = 100, strokeWidth = 22 }: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <Svg width={size} height={size}>
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#E8E8E8"
          strokeWidth={strokeWidth}
        />
      </Svg>
    );
  }

  let cumulative = 0;

  return (
    <Svg width={size} height={size}>
      <G transform={`rotate(-90, ${cx}, ${cy})`}>
        {data.map((slice, i) => {
          const pct = slice.value / total;
          const dashOffset = -cumulative * circumference;
          cumulative += pct;
          return (
            <Circle
              key={i}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${pct * circumference} ${circumference}`}
              strokeDashoffset={dashOffset}
            />
          );
        })}
      </G>
    </Svg>
  );
}

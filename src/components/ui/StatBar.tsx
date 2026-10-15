import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

type Props = {
  label: string;
  value: number; // 0..100
  color: string;
  compact?: boolean;
  testID?: string;
};

export function StatBar({ label, value, color, compact, testID }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <View style={styles.row} testID={testID} accessibilityLabel={`${label} ${pct} percent`}>
      {!compact && <Text style={styles.label}>{label}</Text>}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.value}>{pct}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { ...typography.label, width: 72 },
  track: {
    flex: 1,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
  value: { ...typography.small, width: 40, textAlign: 'right', fontVariant: ['tabular-nums'] },
});

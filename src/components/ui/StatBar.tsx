import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

type Props = {
  label: string;
  value: number; // 0..100
  color: string;
  compact?: boolean;
  testID?: string;
  /**
   * Fixed label column width, so several bars in one card line up. Without it the label is at least 72 px and
   * grows to fit its word ("Relationship", "Performance") instead of breaking mid-word.
   */
  labelWidth?: number;
};

export function StatBar({ label, value, color, compact, testID, labelWidth }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <View style={styles.row} testID={testID} accessibilityLabel={`${label} ${pct} percent`}>
      {!compact && (
        <Text style={[styles.label, labelWidth !== undefined && { width: labelWidth, minWidth: 0 }]} numberOfLines={1}>
          {label}
        </Text>
      )}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.value}>{pct}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  // flexShrink 0: the label never yields width to the bar, so a long word stays on one line.
  label: { ...typography.label, minWidth: 72, flexShrink: 0 },
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

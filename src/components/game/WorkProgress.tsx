import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography, workUi } from '@/theme';

type Props = {
  /** Current level, 0..max. */
  level: number;
  max: number;
  color: string;
  label: string;
  /** Right-hand note, e.g. "Next: ₹1.2M/yr". */
  note?: string;
  testID?: string;
};

/**
 * A segmented level meter: one segment per level, filled up to the current one, and the
 * next segment outlined so the player can see what they are working towards.
 */
export function LevelMeter({ level, max, color, label, note, testID }: Props) {
  const clamped = Math.max(0, Math.min(max, level));
  return (
    <View
      style={styles.wrap}
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel={note ? `${label}. ${note}` : label}
      accessibilityValue={{ min: 0, max, now: clamped }}
    >
      <View style={styles.head}>
        <Text style={typography.label}>{label.toUpperCase()}</Text>
        {note ? (
          <Text style={styles.note} numberOfLines={1}>
            {note}
          </Text>
        ) : null}
      </View>
      <View style={styles.track}>
        {Array.from({ length: max }, (_, i) => {
          const filled = i < clamped;
          const next = i === clamped;
          return <View key={i} style={[styles.seg, filled ? { backgroundColor: color } : null, next ? { borderColor: color, borderStyle: 'dashed' } : null]} />;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  note: { ...typography.small, flexShrink: 1, textAlign: 'right' },
  track: { flexDirection: 'row', gap: 4 },
  seg: { flex: 1, height: 12, borderRadius: radius.sm, backgroundColor: workUi.meterEmpty, borderWidth: 1, borderColor: colors.cardBorder },
});

import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

type Props = {
  label: string;
  value: number;
  /** Bar colour. */
  color: string;
  /** Text colour of the value (defaults to the bar colour); lighter where the bar colour is too dark for text. */
  textColor?: string;
  /** One word for the value: "Close", "Rocky", "In love". */
  word: string;
  testID?: string;
};

/** A labelled meter: "RELATIONSHIP ........ 62% · Close" above a thick bar. */
export function PeopleMeter({ label, value, color, textColor, word, testID }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <View
      testID={testID}
      style={styles.wrap}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${label} ${pct} percent, ${word}`}
      accessibilityValue={{ min: 0, max: 100, now: pct }}
    >
      <View style={styles.top}>
        <Text style={styles.label} numberOfLines={1}>
          {label.toUpperCase()}
        </Text>
        <Text style={[styles.value, { color: textColor ?? color }]} numberOfLines={1}>
          {pct}% · {word}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  top: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm },
  label: { ...typography.label, flexShrink: 1 },
  value: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  track: { height: 12, borderRadius: radius.pill, backgroundColor: colors.bgElevated, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});

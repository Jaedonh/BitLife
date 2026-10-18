import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import type { HintTone } from './eventCard';

type Props = {
  label: string;
  /** Hint chip text (a cost, a gain, a consequence). */
  chip?: string;
  tone: HintTone;
  onPress: () => void;
  testID?: string;
  accessibilityLabel?: string;
};

/**
 * One answer on an event card. Every choice has the same weight, so none reads as the recommended one;
 * the hint sits in a chip inside the button it belongs to, coloured by what it means for the player.
 */
export function EventChoice({ label, chip, tone, onPress, testID, accessibilityLabel }: Props) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => [styles.choice, pressed && styles.pressed]}
    >
      <Text style={styles.label} numberOfLines={4}>
        {label}
      </Text>
      {chip ? (
        <View style={[styles.chip, chipStyles[tone]]}>
          <Text style={[styles.chipText, chipTextStyles[tone]]} numberOfLines={2}>
            {chip}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  choice: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: spacing.sm,
    rowGap: 6,
    minHeight: 52,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.bgElevated,
  },
  pressed: { backgroundColor: colors.card, borderColor: colors.primary, transform: [{ scale: 0.99 }] },
  label: { flexGrow: 1, flexShrink: 1, color: colors.text, fontSize: 16, lineHeight: 21, fontWeight: '600' },
  chip: {
    marginLeft: 'auto',
    maxWidth: '100%',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, lineHeight: 17, fontWeight: '700', fontVariant: ['tabular-nums'] },
});

/** Tinted chip backgrounds; every text colour keeps at least 4.5:1 against the button behind it. */
const chipStyles = StyleSheet.create({
  neutral: { backgroundColor: colors.card, borderColor: colors.cardBorder },
  cost: { backgroundColor: colors.card, borderColor: colors.cardBorder },
  credit: { backgroundColor: 'rgba(251, 191, 36, 0.12)', borderColor: 'rgba(251, 191, 36, 0.45)' },
  gain: { backgroundColor: 'rgba(74, 222, 128, 0.10)', borderColor: 'rgba(74, 222, 128, 0.40)' },
});

const chipTextStyles = StyleSheet.create({
  neutral: { color: colors.textMuted },
  cost: { color: colors.text },
  credit: { color: colors.warning },
  gain: { color: colors.success },
});

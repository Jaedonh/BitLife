import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing, workUi } from '@/theme';

export type BadgeTone = 'neutral' | 'good' | 'bad' | 'energy' | 'info';

export type BadgeSpec = { label: string; tone?: BadgeTone };

const TONES: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: workUi.badgeNeutralBg, fg: colors.textMuted },
  good: { bg: workUi.badgeGoodBg, fg: colors.success },
  bad: { bg: workUi.badgeBadBg, fg: colors.danger },
  energy: { bg: workUi.badgeEnergyBg, fg: colors.warning },
  info: { bg: workUi.badgeInfoBg, fg: colors.info },
};

/** A small, non-interactive pill: a requirement, a cost, an energy price, a count. */
export function Badge({ label, tone = 'neutral', testID }: BadgeSpec & { testID?: string }) {
  const t = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]} testID={testID}>
      <Text style={[styles.badgeText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

/** A wrapping row of badges. */
export function BadgeRow({ badges }: { badges: readonly BadgeSpec[] }) {
  if (!badges.length) return null;
  return (
    <View style={styles.badgeRow}>
      {badges.map((b, i) => (
        <Badge key={`${b.label}-${i}`} {...b} />
      ))}
    </View>
  );
}

/** One option in a ChipGroup: a 44 px pill that shows whether it is picked. */
export function Chip({
  label,
  selected,
  onPress,
  disabled,
  testID,
  accessibilityLabel,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ checked: !!selected, disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed, disabled && styles.disabled, style]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/** A row of mutually exclusive chips (a segmented control that wraps on narrow screens). */
export function ChipGroup({ children, label, style }: PropsWithChildren<{ label: string; style?: StyleProp<ViewStyle> }>) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.group, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3, maxWidth: '100%' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 2 },
  group: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: workUi.touch,
    minWidth: workUi.touch,
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: workUi.chipBorder,
    backgroundColor: workUi.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: workUi.chipSelectedBg, borderColor: workUi.chipSelectedBorder },
  chipText: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
  chipTextSelected: { color: colors.text },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.45 },
});

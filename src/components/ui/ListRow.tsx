import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

type Props = {
  title: string;
  /** Description, or for a disabled row the reason it is locked ("Age 12+", "Can't afford it"). */
  subtitle?: string;
  right?: string;
  rightColor?: string;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
  emoji?: string;
};

export function ListRow({ title, subtitle, right, rightColor, onPress, disabled, testID, emoji }: Props) {
  const tappable = !!onPress && !disabled;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled || !onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, disabled && styles.rowDisabled, pressed && tappable && styles.pressed]}
    >
      {emoji ? <Text style={[styles.emoji, disabled && styles.dimmed]}>{emoji}</Text> : null}
      <View style={styles.body}>
        <Text style={[typography.subheading, disabled && styles.dimmed]} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          // A locked row keeps its reason at full contrast: it is the most useful thing on the row.
          <Text style={[typography.small, disabled && styles.reason]} numberOfLines={3}>
            {disabled ? `🔒 ${subtitle}` : subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <Text style={[styles.right, rightColor ? { color: rightColor } : null, disabled && styles.rightDisabled]}>{right}</Text> : null}
      {/* No chevron on a locked row: it would promise a tap that does nothing. */}
      {tappable ? <Text style={styles.chevron}>›</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  pressed: { opacity: 0.85 },
  // Locked rows sit flatter (darker, no raised border) instead of fading out as a whole.
  rowDisabled: { backgroundColor: colors.bgElevated, borderColor: colors.bgElevated },
  dimmed: { opacity: 0.5 },
  // textMuted on bgElevated is about 7:1, well above WCAG AA.
  reason: { color: colors.textMuted },
  emoji: { fontSize: 22 },
  body: { flex: 1, gap: 2 },
  right: { ...typography.subheading, color: colors.money, fontVariant: ['tabular-nums'] },
  rightDisabled: { color: colors.textMuted },
  chevron: { color: colors.textFaint, fontSize: 22, marginLeft: -4 },
});

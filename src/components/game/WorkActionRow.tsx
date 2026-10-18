import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography, workUi } from '@/theme';

import { BadgeRow, type BadgeSpec } from './WorkChip';

type Props = {
  title: string;
  subtitle?: string;
  emoji?: string;
  /** Right-hand figure, e.g. a salary or a price. */
  value?: string;
  /** Unit right after the value in smaller type, e.g. "/yr". */
  valueSuffix?: string;
  /** Small caption under the value, e.g. "at level 5". */
  valueCaption?: string;
  valueColor?: string;
  badges?: readonly BadgeSpec[];
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
  accessibilityHint?: string;
};

/**
 * A tappable list row with room for badges (requirements, energy, uses left) and a
 * right-hand figure with a caption. Locked rows stay readable: only the title dims,
 * so the red "what you still need" badge keeps its contrast.
 */
export function WorkActionRow({ title, subtitle, emoji, value, valueSuffix, valueCaption, valueColor, badges = [], onPress, disabled, testID, accessibilityHint }: Props) {
  const interactive = !!onPress && !disabled;
  // Screen readers hear "€24,500 a year", not "€24,500 slash y r".
  const spokenValue = value ? [value, valueSuffix === '/yr' ? 'a year' : valueSuffix, valueCaption].filter(Boolean).join(' ') : undefined;
  const label = [title, subtitle, ...badges.map((b) => b.label), spokenValue].filter(Boolean).join('. ');
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={!interactive}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={onPress ? { disabled: !interactive } : undefined}
      style={({ pressed }) => [styles.row, !interactive && onPress ? styles.locked : null, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        {emoji ? <Text style={[styles.emoji, !interactive && onPress ? styles.dim : null]}>{emoji}</Text> : null}
        <View style={styles.body}>
          <Text style={[typography.subheading, !interactive && onPress ? styles.titleLocked : null]} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={typography.small} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {value ? (
          <View style={styles.valueCol}>
            <Text style={[styles.value, { color: valueColor ?? colors.money }]} numberOfLines={1}>
              {value}
              {valueSuffix ? <Text style={styles.suffix}>{valueSuffix}</Text> : null}
            </Text>
            {valueCaption ? <Text style={styles.caption}>{valueCaption}</Text> : null}
          </View>
        ) : null}
        {interactive ? <Text style={styles.chevron}>›</Text> : null}
      </View>
      {badges.length ? (
        // Badges run under the title and the price, so a narrow phone still fits them on one or two lines.
        <View style={emoji ? styles.badgesIndented : null}>
          <BadgeRow badges={badges} />
        </View>
      ) : null}
    </Pressable>
  );
}

const EMOJI_BOX = 28;

const styles = StyleSheet.create({
  row: {
    gap: spacing.xs,
    minHeight: 56,
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  locked: { backgroundColor: workUi.rowDisabledBg },
  pressed: { opacity: 0.85 },
  emoji: { fontSize: 22, width: EMOJI_BOX, textAlign: 'center' },
  dim: { opacity: 0.6 },
  body: { flex: 1, gap: 2 },
  titleLocked: { color: colors.textMuted },
  valueCol: { alignItems: 'flex-end', maxWidth: 120 },
  value: { ...typography.subheading, fontVariant: ['tabular-nums'] },
  suffix: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  caption: { ...typography.small, fontSize: 11 },
  chevron: { color: colors.textFaint, fontSize: 22, marginLeft: -4 },
  badgesIndented: { paddingLeft: EMOJI_BOX + spacing.md },
});

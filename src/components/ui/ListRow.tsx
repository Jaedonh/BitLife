import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

type Props = {
  title: string;
  subtitle?: string;
  right?: string;
  rightColor?: string;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
  emoji?: string;
};

export function ListRow({ title, subtitle, right, rightColor, onPress, disabled, testID, emoji }: Props) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled || !onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, disabled && styles.disabled]}
    >
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <View style={styles.body}>
        <Text style={typography.subheading} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={typography.small} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <Text style={[styles.right, rightColor ? { color: rightColor } : null]}>{right}</Text> : null}
      {onPress ? <Text style={styles.chevron}>›</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  emoji: { fontSize: 22 },
  body: { flex: 1, gap: 2 },
  right: { ...typography.subheading, color: colors.money, fontVariant: ['tabular-nums'] },
  chevron: { color: colors.textFaint, fontSize: 22, marginLeft: -4 },
});

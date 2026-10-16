import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
  /** Max label lines before tail truncation. Defaults to 1; raise it where the label must stay fully readable. */
  numberOfLines?: number;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  style,
  testID,
  accessibilityLabel,
  numberOfLines = 1,
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!isDisabled }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizes[size],
        variants[variant],
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text style={[styles.text, textSizes[size], variant === 'accent' && styles.textOnAccent]} numberOfLines={numberOfLines}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.45 },
  text: { color: colors.text, fontWeight: '700', textAlign: 'center' },
  textOnAccent: { color: '#0F0E1A' },
});

const sizes = StyleSheet.create({
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, minHeight: 36 },
  md: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, minHeight: 46 },
  lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl, minHeight: 56 },
});

const textSizes = StyleSheet.create({
  sm: { fontSize: 13 },
  md: { fontSize: 15 },
  lg: { fontSize: 17 },
});

const variants = StyleSheet.create({
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.bgElevated, borderColor: colors.cardBorder },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: '#7F1D1D' },
  accent: { backgroundColor: colors.accent },
});

import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

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
  /**
   * Max label lines. Defaults to 2: a label that does not fit on one line wraps and is set a little smaller,
   * so it stays readable instead of being cut with an ellipsis. Pass 1 only where a single line is a must.
   */
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
  numberOfLines = 2,
}: Props) {
  const isDisabled = disabled || loading;
  // The title whose label was seen wrapping. Latched per title so the smaller size never flips back and
  // forth when it happens to fit on one line again; a new title is measured afresh.
  const [wrappedTitle, setWrappedTitle] = useState<string | null>(null);
  const compact = numberOfLines > 1 && wrappedTitle === title;
  const onLabelLayout =
    numberOfLines > 1 && !compact
      ? (e: LayoutChangeEvent) => {
          if (e.nativeEvent.layout.height > textSizes[size].lineHeight * 1.5) setWrappedTitle(title);
        }
      : undefined;
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
        <Text
          style={[styles.text, compact ? compactTextSizes[size] : textSizes[size], variant === 'accent' && styles.textOnAccent]}
          numberOfLines={numberOfLines}
          onLayout={onLabelLayout}
          // Native last resort before an ellipsis (ignored on web).
          adjustsFontSizeToFit={Platform.OS !== 'web'}
          minimumFontScale={0.85}
        >
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
    // Tap targets are at least 44 x 44 at every size.
    minWidth: 44,
  },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.45 },
  text: { color: colors.text, fontWeight: '700', textAlign: 'center' },
  textOnAccent: { color: '#0F0E1A' },
});

const sizes = StyleSheet.create({
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, minHeight: 44 },
  md: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, minHeight: 48 },
  lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl, minHeight: 56 },
});

const textSizes = StyleSheet.create({
  sm: { fontSize: 13, lineHeight: 17 },
  md: { fontSize: 15, lineHeight: 20 },
  lg: { fontSize: 17, lineHeight: 22 },
});

/** Wrapped labels: about one point smaller with tighter leading, so two lines sit comfortably in the button. */
const compactTextSizes = StyleSheet.create({
  sm: { fontSize: 12, lineHeight: 15 },
  md: { fontSize: 14, lineHeight: 18 },
  lg: { fontSize: 15.5, lineHeight: 20 },
});

const variants = StyleSheet.create({
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.bgElevated, borderColor: colors.cardBorder },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: '#7F1D1D' },
  accent: { backgroundColor: colors.accent },
});

import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme';

type Props = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
}>;

export function Card({ children, style, onPress, disabled, testID }: Props) {
  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [styles.card, pressed && styles.pressed, disabled && styles.disabled, style]}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <Pressable testID={testID} style={[styles.card, style]} disabled>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.995 }] },
  disabled: { opacity: 0.5 },
});

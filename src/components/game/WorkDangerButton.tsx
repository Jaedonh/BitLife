import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing, workUi } from '@/theme';

/**
 * An outlined red button for irreversible actions (drop out, quit, sell, shut down).
 * Deliberately quieter than the filled buttons beside it and kept on its own row,
 * so it is not hit by accident; the caller still confirms before acting.
 */
export function DangerButton({ title, onPress, disabled, testID, accessibilityLabel, style }: { title: string; onPress: () => void; disabled?: boolean; testID?: string; accessibilityLabel?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed, disabled && styles.disabled, style]}
    >
      <Text style={styles.text} numberOfLines={1}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: workUi.touch,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.55)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: 'rgba(248, 113, 113, 0.12)' },
  disabled: { opacity: 0.45 },
  text: { color: colors.danger, fontSize: 14, fontWeight: '700' },
});

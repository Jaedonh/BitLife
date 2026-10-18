import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme';

/** A round avatar holding one emoji face (decorative: the name next to it carries the meaning). */
export function LegacyAvatar({ emoji, size = 48, style }: { emoji: string; size?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }, style]} accessible={false} importantForAccessibility="no-hide-descendants">
      <Text style={{ fontSize: Math.round(size * 0.56), lineHeight: Math.round(size * 0.72) }}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
});

import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Screen, T } from '@/components/ui';
import { colors, spacing, typography } from '@/theme';

/**
 * Unknown routes (an old link, a typo, a shared URL from another build) land here instead of
 * Expo's developer "Unmatched Route" page.
 */
export default function NotFoundScreen() {
  return (
    <Screen>
      <View style={styles.center} testID="not-found">
        <Text style={styles.logo} accessible={false}>
          ∞
        </Text>
        <Text style={styles.title} accessibilityRole="header">
          This page doesn&apos;t exist
        </Text>
        <T kind="small" style={styles.body}>
          The link may be old, or this life never happened. Your saves are safe.
        </T>
        <Button title="Back to LifeLoop" size="lg" onPress={() => router.replace('/')} style={styles.button} testID="not-found-home" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm, maxWidth: 520, width: '100%', alignSelf: 'center' },
  logo: { fontSize: 64, lineHeight: 72, color: colors.accent },
  title: { ...typography.title, textAlign: 'center' },
  body: { textAlign: 'center', fontSize: 15, lineHeight: 21, marginBottom: spacing.md },
  button: { alignSelf: 'stretch' },
});

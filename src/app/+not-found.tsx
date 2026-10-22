import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { BrandMark, Button, Screen, T } from '@/components/ui';
import { spacing, typography } from '@/theme';

/**
 * Unknown routes (an old link, a typo, a shared URL from another build) land here instead of
 * Expo's developer "Unmatched Route" page.
 */
export default function NotFoundScreen() {
  return (
    <Screen>
      <View style={styles.center} testID="not-found">
        <BrandMark size={96} />
        <Text style={styles.title} accessibilityRole="header">
          This page doesn&apos;t exist
        </Text>
        <T kind="small" style={styles.body}>
          The link may be old, or this life never happened. Your saves are safe.
        </T>
        <Button title="Back to Yearborn" size="lg" onPress={() => router.replace('/')} style={styles.button} testID="not-found-home" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm, maxWidth: 520, width: '100%', alignSelf: 'center' },
  title: { ...typography.title, textAlign: 'center' },
  body: { textAlign: 'center', fontSize: 15, lineHeight: 21, marginBottom: spacing.md },
  button: { alignSelf: 'stretch' },
});

import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography } from '@/theme';

export function Section({ title, children, right }: PropsWithChildren<{ title: string; right?: React.ReactNode }>) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={typography.label}>{title.toUpperCase()}</Text>
        {right}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm, marginBottom: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xs },
});

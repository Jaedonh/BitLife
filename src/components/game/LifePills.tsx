import { StyleSheet, Text, View } from 'react-native';

import { colors, lifeTints, radius, spacing } from '@/theme';
import type { Pill } from './lifeFormat';

/** Change pills: green for gains, red for losses, the stat's own colour as a dot before its name. */
export function LifePills({ pills, testID }: { pills: Pill[]; testID?: string }) {
  if (!pills.length) return null;
  return (
    <View style={styles.row} testID={testID}>
      {pills.map((p) => {
        const up = p.tone === 'up';
        return (
          <View
            key={p.key}
            style={[styles.pill, { backgroundColor: up ? lifeTints.up : lifeTints.down }]}
            accessible
            accessibilityLabel={p.a11y}
            testID={testID ? `${testID}-${p.key}` : undefined}
          >
            {p.dot ? <View style={[styles.dot, { backgroundColor: p.dot }]} /> : null}
            {p.label ? <Text style={styles.label}>{p.label}</Text> : null}
            <Text style={[styles.value, { color: up ? colors.success : colors.danger }]}>{p.value}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  dot: { width: 7, height: 7, borderRadius: 4 },
  label: { color: colors.text, fontSize: 12, fontWeight: '600' },
  value: { fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
});

import { useEffect, useMemo, useRef } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import type { LogEntry, LogKind } from '@/engine/types';
import { colors, spacing, typography } from '@/theme';

const KIND_COLOR: Partial<Record<LogKind, string>> = {
  good: colors.success,
  bad: colors.danger,
  money: colors.money,
  milestone: colors.accent,
  death: colors.danger,
  event: colors.info,
};

function Row({ item }: { item: LogEntry }) {
  if (item.kind === 'year') {
    return (
      <View style={styles.yearRow}>
        <View style={styles.rule} />
        <Text style={styles.year}>{item.text}</Text>
        <View style={styles.rule} />
      </View>
    );
  }
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: KIND_COLOR[item.kind] ?? colors.textFaint }]} />
      <Text style={[styles.text, item.kind === 'death' && styles.deathText]}>{item.text}</Text>
    </View>
  );
}

/** Chronological life log that keeps the newest entry in view. */
export function LifeLog({ log, footer = 0 }: { log: LogEntry[]; footer?: number }) {
  const ref = useRef<FlatList<LogEntry>>(null);
  const data = useMemo(() => log.slice(-400), [log]);
  const scrollToEnd = (animated: boolean) => {
    try {
      ref.current?.scrollToEnd({ animated });
    } catch {
      // list may not be laid out yet
    }
  };
  useEffect(() => {
    const t = setTimeout(() => scrollToEnd(true), 60);
    return () => clearTimeout(t);
  }, [data.length]);
  return (
    <FlatList
      ref={ref}
      testID="life-log"
      data={data}
      keyExtractor={(_, i) => String(i)}
      renderItem={({ item }) => <Row item={item} />}
      contentContainerStyle={[styles.list, { paddingBottom: footer + spacing.lg }]}
      initialNumToRender={60}
      maxToRenderPerBatch={60}
      windowSize={9}
      onContentSizeChange={() => scrollToEnd(false)}
      onLayout={() => scrollToEnd(false)}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm },
  yearRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.xs },
  rule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.cardBorder },
  year: { ...typography.label, color: colors.textMuted },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  text: { ...typography.body, flex: 1 },
  deathText: { color: colors.danger, fontWeight: '700' },
});

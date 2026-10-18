import { StyleSheet, Text, View } from 'react-native';

import type { LogKind } from '@/engine/types';
import { colors, radius, spacing, typography } from '@/theme';

import type { Memory } from './people';

const KIND_COLOR: Partial<Record<LogKind, string>> = {
  good: colors.success,
  bad: colors.danger,
  money: colors.money,
  milestone: colors.accent,
  event: colors.info,
};

/** The last few journal lines about a person, newest first, each with the age it happened at. */
export function PeopleMemories({ memories, emptyText }: { memories: Memory[]; emptyText: string }) {
  if (!memories.length) {
    return (
      <View style={styles.card} testID="person-memories">
        <Text style={typography.small}>{emptyText}</Text>
      </View>
    );
  }
  return (
    <View style={styles.card} testID="person-memories">
      {memories.map((m, i) => (
        <View key={`${m.age}-${i}`} style={[styles.item, i > 0 && styles.divider]}>
          <View style={styles.ageChip}>
            <Text style={styles.ageText}>{m.age === 0 ? 'Birth' : `Age ${m.age}`}</Text>
          </View>
          <View style={styles.body}>
            <View style={styles.line}>
              <View style={[styles.dot, { backgroundColor: KIND_COLOR[m.kind] ?? colors.textFaint }]} />
              <Text style={styles.text}>
                {m.text}
              </Text>
            </View>
            {m.choice ? (
              <Text style={styles.choice}>
                → {m.choice}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  item: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md, alignItems: 'flex-start' },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.cardBorder },
  ageChip: { minWidth: 56, alignItems: 'center', borderRadius: radius.pill, backgroundColor: colors.bgElevated, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  ageText: { fontSize: 12, fontWeight: '700', color: colors.textMuted, fontVariant: ['tabular-nums'] },
  body: { flex: 1, gap: 4 },
  line: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  text: { ...typography.body, flex: 1, fontSize: 14, lineHeight: 20 },
  choice: { ...typography.small, marginLeft: 14, color: colors.info },
});

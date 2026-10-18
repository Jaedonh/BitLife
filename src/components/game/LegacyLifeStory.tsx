import { useMemo } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LogEntry, LogKind } from '@/engine/types';
import { colors, radius, spacing, typography } from '@/theme';

import { storyByYear, type StoryYear } from './legacy';

const KIND_COLOR: Partial<Record<LogKind, string>> = {
  good: colors.success,
  bad: colors.danger,
  money: colors.money,
  milestone: colors.accent,
  death: colors.danger,
  event: colors.info,
};

function Year({ item }: { item: StoryYear }) {
  return (
    <View style={styles.year}>
      <Text style={styles.heading}>{item.heading}</Text>
      {item.entries.map((e, i) => (
        <View key={i} style={styles.line}>
          <View style={[styles.dot, { backgroundColor: KIND_COLOR[e.kind] ?? colors.textFaint }]} />
          <Text style={[styles.text, e.kind === 'death' && styles.death]}>{e.text}</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * The whole journal of a finished life, from birth to death, read top to bottom.
 * Unlike the life screen's journal it is never capped, so the first years are always there.
 */
export function LegacyLifeStory({ visible, onClose, subtitle, log }: { visible: boolean; onClose: () => void; /** "Ana Lima · 1990–2065". */ subtitle: string; log: readonly LogEntry[] }) {
  const insets = useSafeAreaInsets();
  const years = useMemo(() => storyByYear(log), [log]);
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.root, { paddingTop: insets.top }]} testID="life-story">
        <View style={styles.header}>
          <View style={styles.titles}>
            <Text style={typography.heading} accessibilityRole="header">
              Life story
            </Text>
            <Text style={typography.small} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close life story" hitSlop={8} style={({ pressed }) => [styles.close, pressed && styles.pressed]} testID="life-story-close">
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
        </View>
        <FlatList
          data={years}
          keyExtractor={(y) => y.key}
          renderItem={({ item }) => <Year item={item} />}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing.xxl }]}
          initialNumToRender={12}
          windowSize={7}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.cardBorder },
  titles: { flex: 1 },
  close: { minWidth: 64, minHeight: 44, paddingHorizontal: spacing.md, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.cardBorder },
  pressed: { opacity: 0.8 },
  closeText: { ...typography.subheading, color: colors.text },
  list: { padding: spacing.lg, gap: spacing.sm, maxWidth: 640, width: '100%', alignSelf: 'center' },
  year: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.cardBorder, padding: spacing.md, gap: spacing.xs },
  heading: { ...typography.label, color: colors.accent, marginBottom: 2 },
  line: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  text: { ...typography.body, flex: 1 },
  death: { color: colors.danger, fontWeight: '700' },
});

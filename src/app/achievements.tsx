import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { achievementFace, achievementProgress, unlockLine } from '@/components/game/achievements';
import { ScreenHeader } from '@/components/game/ScreenHeader';
import { Card, Screen, T } from '@/components/ui';
import { ACHIEVEMENT_GROUPS, ACHIEVEMENTS, type AchievementDef } from '@/data/achievements';
import { useSettingsStore, type AchievementUnlock } from '@/store/settingsStore';
import { colors, legacyColors, lifeTints, radius, spacing, typography } from '@/theme';

const MAX_CONTENT = 520;

export default function AchievementsScreen() {
  const unlocked = useSettingsStore((s) => s.achievements);
  const { unlocked: count, total } = achievementProgress(unlocked);
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <Screen>
      <ScreenHeader title="Achievements" subtitle={`${count} of ${total} unlocked`} />
      <ScrollView contentContainerStyle={styles.content} testID="achievements-list">
        <Card style={styles.progressCard}>
          <View style={styles.progressTop}>
            <Text style={typography.subheading}>Unlocked</Text>
            <Text style={styles.progressCount} testID="achievement-progress">
              {count} / {total}
            </Text>
          </View>
          <View style={styles.track} accessible accessibilityLabel={`${count} of ${total} achievements unlocked`}>
            <View style={[styles.fill, { width: `${pct}%` }]} />
          </View>
          <T kind="small">Achievements carry over from one life to the next. Secret ones stay hidden until you find them.</T>
        </Card>
        {ACHIEVEMENT_GROUPS.map((g) => {
          const defs = ACHIEVEMENTS.filter((a) => a.group === g.id);
          if (!defs.length) return null;
          const done = achievementProgress(unlocked, defs).unlocked;
          return (
            <View key={g.id} style={styles.group}>
              <View style={styles.groupHead}>
                <Text style={styles.groupTitle} accessibilityRole="header">
                  {g.title.toUpperCase()}
                </Text>
                <Text style={styles.groupCount}>
                  {done}/{defs.length}
                </Text>
              </View>
              <View style={styles.list}>
                {defs.map((def, i) => (
                  <AchievementRow key={def.id} def={def} unlock={Object.prototype.hasOwnProperty.call(unlocked, def.id) ? unlocked[def.id] : undefined} first={i === 0} />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

function AchievementRow({ def, unlock, first }: { def: AchievementDef; unlock?: AchievementUnlock; first: boolean }) {
  const done = !!unlock;
  const face = achievementFace(def, done);
  return (
    <View
      style={[styles.row, !first && styles.rowDivider]}
      accessible
      accessibilityLabel={`${face.name}. ${done ? 'Unlocked' : 'Locked'}. ${face.description}${unlock ? ` ${unlockLine(unlock)}.` : ''}`}
      testID={`achievement-${def.id}`}
    >
      <View style={[styles.badge, done ? styles.badgeDone : styles.badgeLocked]}>
        <Text style={[styles.emoji, !done && styles.silhouette]}>{face.emoji}</Text>
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.name, done ? styles.nameDone : null]} numberOfLines={2}>
          {face.name}
        </Text>
        <Text style={styles.description}>{face.description}</Text>
        {unlock ? (
          <Text style={styles.by} numberOfLines={2}>
            {unlockLine(unlock)}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.mark, done ? styles.markDone : null]} accessible={false}>
        {done ? '✓' : '🔒'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl, maxWidth: MAX_CONTENT, width: '100%', alignSelf: 'center' },
  progressCard: { gap: spacing.sm },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressCount: { ...typography.heading, color: colors.accent, fontVariant: ['tabular-nums'] },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.bgElevated, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.accent },
  group: { gap: spacing.sm },
  groupHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xs },
  groupTitle: typography.label,
  groupCount: { ...typography.label, color: colors.accent, fontVariant: ['tabular-nums'] },
  list: { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.md, minHeight: 64 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.cardBorder },
  badge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  badgeDone: { backgroundColor: lifeTints.accent, borderColor: colors.accent },
  badgeLocked: { backgroundColor: legacyColors.lockedTile, borderColor: colors.cardBorder },
  emoji: { fontSize: 22, lineHeight: 28, textAlign: 'center' },
  silhouette: { opacity: 0.3 },
  rowText: { flex: 1, gap: 2 },
  name: { ...typography.subheading, fontSize: 15, color: colors.textMuted },
  nameDone: { color: colors.text },
  description: { ...typography.small, lineHeight: 18 },
  by: { fontSize: 12, lineHeight: 16, color: colors.accent, fontWeight: '600' },
  mark: { width: 22, textAlign: 'center', fontSize: 13, color: colors.textFaint },
  markDone: { fontSize: 18, fontWeight: '800', color: colors.accent },
});

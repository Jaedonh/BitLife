import { memo, useEffect, useMemo, useRef } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import type { GameState, LogEntry } from '@/engine/types';
import { useLifeLedger, markOf } from '@/store/lifeLedger';
import { colors, lifeTints, onAccent, radius, spacing, typography } from '@/theme';
import { KIND_META, moneyPill, statPills, type Pill } from './lifeFormat';
import { groupLogByYear, newestFirst, splitChoice, yearChange, type YearChange, type YearGroup } from './lifeJournal';
import { LifePills } from './LifePills';

function EntryRow({ entry }: { entry: LogEntry }) {
  const meta = KIND_META[entry.kind];
  const { story, choice } = entry.kind === 'event' ? splitChoice(entry.text) : { story: entry.text, choice: null };
  return (
    <View style={styles.row} accessible accessibilityLabel={entry.kind === 'info' ? entry.text : `${meta.label}. ${entry.text}`}>
      <View style={styles.iconCol}>
        {meta.icon ? <Text style={styles.icon}>{meta.icon}</Text> : <View style={styles.dot} />}
      </View>
      <Text style={[styles.text, entry.kind === 'death' && styles.deathText]}>
        {story}
        {choice ? <Text style={styles.choice}>{` → ${choice}`}</Text> : null}
      </Text>
    </View>
  );
}

function cardPills(change: YearChange | null, countryCode: string): Pill[] {
  if (!change) return [];
  const pills = statPills(change.stats);
  const worth = moneyPill('worth', change.worth, countryCode, { label: 'Net worth', compact: true });
  if (worth) pills.push(worth);
  return pills;
}

type CardProps = { group: YearGroup; current: boolean; change: YearChange | null; countryCode: string };

function YearCardView({ group, current, change, countryCode }: CardProps) {
  const pills = cardPills(change, countryCode);
  return (
    <View style={[styles.card, current && styles.cardCurrent]} testID={`year-card-${group.age}`}>
      <View style={styles.cardHead}>
        <View style={[styles.ageChip, current && styles.ageChipCurrent]}>
          <Text style={[styles.ageChipText, current && styles.ageChipTextCurrent]}>Age {group.age}</Text>
        </View>
        {group.year !== null ? <Text style={styles.year}>{group.year}</Text> : null}
        {current ? <Text style={styles.now}>This year</Text> : null}
      </View>
      {group.entries.map((e, i) => (
        <EntryRow key={i} entry={e} />
      ))}
      {!group.entries.length ? <Text style={styles.quiet}>A quiet year.</Text> : null}
      {pills.length ? (
        <View style={styles.cardFoot}>
          <LifePills pills={pills} testID={current ? 'year-pills-current' : undefined} />
        </View>
      ) : null}
    </View>
  );
}

function sameChange(a: YearChange | null, b: YearChange | null): boolean {
  if (a === b) return true;
  if (!a || !b || a.worth !== b.worth) return false;
  const ka = Object.keys(a.stats) as (keyof YearChange['stats'])[];
  return ka.length === Object.keys(b.stats).length && ka.every((k) => a.stats[k] === b.stats[k]);
}

/**
 * A year's lines only change by growing, or by losing the quiet line its year outgrew (settleQuietYear), which changes
 * their count too, so a card only re-renders when its line count or its numbers moved.
 */
const YearCard = memo(
  YearCardView,
  (a, b) =>
    a.group.key === b.group.key &&
    a.group.entries.length === b.group.entries.length &&
    a.current === b.current &&
    a.countryCode === b.countryCode &&
    sameChange(a.change, b.change),
);

const Separator = () => <View style={styles.separator} />;

/**
 * The life story as one card per year, newest year on top: the current year is always at
 * scroll offset 0, so nothing has to be measured to keep it in view. The full history is
 * kept (the list is virtualized).
 */
export function LifeLog({ game, bottomInset = 0 }: { game: GameState; bottomInset?: number }) {
  const ref = useRef<FlatList<YearGroup>>(null);
  const lifeId = game.character.id;
  const age = game.character.age;
  const countryCode = game.character.countryCode;
  const groups = useMemo(() => newestFirst(groupLogByYear(game.log)), [game.log]);
  const ledgerLife = useLifeLedger((s) => s.lifeId);
  const marks = useLifeLedger((s) => s.marks);
  const now = useMemo(() => markOf(game), [game]);
  const ledger = ledgerLife === lifeId ? marks : null;

  // A new year (or a new life) goes on top: bring the top into view.
  const seen = useRef({ lifeId, count: groups.length });
  useEffect(() => {
    const prev = seen.current;
    seen.current = { lifeId, count: groups.length };
    if (prev.lifeId !== lifeId) ref.current?.scrollToOffset({ offset: 0, animated: false });
    else if (groups.length > prev.count) ref.current?.scrollToOffset({ offset: 0, animated: true });
  }, [lifeId, groups.length]);

  return (
    <FlatList
      ref={ref}
      testID="life-log"
      data={groups}
      keyExtractor={(g) => g.key}
      renderItem={({ item, index }) => (
        <YearCard group={item} current={index === 0 && item.age === age} change={ledger ? yearChange(ledger, item.age, age, now) : null} countryCode={countryCode} />
      )}
      ItemSeparatorComponent={Separator}
      contentContainerStyle={[styles.list, { paddingBottom: bottomInset + spacing.lg }]}
      initialNumToRender={4}
      maxToRenderPerBatch={6}
      windowSize={7}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  separator: { height: spacing.md },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  cardCurrent: { borderColor: colors.primary, backgroundColor: colors.card },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2 },
  ageChip: { backgroundColor: lifeTints.primary, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  ageChipCurrent: { backgroundColor: colors.accent },
  ageChipText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  ageChipTextCurrent: { color: onAccent },
  year: { ...typography.label, fontSize: 13 },
  now: { ...typography.label, color: colors.accent, marginLeft: 'auto' },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  iconCol: { width: 20, height: 21, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 13, lineHeight: 21 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textFaint },
  text: { ...typography.body, flex: 1 },
  choice: { color: colors.textMuted, fontWeight: '600' },
  deathText: { color: colors.danger, fontWeight: '700' },
  quiet: { ...typography.small, fontStyle: 'italic' },
  cardFoot: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.cardBorder, paddingTop: spacing.sm, marginTop: 2 },
});

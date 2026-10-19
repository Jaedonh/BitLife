import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PeopleAvatar } from '@/components/game/PeopleAvatar';
import { PeopleInteractionGrid } from '@/components/game/PeopleInteractions';
import { PeopleMemories } from '@/components/game/PeopleMemories';
import { PeopleMeter } from '@/components/game/PeopleMeter';
import {
  bondColor,
  bondWord,
  CONFIRM_INTERACTIONS,
  deathLine,
  divorceSettlement,
  interactionTiles,
  kindLabel,
  loveWord,
  occupationLabel,
  personFacts,
  personMemories,
  personName,
  personRef,
  type InteractionTile,
} from '@/components/game/people';
import { ScreenHeader } from '@/components/game/ScreenHeader';
import { Card, confirmAction, Screen, Section, StatBar, T } from '@/components/ui';
import type { GameState, LastResult, Person } from '@/engine/types';
import { formatMoney, formatMoneyFull } from '@/engine/util';
import { useGameStore } from '@/store/gameStore';
import { colors, peopleColors, radius, spacing, typography } from '@/theme';

/** "Age 42 · Teacher", "3 years old" for a pet. */
function ageLine(p: Person): string {
  if (p.kind === 'pet') return `${p.age} ${p.age === 1 ? 'year' : 'years'} old`;
  return [`Age ${p.age}`, occupationLabel(p)].filter(Boolean).join(' · ');
}

/** Title, message and button for the confirmation an irreversible interaction needs. */
function confirmCopy(tile: InteractionTile, p: Person, game: GameState): [string, string, string] {
  if (tile.def.id === 'divorce') {
    const settlement = divorceSettlement(game);
    const message = settlement > 0
      ? `The settlement will cost about ${formatMoney(settlement, game.character.countryCode)} (30% of your cash), and ${p.firstName} becomes your ex. You can't take this back.`
      : `${p.firstName} becomes your ex. You can't take this back.`;
    return [`Divorce ${p.firstName}?`, message, 'Divorce'];
  }
  return [`Break up with ${p.firstName}?`, `${p.firstName} becomes your ex and your relationship takes a big hit. You can't take this back.`, 'Break up'];
}

/** The outcome of the last interaction, shown right above the tiles (also covers refusals). */
function Notice({ result, countryCode }: { result: LastResult; countryCode: string }) {
  const border = result.kind === 'good' ? colors.success : result.kind === 'bad' ? colors.danger : colors.info;
  const money = result.moneyDelta ? `${result.moneyDelta > 0 ? '+' : '-'}${formatMoneyFull(Math.abs(result.moneyDelta), countryCode)}` : null;
  return (
    <View style={[styles.notice, { borderLeftColor: border }]} testID="person-notice" accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Text style={styles.noticeText}>{result.text}</Text>
      {money ? <Text style={[styles.noticeMoney, { color: result.moneyDelta! > 0 ? colors.money : colors.danger }]}>{money}</Text> : null}
    </View>
  );
}

export default function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = useGameStore((s) => s.game);
  const act = useGameStore((s) => s.act);
  const [notice, setNotice] = useState<LastResult | null>(null);
  if (!game) return <Redirect href="/" />;
  const p = id ? game.people[id] : undefined;
  if (!p) return <Redirect href="/relationships" />;
  const person = p;
  const cc = game.character.countryCode;
  const tiles = interactionTiles(game, person);
  const friendly = tiles.filter((t) => !t.risky);
  const risky = tiles.filter((t) => t.risky);
  const memories = personMemories(game, person);
  const facts = personFacts(person, game);
  // What the player calls them: "Mom", "Papa" (a second father), "Grandma Rosa", "Kai".
  const called = personRef(person, game.people);

  async function run(tile: InteractionTile) {
    if (CONFIRM_INTERACTIONS.has(tile.def.id)) {
      const [title, message, label] = confirmCopy(tile, person, game!);
      if (!(await confirmAction(title, message, label))) return;
    }
    const before = useGameStore.getState().game?.lastResult ?? null;
    act({ type: 'interact', personId: person.id, interaction: tile.def.id });
    const after = useGameStore.getState().game?.lastResult ?? null;
    setNotice(after && after !== before ? after : null);
  }

  return (
    <Screen>
      {/* Titled with what the player calls them ("Mom", "Kai"); the card below carries the full name and relation.
          Back is the header's own: the previous screen, or the life screen after a reload or a deep link. */}
      <ScreenHeader title={called} subtitle={person.alive ? undefined : 'In memoriam'} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card} testID="person-card">
          <View style={styles.headTop}>
            <PeopleAvatar person={person} size={72} />
            <View style={styles.headText}>
              <Text style={typography.heading} numberOfLines={3} testID="person-name">
                {personName(person)}
              </Text>
              <View style={styles.chipRow}>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{kindLabel(person)}</Text>
                </View>
                <Text style={styles.ageLine} numberOfLines={2}>
                  {person.alive ? ageLine(person) : deathLine(person)}
                </Text>
              </View>
            </View>
          </View>
          {person.alive ? (
            <>
              <PeopleMeter label="Relationship" value={person.relationship} color={bondColor(person.relationship)} word={bondWord(person.relationship)} testID="person-relationship" />
              {person.love !== undefined && (person.kind === 'lover' || person.kind === 'spouse') ? <PeopleMeter label="Love" value={person.love} color={peopleColors.love} textColor={peopleColors.loveText} word={loveWord(person.love)} testID="person-love" /> : null}
              <View style={styles.stats}>
                <StatBar label="Looks" value={person.looks} color={colors.looks} labelWidth={56} />
                <StatBar label="Smarts" value={person.smarts} color={colors.smarts} labelWidth={56} />
                <StatBar label="Health" value={person.health} color={colors.health} labelWidth={56} />
              </View>
            </>
          ) : null}
          <T kind="small" testID="person-facts">
            {facts.join(' ')}
          </T>
        </Card>

        {person.alive ? (
          <Section
            title="Interact"
            right={
              <View style={styles.energy} accessible accessibilityLabel={`Energy ${game.character.energy} of ${game.character.energyMax}`}>
                <Text style={styles.energyText}>
                  ⚡ {game.character.energy}/{game.character.energyMax} energy
                </Text>
              </View>
            }
          >
            {game.crime.inPrison ? <T kind="small">🔒 You are in {game.crime.juvenile ? 'juvenile detention' : 'prison'}: only phone calls and visits until you are released.</T> : null}
            {notice ? <Notice result={notice} countryCode={cc} /> : null}
            {friendly.length ? <PeopleInteractionGrid tiles={friendly} countryCode={cc} onPress={run} /> : null}
            {risky.length ? (
              <>
                <Text style={styles.riskyCaption}>RISKY</Text>
                <PeopleInteractionGrid tiles={risky} countryCode={cc} onPress={run} />
              </>
            ) : null}
            {!tiles.length ? <T kind="small">{`There is nothing you can do with ${called} yet.`}</T> : null}
          </Section>
        ) : null}

        <Section title="Memories">
          <PeopleMemories memories={memories} emptyText={person.alive ? `No memories with ${called} yet. ${person.farAway ? `Give ${person.gender === 'male' ? 'him' : 'her'} a call.` : 'Spend some time together.'}` : 'No memories recorded.'} />
        </Section>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  card: { gap: spacing.md },
  headTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headText: { flex: 1, gap: 6, minWidth: 0 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  chip: { backgroundColor: peopleColors.chipBg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  chipText: { color: peopleColors.chipText, fontSize: 13, fontWeight: '700' },
  ageLine: { ...typography.small, flexShrink: 1 },
  stats: { gap: spacing.sm },
  energy: { backgroundColor: peopleColors.energyBg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  energyText: { color: colors.warning, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  notice: { backgroundColor: peopleColors.noticeBg, borderRadius: radius.md, borderLeftWidth: 4, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, gap: 2 },
  noticeText: { ...typography.body, fontSize: 14, lineHeight: 20 },
  noticeMoney: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  riskyCaption: { ...typography.label, color: colors.danger, marginTop: spacing.xs, paddingHorizontal: spacing.xs },
});

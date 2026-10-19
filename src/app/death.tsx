import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { achievementProgress, unlockedSince } from '@/components/game/achievements';
import { LegacyHeirCard } from '@/components/game/LegacyHeirCard';
import { LegacyLifeStory } from '@/components/game/LegacyLifeStory';
import { LegacyTombstone } from '@/components/game/LegacyTombstone';
import { canContinueLine, causeLine, heirInheritance, lifespanLine, livingHeirs, obituaryShareText } from '@/components/game/legacy';
import { shareNotice, shareText } from '@/components/game/legacyShare';
import { Button, Card, Section, Screen, T } from '@/components/ui';
import { getCountry } from '@/data/countries';
import { RIBBON_BY_ID } from '@/engine';
import { formatMoneyFull } from '@/engine/util';
import { useRewarded } from '@/hooks/useRewarded';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, spacing, typography } from '@/theme';

export default function DeathScreen() {
  const game = useGameStore((s) => s.game);
  const newLife = useGameStore((s) => s.newLife);
  const continueAsHeir = useGameStore((s) => s.continueAsHeir);
  const canUseRewarded = useGameStore((s) => s.canUseRewarded);
  const { notice: rewardedNotice, run: runRewarded } = useRewarded();
  const premium = useSettingsStore((s) => s.premium);
  const showKarma = useSettingsStore((s) => s.settings.showKarma);
  const graveyard = useSettingsStore((s) => s.graveyard);
  const achievements = useSettingsStore((s) => s.achievements);
  const [storyOpen, setStoryOpen] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  if (!game) return <Redirect href="/" />;
  if (game.alive) return <Redirect href="/life" />;
  const d = game.death!;
  const c = game.character;
  const name = `${c.firstName} ${c.lastName}`;
  const country = getCountry(c.countryCode);
  const ribbon = RIBBON_BY_ID[d.ribbonId];
  // This life is already in the graveyard, so a first-time ribbon has exactly one grave.
  const newRibbon = graveyard.filter((g) => g.ribbonId === d.ribbonId).length <= 1;
  const heirs = livingHeirs(game);
  const inheritance = heirInheritance(game);
  const canContinue = canContinueLine(game, premium);
  const revive = canUseRewarded('secondChance');
  const progress = achievementProgress(achievements);
  const newThisLife = unlockedSince(achievements, game.createdAt);

  const share = async () => {
    setShareMsg(null);
    const outcome = await shareText(`${name}'s obituary`, obituaryShareText({ name, birthYear: c.birthYear, deathYear: game.year, ribbonId: d.ribbonId, obituary: d.obituary, epitaph: d.epitaph }));
    setShareMsg(shareNotice(outcome));
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <LegacyTombstone name={name} lifespan={lifespanLine(c.countryCode, c.birthYear, game.year, c.age)} cause={causeLine(d.cause)} ribbon={ribbon} newRibbon={newRibbon} epitaph={d.epitaph} />

        {heirs.length ? (
          <View style={styles.group}>
            <Text style={styles.label}>CONTINUE THE FAMILY LINE</Text>
            {!canContinue ? (
              <T kind="small" style={styles.note}>
                Free play includes one hand-off per family line, and this line has used it. Premium unlocks unlimited generations.
              </T>
            ) : null}
            {heirs.map((h) => (
              <LegacyHeirCard
                key={h.id}
                heir={h}
                inheritance={inheritance}
                countryCode={c.countryCode}
                locked={!canContinue}
                onPress={
                  canContinue
                    ? () => {
                        continueAsHeir(h.id);
                        router.replace('/life');
                      }
                    : () => router.push('/premium')
                }
              />
            ))}
          </View>
        ) : (
          <T kind="small" style={styles.note}>
            No living children carry on the family line.
          </T>
        )}

        {revive ? (
          <View style={styles.group}>
            <Button testID="second-chance" title={premium ? '✨ Second chance (premium)' : '📺 Watch an ad for a second chance'} variant="accent" size="lg" onPress={() => void runRewarded('secondChance').then((r) => r === 'granted' && router.replace('/life'))} />
            {rewardedNotice ? (
              <T kind="small" style={styles.center} testID="rewarded-notice">
                {rewardedNotice}
              </T>
            ) : null}
          </View>
        ) : null}

        <View style={styles.row}>
          <Button
            testID="death-new-life"
            title="New life"
            variant={heirs.length || revive ? 'secondary' : 'primary'}
            onPress={() => {
              newLife({});
              router.replace('/life');
            }}
            style={styles.flex}
            accessibilityLabel="Start a new life"
          />
          <Button title="Menu" variant="secondary" onPress={() => router.replace('/')} style={styles.flex} testID="death-menu" accessibilityLabel="Back to menu" />
        </View>

        <Button
          title={`🏆 Achievements · ${progress.unlocked}/${progress.total}${newThisLife ? ` · ${newThisLife} new this life` : ''}`}
          variant="secondary"
          onPress={() => router.push('/achievements')}
          testID="death-achievements"
          accessibilityLabel={`Achievements, ${progress.unlocked} of ${progress.total} unlocked${newThisLife ? `, ${newThisLife} new this life` : ''}`}
        />

        <Section title="Your story">
          <View style={styles.row}>
            <Button title="📖 Read life story" variant="secondary" onPress={() => setStoryOpen(true)} style={styles.flex} testID="read-life-story" accessibilityLabel="Read life story" />
            <Button title="Share" variant="secondary" onPress={() => void share()} style={styles.share} testID="share-obituary" accessibilityLabel="Share obituary" />
          </View>
          {shareMsg ? (
            <T kind="small" style={styles.center} testID="share-notice">
              {shareMsg}
            </T>
          ) : null}
          <Card style={styles.card}>
            <T kind="label">OBITUARY</T>
            <Text style={typography.body} testID="obituary">
              {d.obituary}
            </Text>
          </Card>
          <Card style={styles.card} testID="life-in-numbers">
            <T kind="label">LIFE IN NUMBERS</T>
            <Stat label="Net worth" value={formatMoneyFull(d.netWorth, c.countryCode)} />
            <Stat label="Country" value={`${country.flag} ${country.name}`} />
            <Stat label="Generation" value={String(game.generation)} />
            <Stat label="Jobs held" value={String(game.counters.jobsHeld)} />
            <Stat label="Marriages / children" value={`${game.counters.marriages} / ${game.counters.children}`} />
            <Stat label="Events faced" value={String(game.counters.eventsFaced)} />
            {showKarma ? <Stat label="Karma" value={`${c.karma}%`} testID="death-karma" /> : null}
          </Card>
        </Section>
      </ScrollView>
      <LegacyLifeStory visible={storyOpen} onClose={() => setStoryOpen(false)} subtitle={`${name} · ${c.birthYear}–${game.year}`} log={game.log} />
    </Screen>
  );
}

function Stat({ label, value, testID }: { label: string; value: string; testID?: string }) {
  return (
    <View style={styles.kv} testID={testID}>
      <Text style={styles.k}>{label}</Text>
      <Text style={styles.v}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl, maxWidth: 520, width: '100%', alignSelf: 'center' },
  group: { gap: spacing.sm },
  label: { ...typography.label, paddingHorizontal: spacing.xs },
  note: { paddingHorizontal: spacing.xs },
  center: { textAlign: 'center' },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  share: { flexBasis: 96 },
  card: { gap: spacing.sm },
  kv: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  k: { color: colors.textMuted, fontSize: 14 },
  v: { color: colors.text, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
});

import { Redirect, router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, ListRow, Screen, Section, T } from '@/components/ui';
import { getCountry } from '@/data/countries';
import { RIBBON_BY_ID } from '@/engine';
import { formatMoneyFull } from '@/engine/util';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, radius, spacing, typography } from '@/theme';

const FREE_GENERATIONS = 2;

export default function DeathScreen() {
  const game = useGameStore((s) => s.game);
  const newLife = useGameStore((s) => s.newLife);
  const continueAsHeir = useGameStore((s) => s.continueAsHeir);
  const rewarded = useGameStore((s) => s.rewarded);
  const canUseRewarded = useGameStore((s) => s.canUseRewarded);
  const premium = useSettingsStore((s) => s.premium);
  if (!game) return <Redirect href="/" />;
  if (game.alive) return <Redirect href="/life" />;
  const d = game.death!;
  const c = game.character;
  const ribbon = RIBBON_BY_ID[d.ribbonId];
  const heirs = Object.values(game.people).filter((p) => p.kind === 'child' && p.alive);
  const canContinue = premium || game.generation < FREE_GENERATIONS;
  const revive = canUseRewarded('secondChance');

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.stone} testID="tombstone">
          <Text style={styles.rip}>R.I.P.</Text>
          <Text style={styles.name}>
            {c.firstName} {c.lastName}
          </Text>
          <Text style={styles.years}>
            {c.birthYear} – {game.year} · aged {c.age}
          </Text>
          <Text style={styles.cause}>Died of {d.cause}</Text>
          <View style={styles.ribbon}>
            <Text style={styles.ribbonEmoji}>{ribbon?.emoji ?? '🎗️'}</Text>
            <Text style={styles.ribbonName}>{ribbon?.name ?? 'Ribbon'}</Text>
            <Text style={typography.small}>{ribbon?.description}</Text>
          </View>
          <Text style={styles.epitaph}>“{d.epitaph}”</Text>
        </View>

        <Card style={styles.card}>
          <T kind="label">OBITUARY</T>
          <Text style={typography.body}>{d.obituary}</Text>
        </Card>

        <Card style={styles.card}>
          <T kind="label">LIFE IN NUMBERS</T>
          <Stat label="Net worth" value={formatMoneyFull(d.netWorth, c.countryCode)} />
          <Stat label="Country" value={`${getCountry(c.countryCode).flag} ${getCountry(c.countryCode).name}`} />
          <Stat label="Generation" value={String(game.generation)} />
          <Stat label="Jobs held" value={String(game.counters.jobsHeld)} />
          <Stat label="Marriages / children" value={`${game.counters.marriages} / ${game.counters.children}`} />
          <Stat label="Events faced" value={String(game.counters.eventsFaced)} />
          <Stat label="Karma" value={`${c.karma}%`} />
        </Card>

        {revive ? (
          <Button testID="second-chance" title={premium ? '✨ Second chance (premium)' : '📺 Watch an ad for a second chance'} variant="accent" size="lg" onPress={() => void rewarded('secondChance').then((r) => r === 'granted' && router.replace('/life'))} />
        ) : null}

        {heirs.length ? (
          <Section title="Continue as your child">
            {!canContinue ? <T kind="small">Free play includes {FREE_GENERATIONS} generations. Premium unlocks unlimited generations.</T> : null}
            {heirs.map((h) => (
              <ListRow key={h.id} emoji={h.gender === 'male' ? '👦' : '👧'} title={`${h.firstName} ${h.lastName}`} subtitle={`${h.age} years old`} onPress={canContinue ? () => { continueAsHeir(h.id); router.replace('/life'); } : () => router.push('/premium')} testID="continue-heir" />
            ))}
          </Section>
        ) : null}

        <Button
          testID="death-new-life"
          title="Start a new life"
          size="lg"
          onPress={() => {
            newLife({});
            router.replace('/life');
          }}
        />
        <Button title="Back to menu" variant="ghost" onPress={() => router.replace('/')} testID="death-menu" />
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kv}>
      <Text style={styles.k}>{label}</Text>
      <Text style={styles.v}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl, maxWidth: 520, width: '100%', alignSelf: 'center' },
  stone: { backgroundColor: '#2A2740', borderRadius: radius.lg, borderTopLeftRadius: 80, borderTopRightRadius: 80, padding: spacing.xl, paddingTop: spacing.xxl, alignItems: 'center', gap: spacing.xs, borderWidth: 2, borderColor: colors.cardBorder },
  rip: { ...typography.label, fontSize: 14, letterSpacing: 4, color: colors.textMuted },
  name: { ...typography.title, textAlign: 'center' },
  years: { ...typography.small, fontSize: 14 },
  cause: { ...typography.body, color: colors.danger, marginTop: 4 },
  ribbon: { alignItems: 'center', marginTop: spacing.md, gap: 2 },
  ribbonEmoji: { fontSize: 36 },
  ribbonName: { ...typography.heading, color: colors.accent },
  epitaph: { ...typography.body, fontStyle: 'italic', color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
  card: { gap: spacing.sm },
  kv: { flexDirection: 'row', justifyContent: 'space-between' },
  k: { color: colors.textMuted, fontSize: 14 },
  v: { color: colors.text, fontSize: 14, fontWeight: '600' },
});

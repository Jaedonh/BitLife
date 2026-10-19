import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EventModal } from '@/components/game/EventModal';
import { ScreenHeader } from '@/components/game/ScreenHeader';
import { WorkActionRow } from '@/components/game/WorkActionRow';
import type { BadgeSpec } from '@/components/game/WorkChip';
import { Disclosure } from '@/components/game/WorkDisclosure';
import { Button, Card, Screen, Section, T } from '@/components/ui';
import { ACTIVITIES, type ActivityDef, type ActivityGroup } from '@/data/activities';
import { actionCount, activityAvailability, crimeAvailability, statBoostGain } from '@/engine';
import { crimesInEra } from '@/engine/systems/crime';
import { formatMoney } from '@/engine/util';
import { useRewarded } from '@/hooks/useRewarded';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, radius, spacing, workUi } from '@/theme';

const GROUPS: { id: ActivityGroup; title: string }[] = [
  { id: 'mind_body', title: 'Mind & body' },
  { id: 'doctor', title: 'Doctor' },
  { id: 'fun', title: 'Fun' },
];

/** Activities further than this many years from their minimum age wait under "Unlocks later". */
const PREVIEW_YEARS = 4;

const inYears = (n: number) => (n === 1 ? 'next year' : `in ${n} years`);

/**
 * The energy an activity takes. One that takes none has no chip: "No energy" would read as "you are
 * out of energy", which is what "No energy left" means everywhere else.
 */
function energyBadges(energy: number): BadgeSpec[] {
  return energy > 0 ? [{ label: `⚡ ${energy}`, tone: 'energy' }] : [];
}

export default function ActivitiesScreen() {
  const game = useGameStore((s) => s.game);
  const act = useGameStore((s) => s.act);
  const canUseRewarded = useGameStore((s) => s.canUseRewarded);
  const { notice: rewardedNotice, run: runRewarded } = useRewarded();
  const premium = useSettingsStore((s) => s.premium);
  const [laterOpen, setLaterOpen] = useState(false);
  if (!game) return <Redirect href="/" />;
  const boost = canUseRewarded('statBoost');
  const cc = game.character.countryCode;
  const yr = game.year;
  const age = game.character.age;
  const { energy, energyMax } = game.character;
  const soon = (a: ActivityDef) => a.minAge - age <= PREVIEW_YEARS;
  const later = ACTIVITIES.filter((a) => !soon(a)).sort((a, b) => a.minAge - b.minAge);

  return (
    <Screen>
      <ScreenHeader title="Activities" subtitle={`Energy ${energy}/${energyMax} this year`} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.energyCard} testID="energy-card">
          <View
            style={styles.pips}
            accessibilityRole="progressbar"
            accessibilityLabel={`Energy: ${energy} of ${energyMax} left this year`}
            accessibilityValue={{ min: 0, max: energyMax, now: energy }}
          >
            {Array.from({ length: energyMax }, (_, i) => (
              <View key={i} style={[styles.pip, i < energy ? styles.pipOn : null]} />
            ))}
          </View>
          <View style={styles.flex}>
            <T kind="subheading">
              ⚡ {energy} of {energyMax} energy left
            </T>
            <T kind="small">Activities marked ⚡ take some. It refills when you age up.</T>
          </View>
        </Card>

        {boost ? (
          <Section title={premium ? 'Premium boost' : 'Watch an ad for a boost'}>
            <View style={styles.boostRow}>
              {(['happiness', 'health', 'smarts', 'looks'] as const).map((stat) => {
                // Show what the boost would really add; a stat already at its limit is not offered.
                const gain = statBoostGain(game, stat);
                const label = `${stat[0]!.toUpperCase()}${stat.slice(1)}`;
                return (
                  <Button
                    key={stat}
                    testID={`boost-${stat}`}
                    size="sm"
                    variant="accent"
                    style={styles.boostBtn}
                    disabled={gain <= 0}
                    title={gain > 0 ? `${premium ? '✨' : '📺'} ${label} +${gain}` : `${label} maxed`}
                    onPress={() => void runRewarded('statBoost', stat)}
                  />
                );
              })}
            </View>
            {rewardedNotice ? (
              <T kind="small" testID="rewarded-notice">
                {rewardedNotice}
              </T>
            ) : null}
          </Section>
        ) : null}

        {GROUPS.map((g) => {
          // What the character can already do comes first; the next few years' unlocks follow, soonest first.
          const items = ACTIVITIES.filter((a) => a.group === g.id && soon(a)).sort((a, b) => Math.max(0, a.minAge - age) - Math.max(0, b.minAge - age));
          if (!items.length) return null;
          return (
            <Section key={g.id} title={g.title}>
              {items.map((a) => {
                const avail = activityAvailability(game, a);
                const cost = avail.cost ?? 0;
                const locked = age < a.minAge;
                const used = actionCount(game, `activity:${a.id}`);
                const badges: BadgeSpec[] = locked ? [] : energyBadges(a.energy);
                if (!locked && a.perYear > 0) badges.push({ label: `${used}/${a.perYear} this year`, tone: used >= a.perYear ? 'bad' : 'neutral' });
                return (
                  <WorkActionRow
                    key={a.id}
                    emoji={a.emoji}
                    title={a.name}
                    subtitle={avail.available ? a.description : locked ? `Unlocks at ${a.minAge} · ${inYears(a.minAge - age)}` : avail.reason}
                    badges={badges}
                    value={cost > 0 ? formatMoney(cost, cc, yr) : 'Free'}
                    valueColor={cost > 0 ? colors.money : colors.textMuted}
                    onPress={() => act({ type: 'activity', id: a.id })}
                    disabled={!avail.available}
                    testID={`activity-${a.id}`}
                  />
                );
              })}
            </Section>
          );
        })}

        {age >= 12 ? (
          <Section title="Crime">
            <T kind="small">Risky, illegal, and bad for your karma. Consequences are real.</T>
            {crimesInEra(game).filter((c) => age >= c.minAge).map((c) => {
              const avail = crimeAvailability(game, c);
              return (
                <WorkActionRow
                  key={c.id}
                  emoji={c.emoji}
                  title={c.name}
                  subtitle={avail.available ? c.description : avail.reason}
                  badges={energyBadges(c.energy)}
                  onPress={() => act({ type: 'crime', id: c.id })}
                  disabled={!avail.available}
                  testID={`crime-${c.id}`}
                />
              );
            })}
          </Section>
        ) : null}

        {later.length ? (
          <View style={styles.later}>
            <Disclosure
              title={`Unlocks later (${later.length})`}
              summary={`Next: ${later[0]!.name} at ${later[0]!.minAge}`}
              emoji="🔒"
              open={laterOpen}
              onToggle={() => setLaterOpen((o) => !o)}
              testID="unlocks-later"
            >
              {later.map((a) => (
                <View key={a.id} style={styles.laterRow} accessible accessibilityLabel={`${a.name}, unlocks at ${a.minAge}, ${inYears(a.minAge - age)}`}>
                  <Text style={styles.laterEmoji}>{a.emoji}</Text>
                  <T kind="body" style={styles.flex} numberOfLines={1}>
                    {a.name}
                  </T>
                  <T kind="small">
                    Age {a.minAge} · {inYears(a.minAge - age)}
                  </T>
                </View>
              ))}
            </Disclosure>
          </View>
        ) : null}
      </ScrollView>
      {/* An arrest opens the court card right here (the life screen underneath cannot present it). */}
      <EventModal />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  flex: { flex: 1 },
  energyCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  pips: { flexDirection: 'row', gap: 4 },
  pip: { width: 10, height: 26, borderRadius: radius.sm, backgroundColor: workUi.meterEmpty, borderWidth: 1, borderColor: colors.cardBorder },
  pipOn: { backgroundColor: colors.warning, borderColor: colors.warning },
  boostRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  boostBtn: { flexBasis: '47%', flexGrow: 1, minHeight: workUi.touch },
  later: { marginBottom: spacing.lg },
  laterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: workUi.touch,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: workUi.rowDisabledBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.cardBorder,
  },
  laterEmoji: { fontSize: 18, opacity: 0.7 },
});

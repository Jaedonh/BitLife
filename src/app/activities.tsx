import { Redirect } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ScreenHeader } from '@/components/game/ScreenHeader';
import { Button, ListRow, Screen, Section, T } from '@/components/ui';
import { ACTIVITIES, type ActivityGroup } from '@/data/activities';
import { CRIMES } from '@/data/crimes';
import { activityAvailability, crimeAvailability } from '@/engine';
import { formatMoney } from '@/engine/util';
import { useRewarded } from '@/hooks/useRewarded';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { spacing } from '@/theme';

const GROUPS: { id: ActivityGroup; title: string }[] = [
  { id: 'mind_body', title: 'Mind & body' },
  { id: 'doctor', title: 'Doctor' },
  { id: 'fun', title: 'Fun' },
];

export default function ActivitiesScreen() {
  const game = useGameStore((s) => s.game);
  const act = useGameStore((s) => s.act);
  const canUseRewarded = useGameStore((s) => s.canUseRewarded);
  const { notice: rewardedNotice, run: runRewarded } = useRewarded();
  const premium = useSettingsStore((s) => s.premium);
  if (!game) return <Redirect href="/" />;
  const boost = canUseRewarded('statBoost');
  const cc = game.character.countryCode;
  const age = game.character.age;
  return (
    <Screen>
      <ScreenHeader title="Activities" subtitle={`Energy ${game.character.energy}/${game.character.energyMax} this year`} />
      <ScrollView contentContainerStyle={styles.content}>
        {boost ? (
          <Section title={premium ? 'Premium boost' : 'Watch an ad for a boost'}>
            <View style={styles.boostRow}>
              {(['happiness', 'health', 'smarts', 'looks'] as const).map((stat) => (
                <Button key={stat} testID={`boost-${stat}`} size="sm" variant="accent" style={styles.boostBtn} title={`${premium ? '✨' : '📺'} ${stat === 'happiness' ? 'Happiness +30' : stat === 'health' ? 'Health +30' : stat === 'smarts' ? 'Smarts +16' : 'Looks +16'}`} onPress={() => void runRewarded('statBoost', stat)} />
              ))}
            </View>
            {rewardedNotice ? (
              <T kind="small" testID="rewarded-notice">
                {rewardedNotice}
              </T>
            ) : null}
          </Section>
        ) : null}
        {GROUPS.map((g) => {
          const items = ACTIVITIES.filter((a) => a.group === g.id && age >= Math.min(a.minAge, 6));
          if (!items.length) return null;
          return (
            <Section key={g.id} title={g.title}>
              {items.map((a) => {
                const avail = activityAvailability(game, a);
                const cost = avail.cost ?? 0;
                return (
                  <ListRow
                    key={a.id}
                    emoji={a.emoji}
                    title={a.name}
                    subtitle={avail.available ? a.description : avail.reason}
                    right={cost > 0 ? formatMoney(cost, cc) : 'Free'}
                    onPress={avail.available ? () => act({ type: 'activity', id: a.id }) : undefined}
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
            {CRIMES.filter((c) => age >= c.minAge).map((c) => {
              const avail = crimeAvailability(game, c);
              return <ListRow key={c.id} emoji={c.emoji} title={c.name} subtitle={avail.available ? c.description : avail.reason} onPress={avail.available ? () => act({ type: 'crime', id: c.id }) : undefined} disabled={!avail.available} testID={`crime-${c.id}`} />;
            })}
          </Section>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  boostRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  boostBtn: { flexBasis: '47%', flexGrow: 1 },
});

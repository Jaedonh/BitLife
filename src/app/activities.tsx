import { Redirect } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { ScreenHeader } from '@/components/game/ScreenHeader';
import { ListRow, Screen, Section, T } from '@/components/ui';
import { ACTIVITIES, type ActivityGroup } from '@/data/activities';
import { CRIMES } from '@/data/crimes';
import { activityAvailability, crimeAvailability } from '@/engine';
import { formatMoney } from '@/engine/util';
import { useGameStore } from '@/store/gameStore';
import { spacing } from '@/theme';

const GROUPS: { id: ActivityGroup; title: string }[] = [
  { id: 'mind_body', title: 'Mind & body' },
  { id: 'doctor', title: 'Doctor' },
  { id: 'fun', title: 'Fun' },
  { id: 'money', title: 'Luck' },
];

export default function ActivitiesScreen() {
  const game = useGameStore((s) => s.game);
  const act = useGameStore((s) => s.act);
  if (!game) return <Redirect href="/" />;
  const cc = game.character.countryCode;
  const age = game.character.age;
  return (
    <Screen>
      <ScreenHeader title="Activities" subtitle={`Energy ${game.character.energy}/${game.character.energyMax} this year`} />
      <ScrollView contentContainerStyle={styles.content}>
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

const styles = StyleSheet.create({ content: { padding: spacing.lg, paddingBottom: spacing.xxl } });

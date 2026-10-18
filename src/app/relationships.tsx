import { Redirect, router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PeopleRow } from '@/components/game/PeopleRow';
import { groupPeople } from '@/components/game/people';
import { ScreenHeader } from '@/components/game/ScreenHeader';
import { Section, Screen, T } from '@/components/ui';
import { useGameStore } from '@/store/gameStore';
import { colors, radius, spacing } from '@/theme';

export default function RelationshipsScreen() {
  const game = useGameStore((s) => s.game);
  if (!game) return <Redirect href="/" />;
  const people = Object.values(game.people);
  const groups = groupPeople(people);
  const alive = people.filter((p) => p.alive);
  // Most recent losses first.
  const dead = people.filter((p) => !p.alive).sort((a, b) => (b.deathAge ?? b.age) - (a.deathAge ?? a.age));
  const open = (id: string) => router.push({ pathname: '/person/[id]', params: { id } });
  return (
    <Screen>
      <ScreenHeader title="People" subtitle={`${alive.length} in your life · Energy ${game.character.energy}/${game.character.energyMax}`} />
      <ScrollView contentContainerStyle={styles.content}>
        {groups.map((g) => (
          <Section
            key={g.key}
            title={g.title}
            right={
              <View style={styles.count}>
                <Text style={styles.countText}>{g.people.length}</Text>
              </View>
            }
          >
            {g.people.map((p) => (
              <PeopleRow key={p.id} person={p} onPress={() => open(p.id)} testID={`person-${p.kind}`} />
            ))}
          </Section>
        ))}
        {alive.length === 0 ? <T kind="small">Nobody yet. Age up and life will introduce you to people.</T> : null}
        {dead.length ? (
          <Section title="In memoriam">
            {dead.map((p) => (
              <PeopleRow key={p.id} person={p} onPress={() => open(p.id)} testID={`memoriam-${p.kind}`} />
            ))}
          </Section>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  count: { minWidth: 24, alignItems: 'center', borderRadius: radius.pill, backgroundColor: colors.bgElevated, paddingHorizontal: 8, paddingVertical: 1 },
  countText: { fontSize: 12, fontWeight: '700', color: colors.textMuted, fontVariant: ['tabular-nums'] },
});

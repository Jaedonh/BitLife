import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { kindEmoji, kindLabel } from '@/components/game/people';
import { ScreenHeader } from '@/components/game/ScreenHeader';
import { Button, Card, Screen, Section, StatBar, T } from '@/components/ui';
import { availableInteractions } from '@/engine';
import { useGameStore } from '@/store/gameStore';
import { colors, spacing } from '@/theme';

export default function PersonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = useGameStore((s) => s.game);
  const act = useGameStore((s) => s.act);
  if (!game) return <Redirect href="/" />;
  const p = id ? game.people[id] : undefined;
  if (!p) return <Redirect href="/relationships" />;
  const interactions = availableInteractions(game, p);
  const energy = game.character.energy;
  return (
    <Screen>
      <ScreenHeader title={`${kindEmoji(p)} ${p.firstName} ${p.lastName}`} subtitle={`${kindLabel(p)} · ${p.age} · ${p.occupation}`} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <StatBar label="Relationship" value={p.relationship} color={p.relationship >= 60 ? colors.success : p.relationship >= 30 ? colors.warning : colors.danger} testID="person-relationship" />
          {p.love !== undefined ? <StatBar label="Love" value={p.love} color={colors.looks} /> : null}
          <StatBar label="Looks" value={p.looks} color={colors.looks} />
          <StatBar label="Smarts" value={p.smarts} color={colors.smarts} />
          <StatBar label="Health" value={p.health} color={colors.health} />
          <T kind="small">
            {p.alive ? `Known since you were ${p.metAtAge}.` : `Died at ${p.deathAge} of ${p.deathCause}.`}
            {p.memory.yearsNeglected >= 2 ? ` You haven't spoken in ${p.memory.yearsNeglected} years.` : ''}
            {p.marriedAtAge !== undefined ? ` Married when you were ${p.marriedAtAge}.` : ''}
          </T>
        </Card>
        {p.alive ? (
          <Section title={`Interact · energy ${energy}/${game.character.energyMax}`}>
            <View style={styles.grid}>
              {interactions.map((i) => (
                <Button
                  key={i.id}
                  title={`${i.emoji} ${i.label}`}
                  variant={i.id === 'insult' || i.id === 'breakUp' || i.id === 'divorce' ? 'danger' : 'secondary'}
                  size="md"
                  style={styles.gridBtn}
                  onPress={() => act({ type: 'interact', personId: p.id, interaction: i.id })}
                  testID={`interact-${i.id}`}
                />
              ))}
            </View>
          </Section>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  card: { gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gridBtn: { flexBasis: '47%', flexGrow: 1 },
});

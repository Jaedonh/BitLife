import { Redirect, router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { ScreenHeader } from '@/components/game/ScreenHeader';
import { ListRow, Screen, Section, T } from '@/components/ui';
import type { Person, RelationshipKind } from '@/engine/types';
import { useGameStore } from '@/store/gameStore';
import { colors, spacing } from '@/theme';

const GROUPS: { title: string; kinds: RelationshipKind[] }[] = [
  { title: 'Partner', kinds: ['spouse', 'lover'] },
  { title: 'Family', kinds: ['mother', 'father', 'stepmother', 'stepfather', 'sibling', 'child'] },
  { title: 'Friends', kinds: ['bestFriend', 'friend'] },
  { title: 'Pets', kinds: ['pet'] },
  { title: 'Others', kinds: ['coworker', 'classmate', 'ex', 'enemy'] },
];

export function kindLabel(p: Person): string {
  switch (p.kind) {
    case 'mother': return 'Mother';
    case 'father': return 'Father';
    case 'stepmother': return 'Stepmother';
    case 'stepfather': return 'Stepfather';
    case 'sibling': return p.gender === 'male' ? 'Brother' : 'Sister';
    case 'child': return p.gender === 'male' ? 'Son' : 'Daughter';
    case 'spouse': return p.gender === 'male' ? 'Husband' : 'Wife';
    case 'lover': return p.gender === 'male' ? 'Boyfriend' : 'Girlfriend';
    case 'bestFriend': return 'Best friend';
    case 'friend': return 'Friend';
    case 'ex': return 'Ex';
    case 'pet': return p.species ?? 'Pet';
    case 'coworker': return 'Coworker';
    case 'classmate': return 'Classmate';
    case 'enemy': return 'Enemy';
    default: return p.kind;
  }
}

export function kindEmoji(p: Person): string {
  switch (p.kind) {
    case 'mother': case 'stepmother': return '👩';
    case 'father': case 'stepfather': return '👨';
    case 'sibling': return p.gender === 'male' ? '👦' : '👧';
    case 'child': return p.age < 3 ? '👶' : p.gender === 'male' ? '👦' : '👧';
    case 'spouse': return '💍';
    case 'lover': return '❤️';
    case 'bestFriend': return '🤝';
    case 'friend': return '🙂';
    case 'ex': return '💔';
    case 'pet': return '🐾';
    case 'enemy': return '😠';
    default: return '👤';
  }
}

export default function RelationshipsScreen() {
  const game = useGameStore((s) => s.game);
  if (!game) return <Redirect href="/" />;
  const people = Object.values(game.people);
  const alive = people.filter((p) => p.alive);
  const dead = people.filter((p) => !p.alive);
  return (
    <Screen>
      <ScreenHeader title="People" subtitle={`${alive.length} in your life · energy ${game.character.energy}/${game.character.energyMax}`} />
      <ScrollView contentContainerStyle={styles.content}>
        {GROUPS.map((g) => {
          const members = alive.filter((p) => g.kinds.includes(p.kind)).sort((a, b) => g.kinds.indexOf(a.kind) - g.kinds.indexOf(b.kind));
          if (!members.length) return null;
          return (
            <Section key={g.title} title={g.title}>
              {members.map((p) => (
                <ListRow key={p.id} emoji={kindEmoji(p)} title={`${p.firstName} ${p.lastName}`} subtitle={`${kindLabel(p)} · ${p.age} · ${p.occupation}`} right={`${p.relationship}%`} rightColor={p.relationship >= 60 ? colors.success : p.relationship >= 30 ? colors.warning : colors.danger} onPress={() => router.push({ pathname: '/person/[id]', params: { id: p.id } })} testID={`person-${p.kind}`} />
              ))}
            </Section>
          );
        })}
        {alive.length === 0 ? <T kind="small">Nobody yet. Age up and life will introduce you to people.</T> : null}
        {dead.length ? (
          <Section title="In memoriam">
            {dead.map((p) => (
              <ListRow key={p.id} emoji="🕯️" title={`${p.firstName} ${p.lastName}`} subtitle={`${kindLabel(p)} · died at ${p.deathAge} of ${p.deathCause}`} />
            ))}
          </Section>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({ content: { padding: spacing.lg, paddingBottom: spacing.xxl } });

import { StyleSheet, Text, View } from 'react-native';

import type { Person } from '@/engine/types';
import { colors } from '@/theme';

import { bondColor, personAvatar, relationBadge } from './people';

/**
 * Round face for a person: an emoji that ages with them, a ring in their relationship colour and, for partners,
 * best friends, exes and enemies, a small relation badge. Decorative: the row or header around it carries the label.
 */
export function PeopleAvatar({ person, size = 44 }: { person: Person; size?: number }) {
  const badge = person.alive ? relationBadge(person) : '🕯️';
  const ring = person.alive ? bondColor(person.relationship) : colors.textFaint;
  return (
    <View
      style={[styles.circle, { width: size, height: size, borderRadius: size / 2, borderColor: ring }, !person.alive && styles.dead]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={[styles.face, { fontSize: Math.round(size * 0.52), lineHeight: Math.round(size * 0.66) }, !person.alive && styles.deadFace]}>{personAvatar(person)}</Text>
      {badge ? (
        <View style={[styles.badge, { width: Math.round(size * 0.44), height: Math.round(size * 0.44), borderRadius: size * 0.22, right: -size * 0.06, bottom: -size * 0.06 }]}>
          <Text style={{ fontSize: Math.round(size * 0.24), lineHeight: Math.round(size * 0.32) }}>{badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgElevated, borderWidth: 2 },
  dead: { backgroundColor: colors.bg },
  face: { textAlign: 'center' },
  deadFace: { opacity: 0.55 },
  badge: { position: 'absolute', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
});

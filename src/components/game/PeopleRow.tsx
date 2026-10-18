import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Person } from '@/engine/types';
import { colors, radius, spacing, typography } from '@/theme';

import { PeopleAvatar } from './PeopleAvatar';
import { bondColor, bondWord, deathLine, kindLabel, personName, personSubtitle } from './people';

/** One person in the People list: aging avatar, name, relation · age · occupation, and a small relationship bar. */
export function PeopleRow({ person, onPress, testID }: { person: Person; onPress?: () => void; testID?: string }) {
  const name = personName(person);
  const subtitle = person.alive ? personSubtitle(person, kindLabel(person)) : `${kindLabel(person)} · ${deathLine(person)}`;
  const pct = Math.max(0, Math.min(100, Math.round(person.relationship)));
  const color = bondColor(pct);
  const label = person.alive ? `${name}. ${subtitle}. Relationship ${pct} percent, ${bondWord(pct)}.` : `${name}. ${subtitle}.`;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <PeopleAvatar person={person} size={46} />
      <View style={styles.body}>
        <Text style={[typography.subheading, !person.alive && styles.deadName]} numberOfLines={2}>
          {name}
        </Text>
        <Text style={typography.small} numberOfLines={2}>
          {subtitle}
        </Text>
        {person.alive ? (
          <View style={styles.meter}>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
            </View>
            <Text style={[styles.pct, { color }]}>{pct}%</Text>
          </View>
        ) : null}
      </View>
      {onPress ? <Text style={styles.chevron}>›</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 72,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.lg,
  },
  pressed: { opacity: 0.85 },
  body: { flex: 1, gap: 2, minWidth: 0 },
  deadName: { color: colors.textMuted },
  meter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  track: { flex: 1, height: 6, borderRadius: radius.pill, backgroundColor: colors.bgElevated, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  pct: { fontSize: 12, fontWeight: '700', width: 36, textAlign: 'right', fontVariant: ['tabular-nums'] },
  chevron: { color: colors.textFaint, fontSize: 22, marginLeft: -4 },
});

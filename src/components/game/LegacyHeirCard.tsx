import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Person } from '@/engine/types';
import { formatMoney } from '@/engine/util';
import { colors, radius, spacing, typography } from '@/theme';

import { LegacyAvatar } from './LegacyAvatar';
import { heirLabel, lifeAvatar } from './legacy';
import { heirOccupationLabel } from './people';

type Props = {
  heir: Person;
  /** The heir's share of the estate (0 when there is nothing to inherit). */
  inheritance: number;
  countryCode: string;
  /** The year of the death: the inheritance shows in that year's currency. */
  year?: number;
  /** Free play's generation limit is reached: the card opens the premium screen instead. */
  locked: boolean;
  onPress: () => void;
};

function bondColor(v: number): string {
  return v >= 60 ? colors.success : v >= 30 ? colors.warning : colors.danger;
}

/** A child who can carry on the family line: who they are, how close you were, and what they inherit. */
export function LegacyHeirCard({ heir, inheritance, countryCode, year, locked, onPress }: Props) {
  const name = `${heir.firstName} ${heir.lastName}`;
  const details = [heirLabel(heir), heir.age === 0 ? 'newborn' : String(heir.age), heirOccupationLabel(heir)].filter(Boolean).join(' · ');
  const money = inheritance > 0 ? `Inherits ${formatMoney(inheritance, countryCode, year)}` : 'No inheritance';
  const label = `Continue as ${name}, ${details}. Relationship ${heir.relationship} percent. ${money}.${locked ? ' Requires Premium.' : ''}`;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={locked ? 'Opens Yearborn Premium' : undefined}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      testID="continue-heir"
    >
      <LegacyAvatar emoji={lifeAvatar(heir.gender, heir.age)} size={48} />
      <View style={styles.body}>
        <Text style={typography.subheading} numberOfLines={2}>
          {name}
        </Text>
        <Text style={typography.small} numberOfLines={1}>
          {details}
        </Text>
        <View style={styles.chips}>
          <Text style={[styles.chip, { color: bondColor(heir.relationship) }]}>♥ Relationship {heir.relationship}%</Text>
          <Text style={[styles.chip, inheritance > 0 && styles.money]} testID="heir-inheritance">
            {money}
          </Text>
        </View>
      </View>
      {locked ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🔒 Premium</Text>
        </View>
      ) : (
        <Text style={styles.chevron}>›</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 76,
  },
  pressed: { opacity: 0.85 },
  body: { flex: 1, gap: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.md, rowGap: 2, marginTop: 2 },
  chip: { ...typography.small, fontWeight: '600', fontVariant: ['tabular-nums'] },
  money: { color: colors.money },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.bgElevated },
  badgeText: { fontSize: 12, fontWeight: '700', color: colors.text },
  chevron: { color: colors.textMuted, fontSize: 26, lineHeight: 28 },
});

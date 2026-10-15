import { StyleSheet, Text, View } from 'react-native';

import { getCountry } from '@/data/countries';
import { STAGE_LABELS } from '@/engine';
import type { GameState } from '@/engine/types';
import { formatMoney } from '@/engine/util';
import { StatBar } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';

export function StatsHeader({ game }: { game: GameState }) {
  const c = game.character;
  const country = getCountry(c.countryCode);
  const subtitle = game.crime.inPrison
    ? `In prison · ${game.crime.sentenceYearsLeft} yr left`
    : game.career.job
      ? `${game.career.job.title} · ${game.career.job.company}`
      : game.education.enrolled
        ? STAGE_LABELS[game.education.stage] ?? 'Student'
        : game.career.retired
          ? 'Retired'
          : c.age < 6
            ? 'Child'
            : c.age < 18
              ? 'Teenager'
              : 'Unemployed';
  return (
    <View style={styles.card} testID="stats-header">
      <View style={styles.top}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{c.gender === 'male' ? '👦' : '👧'}</Text>
        </View>
        <View style={styles.names}>
          <Text style={typography.heading} numberOfLines={1} testID="char-name">
            {c.firstName} {c.lastName}
          </Text>
          <Text style={typography.small} numberOfLines={1}>
            {country.flag} {c.city} · {subtitle}
          </Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.age} testID="char-age">
            {c.age}
          </Text>
          <Text style={styles.money} testID="char-money">
            {formatMoney(game.finances.cash, c.countryCode)}
          </Text>
        </View>
      </View>
      <View style={styles.bars}>
        <StatBar label="Happiness" value={c.stats.happiness} color={colors.happiness} testID="stat-happiness" />
        <StatBar label="Health" value={c.stats.health} color={colors.health} testID="stat-health" />
        <StatBar label="Smarts" value={c.stats.smarts} color={colors.smarts} testID="stat-smarts" />
        <StatBar label="Looks" value={c.stats.looks} color={colors.looks} testID="stat-looks" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 26 },
  names: { flex: 1 },
  right: { alignItems: 'flex-end' },
  age: { ...typography.title, fontSize: 24, lineHeight: 28 },
  money: { ...typography.small, color: colors.money, fontWeight: '700', fontVariant: ['tabular-nums'] },
  bars: { gap: 6 },
});

import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { getCountry } from '@/data/countries';
import { STAGE_LABELS } from '@/engine';
import type { GameState } from '@/engine/types';
import { employerLabel, formatMoney } from '@/engine/util';
import { StatBar } from '@/components/ui';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, lifeTints, radius, spacing, typography } from '@/theme';
import { avatarFor, totalDebt } from './lifeFormat';

/** One line for where a life stands right now: "Barista · Zenith Coffee", "High school", "Toddler". */
export function lifeStatus(game: GameState): string {
  const c = game.character;
  const left = game.crime.sentenceYearsLeft;
  return game.crime.inPrison
    ? `${game.crime.juvenile ? 'In detention' : 'In prison'} · ${left} ${left === 1 ? 'year' : 'years'} left`
    : game.career.job
      ? `${game.career.job.title} · ${employerLabel(game.career.job.company)}`
      : game.education.enrolled
        ? STAGE_LABELS[game.education.stage] ?? 'Student'
        : game.career.retired
          ? 'Retired'
          : c.age < 2
            ? 'Baby'
            : c.age < 5
              ? 'Toddler'
              : c.age < 13
                ? 'Child'
                : c.age < 18
                  ? 'Teenager'
                  : 'Unemployed';
}

/** Energy chip; pulses once when the year's energy runs out. */
function EnergyChip({ energy, max }: { energy: number; max: number }) {
  const empty = energy <= 0;
  const [pulse] = useState(() => new Animated.Value(1));
  const wasEmpty = useRef(empty);
  useEffect(() => {
    if (empty && !wasEmpty.current) {
      const native = Platform.OS !== 'web';
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 140, useNativeDriver: native }),
        Animated.timing(pulse, { toValue: 1, duration: 140, useNativeDriver: native }),
        Animated.timing(pulse, { toValue: 1.12, duration: 140, useNativeDriver: native }),
        Animated.timing(pulse, { toValue: 1, duration: 160, useNativeDriver: native }),
      ]).start();
    }
    wasEmpty.current = empty;
  }, [empty, pulse]);
  return (
    <Animated.View style={[styles.chip, empty ? styles.chipWarn : styles.chipEnergy, { transform: [{ scale: pulse }] }]} testID="chip-energy">
      <Text style={[styles.chipText, empty && { color: colors.warning }]}>{empty ? '⚡ Out of energy' : `⚡ Energy ${energy}/${max}`}</Text>
    </Animated.View>
  );
}

/**
 * Where I am and what I do: "🇦🇺 Melbourne · Junior Developer · Quantum Inc." on one line when it fits. When it
 * does not, the place and the status go on lines of their own, with no separator left hanging at the end of the
 * first, and the status may take two lines so a long employer is never cut off. The two pieces are laid out in a
 * wrapping row first (the place always starts it); once the status lands on a row below, the line is shown
 * stacked until the text changes.
 */
export function PlaceLine({ place, status }: { place: string; status: string }) {
  const key = `${place}|${status}`;
  const [stackedFor, setStackedFor] = useState<string | null>(null);
  if (stackedFor === key) {
    return (
      <View testID="char-status">
        <Text style={typography.small} numberOfLines={1}>
          {place}
        </Text>
        <Text style={typography.small} numberOfLines={2} testID="char-status-text">
          {status}
        </Text>
      </View>
    );
  }
  const onStatusLayout = (e: LayoutChangeEvent) => {
    if (e.nativeEvent.layout.y > 1) setStackedFor(key);
  };
  return (
    <View style={styles.place} testID="char-status">
      {/* A no-break space: a plain one would be trimmed at the end of the piece. */}
      <Text style={[typography.small, styles.placePart]} numberOfLines={1}>
        {`${place} ·\u00A0`}
      </Text>
      <Text style={[typography.small, styles.placePart]} numberOfLines={1} testID="char-status-text" onLayout={onStatusLayout}>
        {status}
      </Text>
    </View>
  );
}

export function StatsHeader({ game, onOpenProfile }: { game: GameState; onOpenProfile?: () => void }) {
  const showKarma = useSettingsStore((s) => s.settings.showKarma);
  const c = game.character;
  const country = getCountry(c.countryCode);
  const subtitle = lifeStatus(game);
  const debt = totalDebt(game);
  const cash = formatMoney(game.finances.cash, c.countryCode);
  const debtText = formatMoney(debt, c.countryCode);
  const spoken = [
    `${c.firstName} ${c.lastName}, age ${c.age}, ${subtitle}`,
    `${cash} cash${debt > 0 ? `, ${debtText} debt` : ''}`,
    `Happiness ${c.stats.happiness}, Health ${c.stats.health}, Smarts ${c.stats.smarts}, Looks ${c.stats.looks} percent`,
    `Energy ${c.energy} of ${c.energyMax}`,
    c.fame > 0 ? `Fame ${c.fame}` : '',
    showKarma ? `Karma ${c.karma}` : '',
  ]
    .filter(Boolean)
    .join('. ');
  return (
    <Pressable
      testID="stats-header"
      onPress={onOpenProfile}
      disabled={!onOpenProfile}
      accessibilityRole="button"
      accessibilityLabel={spoken}
      accessibilityHint="Opens your profile"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText} testID="char-avatar">
            {avatarFor(c.age, c.gender)}
          </Text>
        </View>
        <View style={styles.names}>
          <Text style={typography.heading} numberOfLines={1} testID="char-name">
            {c.firstName} {c.lastName}
          </Text>
          {/* The city and the status wrap as two pieces, so a long city never cuts off the years left in prison. */}
          <PlaceLine place={`${country.flag} ${c.city}`} status={subtitle} />
        </View>
        <View style={styles.right}>
          <Text style={styles.age} testID="char-age">
            {c.age}
          </Text>
          <Text style={styles.money} testID="char-money">
            {cash}
          </Text>
          {debt > 0 ? (
            <Text style={styles.debt} testID="char-debt" numberOfLines={1}>
              {debtText} debt
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.bars}>
        <StatBar label="Happiness" value={c.stats.happiness} color={colors.happiness} testID="stat-happiness" />
        <StatBar label="Health" value={c.stats.health} color={colors.health} testID="stat-health" />
        <StatBar label="Smarts" value={c.stats.smarts} color={colors.smarts} testID="stat-smarts" />
        <StatBar label="Looks" value={c.stats.looks} color={colors.looks} testID="stat-looks" />
      </View>
      <View style={styles.chips}>
        <EnergyChip energy={c.energy} max={c.energyMax} />
        {c.fame > 0 ? (
          <View style={[styles.chip, styles.chipFame]} testID="chip-fame">
            <Text style={styles.chipText}>⭐ Fame {c.fame}</Text>
          </View>
        ) : null}
        {showKarma ? (
          <View style={[styles.chip, styles.chipKarma]} testID="chip-karma">
            <Text style={styles.chipText}>☯ Karma {c.karma}</Text>
          </View>
        ) : null}
        {onOpenProfile && !(c.fame > 0 && showKarma) ? <Text style={styles.more}>Profile ›</Text> : null}
      </View>
    </Pressable>
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
  pressed: { opacity: 0.92 },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 26 },
  names: { flex: 1 },
  place: { flexDirection: 'row', flexWrap: 'wrap' },
  placePart: { maxWidth: '100%' },
  right: { alignItems: 'flex-end' },
  age: { ...typography.title, fontSize: 24, lineHeight: 28 },
  money: { ...typography.small, color: colors.money, fontWeight: '700', fontVariant: ['tabular-nums'] },
  debt: { fontSize: 12, lineHeight: 16, color: colors.danger, fontWeight: '700', fontVariant: ['tabular-nums'] },
  bars: { gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: -2 },
  chip: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  chipEnergy: { backgroundColor: lifeTints.neutral, borderColor: colors.cardBorder },
  chipWarn: { backgroundColor: lifeTints.warning, borderColor: colors.warning },
  chipFame: { backgroundColor: lifeTints.warning, borderColor: 'transparent' },
  chipKarma: { backgroundColor: lifeTints.primary, borderColor: 'transparent' },
  chipText: { color: colors.text, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  more: { ...typography.label, marginLeft: 'auto', color: colors.textMuted },
});

import { useEffect, useState } from 'react';
import { Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, StatBar } from '@/components/ui';
import { getCountry } from '@/data/countries';
import { TRAIT_LABELS } from '@/engine';
import type { GameState } from '@/engine/types';
import { formatMoneyFull, MONTH_NAMES, netWorth } from '@/engine/util';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, lifeTints, radius, spacing, typography, violetSoft } from '@/theme';
import { avatarFor, zodiacGlyph } from './lifeFormat';
import { lifeStatus } from './StatsHeader';

function MoneyRow({ label, amount, cc, tone, strong, testID }: { label: string; amount: number; cc: string; tone?: 'up' | 'down'; strong?: boolean; testID?: string }) {
  const color = tone === 'down' ? colors.danger : tone === 'up' ? colors.money : colors.text;
  const value = `${tone === 'down' && amount > 0 ? '−' : amount < 0 ? '−' : ''}${formatMoneyFull(Math.abs(amount), cc)}`;
  return (
    <View style={[styles.moneyRow, strong && styles.moneyRowStrong]} testID={testID} accessible accessibilityLabel={`${label} ${value}`}>
      <Text style={[styles.moneyLabel, strong && styles.moneyLabelStrong]}>{label}</Text>
      <Text style={[styles.moneyValue, { color }, strong && styles.moneyValueStrong]}>{value}</Text>
    </View>
  );
}

function Heading({ children }: { children: string }) {
  return (
    <Text style={styles.heading} accessibilityRole="header">
      {children}
    </Text>
  );
}

/**
 * Who this character is right now: traits and sign, this year's energy, fame, karma (only
 * when the Settings toggle is on) and where the money stands (cash vs debt vs net worth).
 */
export function LifeProfileSheet({ game, visible, onClose }: { game: GameState; visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const showKarma = useSettingsStore((s) => s.settings.showKarma);
  const [rise] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!visible) return;
    rise.setValue(0);
    Animated.spring(rise, { toValue: 1, useNativeDriver: Platform.OS !== 'web', friction: 9, tension: 70 }).start();
  }, [visible, rise]);

  const c = game.character;
  const cc = c.countryCode;
  const country = getCountry(cc);
  const f = game.finances;
  const investments = f.investments.reduce((sum, i) => sum + i.amount, 0);
  const property = game.assets.reduce((sum, a) => sum + a.value, 0);
  const mortgages = game.assets.reduce((sum, a) => sum + (a.mortgage?.remaining ?? 0), 0);
  const worth = netWorth(game);
  const born = `${c.birthDay} ${MONTH_NAMES[c.birthMonth - 1] ?? ''} ${c.birthYear}`.replace(/\s+/g, ' ').trim();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close profile" />
        <Animated.View
          testID="profile-sheet"
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.sm },
            { transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }], opacity: rise },
          ]}
        >
          <View style={styles.handle} />
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            <View style={styles.who}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{avatarFor(c.age, c.gender)}</Text>
              </View>
              <View style={styles.whoText}>
                <Text style={typography.heading} numberOfLines={2}>
                  {c.firstName} {c.lastName}
                </Text>
                <Text style={typography.small}>
                  Age {c.age} · born {born}
                </Text>
                <Text style={typography.small} numberOfLines={2}>
                  {country.flag} {c.city}, {country.name} · {lifeStatus(game)}
                </Text>
              </View>
            </View>

            <Heading>Personality</Heading>
            <View style={styles.chipRow}>
              <View style={[styles.chip, { backgroundColor: lifeTints.primary }]} testID="profile-zodiac">
                <Text style={styles.chipText}>
                  {zodiacGlyph(c.zodiac)} {c.zodiac}
                </Text>
              </View>
            </View>
            {c.traits.length ? (
              <View style={styles.traits}>
                {c.traits.map((t) => (
                  <View key={t} style={styles.trait} testID={`profile-trait-${t}`}>
                    <Text style={styles.traitLabel}>{TRAIT_LABELS[t]?.label ?? t}</Text>
                    <Text style={typography.small}>{TRAIT_LABELS[t]?.description ?? ''}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={typography.small}>No standout traits. A blank slate.</Text>
            )}

            <Heading>This year</Heading>
            <View style={styles.energyRow} testID="profile-energy" accessible accessibilityLabel={`Energy ${c.energy} of ${c.energyMax} left this year`}>
              <Text style={styles.statLabel}>Energy</Text>
              <View style={styles.pips}>
                {Array.from({ length: c.energyMax }, (_, i) => (
                  <View key={i} style={[styles.pip, i < c.energy ? styles.pipOn : styles.pipOff]} />
                ))}
              </View>
              <Text style={styles.energyText}>
                {c.energy}/{c.energyMax} left
              </Text>
            </View>
            <StatBar label="Fame" value={c.fame} color={colors.warning} testID="profile-fame" />
            {showKarma ? <StatBar label="Karma" value={c.karma} color={violetSoft} testID="profile-karma" /> : null}

            <Heading>Money</Heading>
            <View style={styles.money}>
              <MoneyRow label="Cash" amount={f.cash} cc={cc} tone="up" testID="profile-cash" />
              {investments ? <MoneyRow label="Investments" amount={investments} cc={cc} /> : null}
              {property ? <MoneyRow label="Property & vehicles" amount={property} cc={cc} /> : null}
              {mortgages ? <MoneyRow label="Mortgages" amount={mortgages} cc={cc} tone="down" /> : null}
              <MoneyRow label="Debt" amount={Math.max(0, f.debt)} cc={cc} tone={f.debt > 0 ? 'down' : undefined} testID="profile-debt" />
              {game.education.studentDebt > 0 ? <MoneyRow label="Student loans" amount={game.education.studentDebt} cc={cc} tone="down" /> : null}
              <MoneyRow label="Net worth" amount={worth} cc={cc} tone={worth < 0 ? 'down' : 'up'} strong testID="profile-networth" />
            </View>
          </ScrollView>
          <Button title="Close" variant="secondary" onPress={onClose} testID="profile-close" style={styles.close} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '88%',
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.cardBorder,
    paddingTop: spacing.sm,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.cardBorder, marginBottom: spacing.sm },
  scroll: { flexGrow: 0 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm },
  who: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xs },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 36 },
  whoText: { flex: 1, gap: 2 },
  heading: { ...typography.label, marginTop: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  traits: { gap: spacing.sm },
  trait: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, gap: 2 },
  traitLabel: { ...typography.subheading, fontSize: 15 },
  energyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 22 },
  statLabel: { ...typography.label, width: 72 },
  pips: { flex: 1, flexDirection: 'row', gap: 6 },
  pip: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  pipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  pipOff: { backgroundColor: 'transparent', borderColor: colors.textFaint },
  energyText: { ...typography.small, fontVariant: ['tabular-nums'] },
  money: { backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  moneyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, gap: spacing.md },
  moneyRowStrong: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.cardBorder, marginTop: 2, paddingTop: 10 },
  moneyLabel: { ...typography.small, color: colors.textMuted },
  moneyLabelStrong: { color: colors.text, fontWeight: '700' },
  moneyValue: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  moneyValueStrong: { fontSize: 16, fontWeight: '800' },
  close: { marginHorizontal: spacing.lg, marginTop: spacing.sm },
});

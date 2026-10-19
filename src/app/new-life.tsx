import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenHeader } from '@/components/game/ScreenHeader';
import { Button, Card, confirmAction, Screen, T } from '@/components/ui';
import { COUNTRIES } from '@/data/countries';
import { SCENARIOS, type ScenarioDef } from '@/data/scenarios';
import type { Gender, ScenarioId, StatId, Stats } from '@/engine/types';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, peopleColors, radius, spacing, typography } from '@/theme';

const STAT_LABELS: Record<StatId, string> = { happiness: 'Happiness', health: 'Health', smarts: 'Smarts', looks: 'Looks' };

export default function NewLifeScreen() {
  const newLife = useGameStore((s) => s.newLife);
  const premium = useSettingsStore((s) => s.premium);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [country, setCountry] = useState<string | undefined>(undefined);
  const [custom, setCustom] = useState(false);
  const [stats, setStats] = useState<Stats>({ happiness: 80, health: 90, smarts: 60, looks: 60 });
  const [scenario, setScenario] = useState<ScenarioId>('standard');
  const wealthy = scenario === 'wealthy';

  const living = useGameStore((s) => !!s.game?.alive);

  const start = async () => {
    if (living && !(await confirmAction('Start a new life?', 'Your current life will be lost.', 'Start over'))) return;
    newLife({
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      gender,
      countryCode: country,
      customStats: premium && custom ? stats : undefined,
      // The wealthy family stays a premium perk; every other scenario is free.
      scenario: wealthy && !premium ? 'standard' : scenario,
      wealthyFamily: premium && wealthy ? true : undefined,
    });
    router.replace('/life');
  };

  return (
    <Screen>
      <ScreenHeader title="Custom life" subtitle="Leave anything blank to randomize it" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.card} testID="scenario-picker">
          <T kind="label">HOW IT STARTS</T>
          <View style={styles.scenarios} accessibilityRole="radiogroup">
            {SCENARIOS.map((def) => (
              <ScenarioCard key={def.id} def={def} selected={scenario === def.id} locked={!!def.premium && !premium} onPress={() => setScenario(def.id)} />
            ))}
          </View>
        </Card>
        <Card style={styles.card}>
          <T kind="label">NAME</T>
          <TextInput testID="first-name" placeholder="First name" placeholderTextColor={colors.textFaint} style={styles.input} value={firstName} onChangeText={setFirstName} maxLength={20} />
          <TextInput testID="last-name" placeholder="Last name" placeholderTextColor={colors.textFaint} style={styles.input} value={lastName} onChangeText={setLastName} maxLength={24} />
        </Card>
        <Card style={styles.card}>
          <T kind="label">GENDER</T>
          <View style={styles.row}>
            {(['male', 'female'] as const).map((g) => (
              <Pressable key={g} testID={`gender-${g}`} onPress={() => setGender(gender === g ? undefined : g)} style={[styles.chip, gender === g && styles.chipOn]}>
                <Text style={[styles.chipText, gender === g && styles.chipTextOn]}>{g === 'male' ? 'Male' : 'Female'}</Text>
              </Pressable>
            ))}
          </View>
        </Card>
        <Card style={styles.card}>
          <T kind="label">BIRTH COUNTRY</T>
          <View style={styles.wrap}>
            {COUNTRIES.map((c) => (
              <Pressable key={c.code} testID={`country-${c.code}`} onPress={() => setCountry(country === c.code ? undefined : c.code)} style={[styles.chip, country === c.code && styles.chipOn]}>
                <Text style={[styles.chipText, country === c.code && styles.chipTextOn]}>
                  {c.flag} {c.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>
        <Card style={[styles.card, !premium && styles.locked]} onPress={!premium ? () => router.push('/premium') : undefined}>
          <View style={styles.rowBetween}>
            <T kind="label">STARTING STATS {premium ? '' : '· PREMIUM'}</T>
            {premium ? (
              <Pressable onPress={() => setCustom(!custom)} testID="toggle-custom-stats">
                <Text style={styles.link}>{custom ? 'Randomize' : 'Customize'}</Text>
              </Pressable>
            ) : (
              <Text style={styles.link}>Unlock</Text>
            )}
          </View>
          {premium && custom ? (
            <View style={{ gap: spacing.sm }}>
              {(Object.keys(STAT_LABELS) as StatId[]).map((id) => (
                <View key={id} style={styles.rowBetween}>
                  <Text style={typography.body}>{STAT_LABELS[id]}</Text>
                  <View style={styles.stepper}>
                    <Button title="−" size="sm" variant="secondary" onPress={() => setStats({ ...stats, [id]: Math.max(0, stats[id] - 10) })} />
                    <Text style={styles.statValue}>{stats[id]}</Text>
                    <Button title="+" size="sm" variant="secondary" onPress={() => setStats({ ...stats, [id]: Math.min(100, stats[id] + 10) })} />
                  </View>
                </View>
              ))}
              <Pressable onPress={() => setScenario(wealthy ? 'standard' : 'wealthy')} style={[styles.chip, wealthy && styles.chipOn, { alignSelf: 'flex-start' }]}>
                <Text style={[styles.chipText, wealthy && styles.chipTextOn]}>💎 Wealthy family</Text>
              </Pressable>
            </View>
          ) : (
            <T kind="small">{premium ? 'Stats will be randomized at birth.' : 'Choose your starting Happiness, Health, Smarts and Looks, or be born rich.'}</T>
          )}
        </Card>
        <Button testID="start-life" title="Start this life" size="lg" variant="accent" onPress={start} />
      </ScrollView>
    </Screen>
  );
}

/** One scenario card: emoji, name and a one-line description. The premium Wealthy card opens the paywall while locked. */
function ScenarioCard({ def, selected, locked, onPress }: { def: ScenarioDef; selected: boolean; locked: boolean; onPress: () => void }) {
  return (
    <Pressable
      testID={`scenario-${def.id}`}
      onPress={locked ? () => router.push('/premium') : onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${def.name}. ${def.description}${locked ? ' Premium: tap to unlock.' : ''}`}
      style={({ pressed }) => [styles.scenario, selected && styles.scenarioOn, locked && styles.locked, pressed && styles.pressed]}
    >
      <View style={styles.scenarioTop}>
        <Text style={styles.scenarioEmoji} accessible={false}>
          {def.emoji}
        </Text>
        {locked ? <Text style={styles.scenarioLock}>🔒 PREMIUM</Text> : null}
      </View>
      <Text style={styles.scenarioName} numberOfLines={1}>
        {def.name}
      </Text>
      <Text style={styles.scenarioText} numberOfLines={3}>
        {def.description}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  card: { gap: spacing.sm },
  locked: { opacity: 0.75 },
  input: { backgroundColor: colors.bgElevated, color: colors.text, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 15, borderWidth: 1, borderColor: colors.cardBorder },
  row: { flexDirection: 'row', gap: spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.cardBorder },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontWeight: '600' },
  chipTextOn: { color: colors.text },
  link: { color: colors.accent, fontWeight: '700' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statValue: { ...typography.subheading, width: 36, textAlign: 'center', fontVariant: ['tabular-nums'] },
  scenarios: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  scenario: { flexGrow: 1, flexBasis: '46%', minHeight: 76, padding: spacing.sm + 2, borderRadius: radius.md, backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.cardBorder, gap: 2 },
  scenarioOn: { borderColor: colors.primary, backgroundColor: peopleColors.chipBg },
  scenarioTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  scenarioEmoji: { fontSize: 20, lineHeight: 26 },
  scenarioName: { ...typography.subheading, fontSize: 15 },
  scenarioText: { ...typography.small, fontSize: 12, lineHeight: 16 },
  scenarioLock: { ...typography.label, fontSize: 10, color: colors.accent },
  pressed: { opacity: 0.85 },
});

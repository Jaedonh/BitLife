import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/game/ScreenHeader';
import { Card, Screen, T } from '@/components/ui';
import { getCountry } from '@/data/countries';
import { RIBBON_BY_ID, RIBBONS } from '@/engine';
import { formatMoney } from '@/engine/util';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, spacing, typography } from '@/theme';

export default function GraveyardScreen() {
  const graveyard = useSettingsStore((s) => s.graveyard);
  const earned = new Set(graveyard.map((g) => g.ribbonId));
  return (
    <Screen>
      <ScreenHeader title="Graveyard" subtitle={`${graveyard.length} lives · ${earned.size}/${RIBBONS.length} ribbons`} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.ribbons}>
          {RIBBONS.map((r) => (
            <View key={r.id} style={[styles.ribbon, !earned.has(r.id) && styles.locked]} testID={`ribbon-${r.id}`}>
              <Text style={styles.ribbonEmoji}>{earned.has(r.id) ? r.emoji : '🔒'}</Text>
              <Text style={styles.ribbonName} numberOfLines={1}>
                {r.name}
              </Text>
            </View>
          ))}
        </Card>
        {graveyard.length === 0 ? <T kind="small">No lives finished yet. Every life you complete is remembered here.</T> : null}
        {graveyard.map((g) => {
          const ribbon = RIBBON_BY_ID[g.ribbonId];
          return (
            <Card key={g.id + g.diedAt} style={styles.grave} testID="grave">
              <Text style={typography.subheading}>
                {ribbon?.emoji ?? '🪦'} {g.name}
              </Text>
              <Text style={typography.small}>
                {getCountry(g.countryCode).flag} {g.birthYear}–{g.deathYear} · aged {g.age} · {g.cause}
              </Text>
              <Text style={typography.small}>
                {ribbon?.name ?? g.ribbonId} · {formatMoney(g.netWorth, g.countryCode)} · generation {g.generation}
              </Text>
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  ribbons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  ribbon: { width: 78, alignItems: 'center', gap: 2 },
  locked: { opacity: 0.35 },
  ribbonEmoji: { fontSize: 26 },
  ribbonName: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  grave: { gap: 2 },
});

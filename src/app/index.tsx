import { router } from 'expo-router';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { lifeStatus } from '@/components/game/StatsHeader';
import { Button, Card, Screen, T } from '@/components/ui';
import { RIBBON_BY_ID } from '@/engine';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, spacing, typography } from '@/theme';

function confirm(title: string, message: string, onYes: () => void) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}\n\n${message}`)) onYes();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Yes', style: 'destructive', onPress: onYes },
  ]);
}

export default function MenuScreen() {
  const game = useGameStore((s) => s.game);
  const newLife = useGameStore((s) => s.newLife);
  const premium = useSettingsStore((s) => s.premium);
  const graveyard = useSettingsStore((s) => s.graveyard);
  const hasLife = !!game && game.alive;
  const lastRibbon = graveyard[0] ? RIBBON_BY_ID[graveyard[0].ribbonId] : undefined;

  const startRandom = () => {
    const go = () => {
      newLife({});
      router.replace('/life');
    };
    if (hasLife) confirm('Start a new life?', 'Your current life will be lost.', go);
    else go();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.logo}>∞</Text>
          <Text style={styles.title}>LifeLoop</Text>
          <Text style={typography.small}>Live a thousand lives. Keep the one you like.</Text>
        </View>

        {hasLife ? (
          <Card onPress={() => router.replace('/life')} testID="continue-life">
            <T kind="label">CONTINUE</T>
            <T kind="heading">
              {game.character.firstName} {game.character.lastName}, {game.character.age}
            </T>
            <T kind="small">{lifeStatus(game)}</T>
          </Card>
        ) : game && !game.alive ? (
          <Card onPress={() => router.replace('/death')} testID="view-death">
            <T kind="label">LAST LIFE</T>
            <T kind="heading">
              {game.character.firstName} {game.character.lastName} · {game.character.age}
            </T>
            <T kind="small">Rest in peace. View the tombstone.</T>
          </Card>
        ) : null}

        <Button testID="new-random-life" title="New random life" size="lg" variant="accent" onPress={startRandom} />
        <Button testID="new-custom-life" title="Custom life" size="lg" variant="secondary" onPress={() => router.push('/new-life')} />

        <View style={styles.row}>
          <Button title={`Graveyard${graveyard.length ? ` (${graveyard.length})` : ''}`} variant="ghost" onPress={() => router.push('/graveyard')} style={styles.flex} testID="menu-graveyard" />
          <Button title="Settings" variant="ghost" onPress={() => router.push('/settings')} style={styles.flex} testID="menu-settings" />
        </View>
        {!premium ? (
          <Card onPress={() => router.push('/premium')} style={styles.premiumCard} testID="menu-premium">
            <T kind="subheading">✨ Go Premium</T>
            <T kind="small">Remove ads, unlock custom stats, unlimited generations, and more.</T>
          </Card>
        ) : (
          <T kind="small" style={{ textAlign: 'center' }}>
            ✨ Premium active. Thank you for supporting LifeLoop.
          </T>
        )}
        {lastRibbon ? (
          <T kind="small" style={{ textAlign: 'center' }}>
            Last ribbon: {lastRibbon.emoji} {lastRibbon.name}
          </T>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.md, maxWidth: 520, width: '100%', alignSelf: 'center' },
  hero: { alignItems: 'center', gap: spacing.xs, marginVertical: spacing.xl },
  logo: { fontSize: 64, color: colors.accent, lineHeight: 70 },
  title: { ...typography.title, fontSize: 34 },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  premiumCard: { borderColor: colors.primary, gap: 4 },
});

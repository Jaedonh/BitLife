import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AgeUpBar } from '@/components/game/AgeUpBar';
import { BannerSlot } from '@/components/game/BannerSlot';
import { EventModal } from '@/components/game/EventModal';
import { LifeLog } from '@/components/game/LifeLog';
import { ResultToast } from '@/components/game/ResultToast';
import { StatsHeader } from '@/components/game/StatsHeader';
import { Screen } from '@/components/ui';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, spacing, typography } from '@/theme';

export default function LifeScreen() {
  const game = useGameStore((s) => s.game);
  const [bannerHeight, setBannerHeight] = useState(0);
  const tutorialDone = useSettingsStore((s) => s.settings.tutorialDone);
  const setSetting = useSettingsStore((s) => s.setSetting);
  const alive = game?.alive;

  useEffect(() => {
    if (game && !alive) router.replace('/death');
  }, [game, alive]);

  if (!game) return <Redirect href="/" />;

  return (
    <Screen edges={['top', 'left', 'right']}>
      <View style={styles.topRow}>
        <Pressable testID="menu" accessibilityRole="button" accessibilityLabel="Menu" onPress={() => router.replace('/')} hitSlop={12}>
          <Text style={styles.menuText}>☰</Text>
        </Pressable>
        <Text style={typography.label}>LIFELOOP</Text>
        <Pressable testID="open-settings" accessibilityRole="button" accessibilityLabel="Settings" onPress={() => router.push('/settings')} hitSlop={12}>
          <Text style={styles.menuText}>⚙︎</Text>
        </Pressable>
      </View>
      <StatsHeader game={game} />
      <View style={styles.logWrap}>
        <LifeLog log={game.log} footer={bannerHeight} />
        {!tutorialDone && game.character.age === 0 ? (
          <Pressable style={styles.tip} onPress={() => setSetting('tutorialDone', true)} testID="tutorial-tip">
            <Text style={styles.tipText}>Tap the green + to age one year. Events will ask you to choose. Use the tabs to study, work, date and spend. Tap to dismiss.</Text>
          </Pressable>
        ) : null}
      </View>
      <BannerSlot onHeight={setBannerHeight} />
      <AgeUpBar />
      <EventModal />
      <ResultToast />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  menuText: { color: colors.textMuted, fontSize: 20 },
  logWrap: { flex: 1 },
  tip: { position: 'absolute', bottom: spacing.lg, left: spacing.lg, right: spacing.lg, backgroundColor: colors.primary, borderRadius: 12, padding: spacing.md },
  tipText: { ...typography.small, color: colors.text },
});

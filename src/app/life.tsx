import { Redirect, router, useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AGE_BUTTON_OVERHANG, AgeUpBar } from '@/components/game/AgeUpBar';
import { BannerSlot } from '@/components/game/BannerSlot';
import { EventModal } from '@/components/game/EventModal';
import { LifeLog } from '@/components/game/LifeLog';
import { LifeProfileSheet } from '@/components/game/LifeProfileSheet';
import { setLifeToastClearance } from '@/components/game/ResultToast';
import { StatsHeader } from '@/components/game/StatsHeader';
import { Screen } from '@/components/ui';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, spacing, typography } from '@/theme';

/** Room the journal leaves under its last line so the round Age button never covers it. */
const JOURNAL_BOTTOM_ROOM = AGE_BUTTON_OVERHANG + spacing.md;

export default function LifeScreen() {
  const game = useGameStore((s) => s.game);
  const [profileOpen, setProfileOpen] = useState(false);
  const tutorialDone = useSettingsStore((s) => s.settings.tutorialDone);
  const setSetting = useSettingsStore((s) => s.setSetting);
  const alive = game?.alive;
  // Event cards show on the screen on top: a court card opened from Activities appears there instead.
  const focused = useIsFocused();

  useEffect(() => {
    if (game && !alive) router.replace('/death');
  }, [game, alive]);

  if (!game) return <Redirect href="/" />;

  return (
    <Screen edges={['top', 'left', 'right']}>
      <View style={styles.topRow}>
        <Pressable testID="menu" accessibilityRole="button" accessibilityLabel="Menu" onPress={() => router.replace('/')} hitSlop={4} style={styles.iconBtn}>
          <Text style={styles.menuText}>☰</Text>
        </Pressable>
        <Text style={typography.label}>LIFELOOP</Text>
        <Pressable testID="open-settings" accessibilityRole="button" accessibilityLabel="Settings" onPress={() => router.push('/settings')} hitSlop={4} style={styles.iconBtn}>
          <Text style={styles.menuText}>⚙︎</Text>
        </Pressable>
      </View>
      <StatsHeader game={game} onOpenProfile={() => setProfileOpen(true)} />
      <View style={styles.logWrap}>
        <LifeLog game={game} bottomInset={JOURNAL_BOTTOM_ROOM} />
        {!tutorialDone && game.character.age === 0 ? (
          <Pressable style={styles.tip} onPress={() => setSetting('tutorialDone', true)} testID="tutorial-tip" accessibilityRole="button" accessibilityHint="Dismisses the tip">
            <Text style={styles.tipText}>Tap the green + to age one year. Events will ask you to choose. Use the tabs to study, work, date and spend. Tap your name for your profile. Tap to dismiss.</Text>
          </Pressable>
        ) : null}
      </View>
      {/* The bottom chrome reports its height so the app-wide toasts sit just above the Age button. */}
      <View onLayout={(e) => setLifeToastClearance(Math.round(e.nativeEvent.layout.height) + AGE_BUTTON_OVERHANG + spacing.sm)}>
        <BannerSlot clearance={AGE_BUTTON_OVERHANG + spacing.xs} />
        <AgeUpBar />
      </View>
      {focused ? <EventModal /> : null}
      <LifeProfileSheet game={game} visible={profileOpen} onClose={() => setProfileOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.sm },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  menuText: { color: colors.textMuted, fontSize: 20 },
  logWrap: { flex: 1 },
  tip: { position: 'absolute', bottom: JOURNAL_BOTTOM_ROOM, left: spacing.lg, right: spacing.lg, backgroundColor: colors.primary, borderRadius: 12, padding: spacing.md },
  tipText: { ...typography.small, color: colors.text },
});

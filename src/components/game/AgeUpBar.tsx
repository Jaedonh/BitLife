import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, onAccent, radius, spacing } from '@/theme';

/** How far the round Age button rises above the bar. Content behind the bar must leave this much room. */
export const AGE_BUTTON_OVERHANG = 28;

const TABS: { key: string; label: string; emoji: string; href: '/occupation' | '/assets' | '/relationships' | '/activities' }[] = [
  { key: 'occupation', label: 'Work', emoji: '💼', href: '/occupation' },
  { key: 'assets', label: 'Assets', emoji: '🏠', href: '/assets' },
  { key: 'relationships', label: 'People', emoji: '❤️', href: '/relationships' },
  { key: 'activities', label: 'Activities', emoji: '🎯', href: '/activities' },
];

export function AgeUpBar() {
  const insets = useSafeAreaInsets();
  const game = useGameStore((s) => s.game);
  const ageUp = useGameStore((s) => s.ageUp);
  const adShowing = useGameStore((s) => s.adShowing);
  const haptics = useSettingsStore((s) => s.settings.haptics);
  if (!game) return null;
  const disabled = !game.alive || !!game.pendingEvent || adShowing;
  const left = TABS.slice(0, 2);
  const right = TABS.slice(2);
  const Tab = ({ t }: { t: (typeof TABS)[number] }) => (
    <Pressable testID={`tab-${t.key}`} accessibilityRole="button" accessibilityLabel={t.label} onPress={() => router.push(t.href)} style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
      <Text style={styles.tabEmoji}>{t.emoji}</Text>
      <Text style={styles.tabLabel}>{t.label}</Text>
    </Pressable>
  );
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {left.map((t) => (
        <Tab key={t.key} t={t} />
      ))}
      <Pressable
        testID="age-up"
        accessibilityRole="button"
        accessibilityLabel="Age up one year"
        disabled={disabled}
        onPress={() => {
          if (haptics && Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          void ageUp();
        }}
        style={({ pressed }) => [styles.ageBtn, pressed && styles.agePressed, disabled && styles.ageDisabled]}
      >
        <Text style={styles.agePlus}>+</Text>
        <Text style={styles.ageLabel}>Age</Text>
      </Pressable>
      {right.map((t) => (
        <Tab key={t.key} t={t} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    backgroundColor: colors.bgElevated,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.cardBorder,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  tab: { alignItems: 'center', justifyContent: 'center', width: 64, paddingVertical: 4, borderRadius: radius.md },
  pressed: { opacity: 0.7 },
  tabEmoji: { fontSize: 20 },
  tabLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginTop: 2 },
  ageBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -AGE_BUTTON_OVERHANG,
    borderWidth: 4,
    borderColor: colors.bgElevated,
    shadowColor: colors.accent,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  agePressed: { transform: [{ scale: 0.96 }] },
  ageDisabled: { opacity: 0.4 },
  agePlus: { color: onAccent, fontSize: 30, fontWeight: '900', lineHeight: 32 },
  ageLabel: { color: onAccent, fontSize: 11, fontWeight: '800', marginTop: -2, letterSpacing: 0.5 },
});

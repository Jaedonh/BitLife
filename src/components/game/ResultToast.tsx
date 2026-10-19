import * as Haptics from 'expo-haptics';
import { usePathname } from 'expo-router';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { ACHIEVEMENT_BY_ID, type AchievementDef } from '@/data/achievements';
import type { LogKind } from '@/engine/types';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, lifeTints, radius, spacing, typography, violetSoft } from '@/theme';
import { KIND_META } from './lifeFormat';
import { LifePills } from './LifePills';
import { EMPTY_QUEUE, enqueueToast, MIN_VISIBLE_MS, nextToast, resetQueue, toastFromAchievements, toastFromResult, type ToastItem, type ToastQueue } from './lifeToastQueue';

/**
 * Distance from the bottom edge at which toasts sit on the life screen, so they clear the
 * tab bar, the round Age button and the banner. The life screen measures and publishes it.
 */
export const useToastLayout = create<{ lifeClearance: number }>(() => ({ lifeClearance: 0 }));

export function setLifeToastClearance(px: number) {
  if (useToastLayout.getState().lifeClearance !== px) useToastLayout.setState({ lifeClearance: px });
}

const NATIVE_DRIVER = Platform.OS !== 'web';

const TOAST_COLOR: Record<LogKind, string> = {
  info: colors.info,
  event: colors.info,
  good: colors.success,
  bad: colors.danger,
  death: colors.danger,
  money: colors.money,
  milestone: colors.accent,
  year: colors.primary,
};

const ICON_TINT: Record<LogKind, string> = {
  info: lifeTints.neutral,
  event: lifeTints.neutral,
  good: lifeTints.up,
  bad: lifeTints.down,
  death: lifeTints.down,
  money: lifeTints.money,
  milestone: lifeTints.accent,
  year: lifeTints.primary,
};

type Action = { type: 'push'; item: ToastItem } | { type: 'next'; id: number } | { type: 'reset' };

function reducer(q: ToastQueue, a: Action): ToastQueue {
  switch (a.type) {
    case 'push':
      return enqueueToast(q, a.item);
    case 'next':
      // Only the toast that finished leaving may advance the queue (a new year may have replaced it).
      return q.current?.id === a.id ? nextToast(q) : q;
    case 'reset':
      return resetQueue(q);
  }
}

/**
 * The one feedback host for the whole app, mounted in the root layout above every route, so
 * the result of a tap shows on the screen where the player tapped. Results queue and show one
 * at a time; the timer only runs while a toast is actually on screen (not behind an event
 * card or an ad). Tap a toast to dismiss it.
 */
export function ResultToast() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const lifeClearance = useToastLayout((s) => s.lifeClearance);
  const paused = useGameStore((s) => !!s.game?.pendingEvent || s.adShowing);
  const haptics = useSettingsStore((s) => s.settings.haptics);
  const [queue, dispatch] = useReducer(reducer, EMPTY_QUEUE);
  const [anim] = useState(() => new Animated.Value(0));
  const leavingId = useRef<number | null>(null);
  const timing = useRef({ id: -1, count: 0, remaining: 0, shown: 0 });

  // Every new result, straight from the store: a store listener sees each one even when
  // several land before React renders again. Achievement unlocks come from the settings store.
  useEffect(() => {
    let seq = 0;
    const offAchievements = useSettingsStore.subscribe((s, prev) => {
      const n = s.achievementNotice;
      if (!n || n === prev.achievementNotice) return;
      const item = toastFromAchievements(n.ids.map((id) => ACHIEVEMENT_BY_ID[id]).filter((d): d is AchievementDef => !!d), ++seq, useGameStore.getState().game?.character.countryCode);
      if (item) dispatch({ type: 'push', item });
    });
    const offResults = useGameStore.subscribe((s, prev) => {
      const g = s.game;
      const p = prev.game;
      if (g === p) return;
      // A new life, no life, or the end of this one: whatever was waiting is about another moment.
      if (!g || (p && (p.character.id !== g.character.id || (p.alive && !g.alive)))) dispatch({ type: 'reset' });
      const r = g?.lastResult;
      if (!g || !r || r === p?.lastResult) return;
      const item = toastFromResult(r, g, p, ++seq);
      if (item) dispatch({ type: 'push', item });
    });
    return () => {
      offAchievements();
      offResults();
    };
  }, []);

  const current = queue.current;
  const currentId = current?.id ?? null;
  const hasPending = queue.pending.length > 0;

  const leave = useCallback(() => {
    if (currentId === null || leavingId.current === currentId) return;
    const id = currentId;
    leavingId.current = id;
    Animated.timing(anim, { toValue: 0, duration: 160, useNativeDriver: NATIVE_DRIVER }).start(() => dispatch({ type: 'next', id }));
  }, [anim, currentId]);

  // Entrance, haptics and screen-reader announcement for each new toast.
  useEffect(() => {
    if (currentId === null || !current) return;
    leavingId.current = null;
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: NATIVE_DRIVER }).start();
    if (Platform.OS !== 'web') {
      if (haptics && (current.kind === 'bad' || current.kind === 'good' || current.kind === 'milestone')) {
        Haptics.notificationAsync(current.kind === 'bad' ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(spoken(current));
    }
    // Only a new toast (not a re-render of the same one) should replay the entrance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, anim]);

  // Dismiss timer: runs only while visible; shortened when other results are waiting.
  useEffect(() => {
    if (!current) return;
    if (timing.current.id !== current.id || timing.current.count !== current.count) {
      timing.current = { id: current.id, count: current.count, remaining: current.duration, shown: 0 };
    }
    if (paused) return;
    const tm = timing.current;
    const wait = hasPending ? Math.min(tm.remaining, Math.max(0, MIN_VISIBLE_MS - tm.shown)) : tm.remaining;
    const started = Date.now();
    const handle = setTimeout(leave, Math.max(0, wait));
    return () => {
      clearTimeout(handle);
      const elapsed = Date.now() - started;
      tm.remaining -= elapsed;
      tm.shown += elapsed;
    };
  }, [current, paused, hasPending, leave]);

  // Behind an event card or an ad the toast waits, hidden, and resumes afterwards.
  if (!current || paused) return null;
  const meta = KIND_META[current.kind];
  const color = TOAST_COLOR[current.kind];
  const bottom = pathname === '/life' && lifeClearance > 0 ? lifeClearance : insets.bottom + spacing.lg;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View
        pointerEvents="box-none"
        style={[styles.wrap, { bottom, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}
      >
        <Pressable
          testID="result-toast"
          onPress={leave}
          accessibilityRole="button"
          accessibilityLabel={spoken(current)}
          accessibilityHint="Dismisses this message"
          accessibilityLiveRegion="polite"
          style={({ pressed }) => [styles.toast, { borderColor: color, borderLeftColor: color }, pressed && styles.pressed]}
        >
          <View style={[styles.iconWrap, { backgroundColor: ICON_TINT[current.kind] }]}>
            <Text style={styles.icon}>{current.icon ?? meta.icon ?? '💬'}</Text>
          </View>
          <View style={styles.body}>
            {current.title ? (
              <Text style={[styles.title, { color: current.kind === 'year' ? violetSoft : color }]} testID="result-toast-title">
                {current.title}
              </Text>
            ) : null}
            {current.text ? (
              <Text style={styles.text} numberOfLines={current.kind === 'year' ? 2 : 4} testID="result-toast-text">
                {current.text}
                {current.count > 1 ? <Text style={styles.count}>{`  ×${current.count}`}</Text> : null}
              </Text>
            ) : null}
            <LifePills pills={current.pills} testID="result-toast-pills" />
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function spoken(t: ToastItem): string {
  return [t.title, t.text, ...t.pills.map((p) => p.a11y)].filter(Boolean).join('. ');
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.lg, right: spacing.lg, alignItems: 'center' },
  toast: {
    width: '100%',
    maxWidth: 440,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderLeftWidth: 4,
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    paddingLeft: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  pressed: { opacity: 0.9 },
  iconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 16 },
  body: { flex: 1, gap: 6, justifyContent: 'center', minHeight: 32 },
  title: { ...typography.label, fontSize: 13, fontWeight: '800' },
  text: { ...typography.body, fontSize: 14, lineHeight: 20 },
  count: { color: colors.textMuted, fontWeight: '700' },
});

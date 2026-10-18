import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';

import type { RibbonDef } from '@/engine/systems/ribbons';
import { colors, legacyColors, radius, spacing, typography } from '@/theme';

type Props = {
  name: string;
  /** "🇧🇷 2005 – 2079 · aged 74". */
  lifespan: string;
  /** "Died of a stroke". */
  cause: string;
  ribbon: RibbonDef | undefined;
  /** First time this ribbon joins the collection. */
  newRibbon: boolean;
  epitaph: string;
};

// The native driver is unavailable on web, where react-native-web animates in JS.
const useNativeDriver = Platform.OS !== 'web';

/**
 * The tombstone with a short reveal: the stone rises in, then the ribbon pops and the epitaph fades in
 * (under a second in all). Skipped when the player asked the system to reduce motion.
 */
export function LegacyTombstone({ name, lifespan, cause, ribbon, newRibbon, epitaph }: Props) {
  const [anim] = useState(() => ({ stone: new Animated.Value(0), ribbon: new Animated.Value(0), epitaph: new Animated.Value(0) }));

  useEffect(() => {
    let cancelled = false;
    const reveal = Animated.sequence([
      Animated.timing(anim.stone, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver }),
      Animated.parallel([
        Animated.spring(anim.ribbon, { toValue: 1, friction: 5, tension: 90, useNativeDriver }),
        Animated.timing(anim.epitaph, { toValue: 1, duration: 280, delay: 80, useNativeDriver }),
      ]),
    ]);
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled) return;
        if (reduce) {
          anim.stone.setValue(1);
          anim.ribbon.setValue(1);
          anim.epitaph.setValue(1);
        } else {
          reveal.start();
        }
      });
    return () => {
      cancelled = true;
      reveal.stop();
    };
  }, [anim]);

  const stoneStyle = {
    opacity: anim.stone,
    transform: [{ translateY: anim.stone.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
  };
  const ribbonStyle = {
    opacity: anim.ribbon.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' as const }),
    transform: [{ scale: anim.ribbon.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
  };

  return (
    <Animated.View style={[styles.stone, stoneStyle]} testID="tombstone">
      <Text style={styles.rip}>R.I.P.</Text>
      <Text style={styles.name} accessibilityRole="header">
        {name}
      </Text>
      <Text style={styles.years}>{lifespan}</Text>
      <Text style={styles.cause} testID="death-cause">
        {cause}
      </Text>
      <Animated.View style={[styles.ribbon, ribbonStyle]} testID="death-ribbon">
        <Text style={styles.ribbonEmoji} accessible={false}>
          {ribbon?.emoji ?? '🎗️'}
        </Text>
        {newRibbon ? (
          <View style={styles.newBadge}>
            <Text style={styles.newText}>NEW RIBBON</Text>
          </View>
        ) : null}
        <Text style={styles.ribbonName}>{ribbon?.name ?? 'Ribbon'}</Text>
        {ribbon?.description ? <Text style={styles.ribbonDesc}>{ribbon.description}</Text> : null}
      </Animated.View>
      <Animated.Text style={[styles.epitaph, { opacity: anim.epitaph }]}>“{epitaph}”</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stone: {
    backgroundColor: legacyColors.stone,
    borderRadius: radius.lg,
    borderTopLeftRadius: 120,
    borderTopRightRadius: 120,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 2,
    borderColor: legacyColors.stoneEdge,
  },
  rip: { ...typography.label, fontSize: 13, letterSpacing: 4, color: colors.textMuted },
  name: { ...typography.title, textAlign: 'center' },
  years: { ...typography.small, fontSize: 14, textAlign: 'center' },
  cause: { ...typography.body, color: colors.danger, textAlign: 'center', marginTop: 2 },
  ribbon: { alignItems: 'center', marginTop: spacing.md, gap: 2 },
  ribbonEmoji: { fontSize: 40, lineHeight: 48 },
  newBadge: { backgroundColor: legacyColors.newRibbon, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2, marginVertical: 2 },
  newText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, color: colors.bg },
  ribbonName: { ...typography.heading, color: colors.accent, textAlign: 'center' },
  ribbonDesc: { ...typography.small, textAlign: 'center' },
  epitaph: { ...typography.body, fontStyle: 'italic', color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
});

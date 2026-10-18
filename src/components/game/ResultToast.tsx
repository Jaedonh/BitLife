import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import type { LastResult } from '@/engine/types';
import { formatMoneyFull } from '@/engine/util';
import { useGameStore } from '@/store/gameStore';
import { colors, radius, spacing, typography } from '@/theme';

function deltaLine(r: LastResult, countryCode: string): string {
  const parts: string[] = [];
  const d = r.statDeltas ?? {};
  const label: Record<string, string> = { happiness: 'Happiness', health: 'Health', smarts: 'Smarts', looks: 'Looks' };
  for (const [k, v] of Object.entries(d)) if (v) parts.push(`${label[k] ?? k} ${v > 0 ? '+' : ''}${v}`);
  if (r.moneyDelta) parts.push(`${r.moneyDelta > 0 ? '+' : '-'}${formatMoneyFull(Math.abs(r.moneyDelta), countryCode)}`);
  return parts.join(' · ');
}

export function ResultToast() {
  const result = useGameStore((s) => s.game?.lastResult ?? null);
  const clear = useGameStore((s) => s.clearResult);
  const countryCode = useGameStore((s) => s.game?.character.countryCode ?? 'US');
  const [opacity] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!result) return;
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => clear());
    }, 2600);
    return () => clearTimeout(t);
  }, [result, opacity, clear]);
  if (!result) return null;
  const border = result.kind === 'good' ? colors.success : result.kind === 'bad' ? colors.danger : colors.info;
  const deltas = deltaLine(result, countryCode);
  return (
    <Animated.View style={[styles.wrap, { opacity }]} pointerEvents="none">
      <View style={[styles.toast, { borderColor: border }]} testID="result-toast">
        <Text style={styles.text}>{result.text}</Text>
        {deltas ? <Text style={styles.deltas}>{deltas}</Text> : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.lg, right: spacing.lg, top: spacing.lg, alignItems: 'center' },
  toast: { backgroundColor: colors.bgElevated, borderRadius: radius.md, borderWidth: 1, padding: spacing.md, maxWidth: 440, width: '100%' },
  text: { ...typography.body },
  deltas: { ...typography.small, marginTop: 4, color: colors.accent },
});

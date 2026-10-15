import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatMoney } from '@/engine/util';
import { useGameStore } from '@/store/gameStore';
import { colors, spacing, typography } from '@/theme';

export function ScreenHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack?: () => void }) {
  const game = useGameStore((s) => s.game);
  return (
    <View style={styles.row}>
      <Pressable
        testID="back"
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
        hitSlop={12}
        style={styles.back}
      >
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <View style={styles.titles}>
        <Text style={typography.heading} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={typography.small} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {game ? (
        <Text style={styles.money} testID="header-money">
          {formatMoney(game.finances.cash, game.character.countryCode)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: colors.bgElevated },
  backText: { color: colors.text, fontSize: 26, lineHeight: 28, marginTop: -2 },
  titles: { flex: 1 },
  money: { ...typography.subheading, color: colors.money, fontVariant: ['tabular-nums'] },
});

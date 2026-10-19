import * as ExpoRouter from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatMoney } from '@/engine/util';
import { useGameStore } from '@/store/gameStore';
import { colors, spacing, typography } from '@/theme';
import { isLifeRoute, totalDebt } from './lifeFormat';

// Rendered outside a router (unit tests of a single screen) there is no pathname to read.
const usePathnameSafe: () => string | null = typeof ExpoRouter.usePathname === 'function' ? ExpoRouter.usePathname : () => null;

/**
 * Where Back goes when there is no history to go back to (a reload or a deep link on web): a screen
 * about the life being played returns to the life screen, a menu screen to the main menu.
 */
export function backFallback(pathname: string | null | undefined, hasLife: boolean): '/life' | '/' {
  return hasLife && isLifeRoute(pathname) ? '/life' : '/';
}

/** Back: the previous screen, or the fallback when the history is empty. */
export function goBack(pathname: string | null | undefined, hasLife: boolean): void {
  if (ExpoRouter.router.canGoBack()) ExpoRouter.router.back();
  else ExpoRouter.router.replace(backFallback(pathname, hasLife));
}

/**
 * Title bar for section and menu screens. Cash (and debt, when there is any) shows only for a
 * living character on the screens about that life: `showMoney` decides explicitly, otherwise
 * the current route does (Work, Assets, People, a person, Activities).
 */
export function ScreenHeader({ title, subtitle, onBack, showMoney }: { title: string; subtitle?: string; onBack?: () => void; showMoney?: boolean }) {
  const game = useGameStore((s) => s.game);
  const pathname = usePathnameSafe();
  const wantMoney = showMoney ?? isLifeRoute(pathname);
  const money = game && game.alive && wantMoney ? game : null;
  const debt = money ? totalDebt(money) : 0;
  return (
    <View style={styles.row}>
      <Pressable
        testID="back"
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={onBack ?? (() => goBack(pathname, !!game))}
        hitSlop={4}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}
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
      {money ? (
        <View style={styles.moneyCol} accessible accessibilityLabel={`${formatMoney(money.finances.cash, money.character.countryCode, money.year)} cash${debt > 0 ? `, ${formatMoney(debt, money.character.countryCode, money.year)} debt` : ''}`}>
          <Text style={styles.money} testID="header-money">
            {formatMoney(money.finances.cash, money.character.countryCode, money.year)}
          </Text>
          {debt > 0 ? (
            <Text style={styles.debt} testID="header-debt">
              {formatMoney(debt, money.character.countryCode, money.year)} debt
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: colors.bgElevated },
  pressed: { opacity: 0.7 },
  backText: { color: colors.text, fontSize: 28, lineHeight: 30, marginTop: -2 },
  titles: { flex: 1 },
  moneyCol: { alignItems: 'flex-end' },
  money: { ...typography.subheading, color: colors.money, fontVariant: ['tabular-nums'] },
  debt: { fontSize: 12, lineHeight: 16, color: colors.danger, fontWeight: '700', fontVariant: ['tabular-nums'] },
});

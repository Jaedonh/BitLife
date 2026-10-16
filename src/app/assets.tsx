import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/game/ScreenHeader';
import { Button, Card, ListRow, Screen, Section, T } from '@/components/ui';
import { ASSETS } from '@/data/assets';
import { assetPrice, canBuy, INVESTMENT_LABELS, netWorth, yearlyMortgagePayment } from '@/engine';
import type { AssetKind, InvestmentKind } from '@/engine/types';
import { formatMoney, formatMoneyFull } from '@/engine/util';
import { useRewarded } from '@/hooks/useRewarded';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, spacing } from '@/theme';

const KIND_LABEL: Record<AssetKind, string> = { car: 'Vehicles', house: 'Property', item: 'Luxury items' };

export default function AssetsScreen() {
  const game = useGameStore((s) => s.game);
  const act = useGameStore((s) => s.act);
  const canUseRewarded = useGameStore((s) => s.canUseRewarded);
  const premium = useSettingsStore((s) => s.premium);
  const { notice: rewardedNotice, run: runRewarded } = useRewarded();
  const [shop, setShop] = useState<AssetKind>('car');
  if (!game) return <Redirect href="/" />;
  const cc = game.character.countryCode;
  const owned = game.assets;
  const fin = game.finances;
  const worth = netWorth(game);
  const investAmount = Math.max(100, Math.round(fin.cash * 0.25));

  return (
    <Screen>
      <ScreenHeader title="Assets" subtitle={`Net worth ${formatMoneyFull(worth, cc)}`} />
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Finances">
          <Card style={styles.card}>
            <Row label="Cash" value={formatMoneyFull(fin.cash, cc)} color={colors.money} />
            {fin.debt > 0 ? <Row label="Debt" value={formatMoneyFull(fin.debt, cc)} color={colors.danger} /> : null}
            {game.education.studentDebt > 0 ? <Row label="Student loans" value={formatMoneyFull(game.education.studentDebt, cc)} color={colors.warning} /> : null}
            <Row label="Last year's income" value={formatMoneyFull(fin.lastYear.income, cc)} />
            <Row label="Last year's expenses" value={formatMoneyFull(fin.lastYear.expenses, cc)} />
            {fin.lastYear.taxes > 0 ? <Row label="Taxes paid" value={formatMoneyFull(fin.lastYear.taxes, cc)} /> : null}
            <View style={styles.row}>
              {fin.debt > 0 ? <Button title="Pay debt" size="sm" onPress={() => act({ type: 'payDebt', amount: fin.cash })} style={styles.flex} testID="pay-debt" /> : null}
              {canUseRewarded('cashBoost') ? <Button title={premium ? '✨ Windfall' : '📺 Windfall'} size="sm" variant="accent" onPress={() => void runRewarded('cashBoost')} style={styles.flex} testID="rewarded-cash" /> : null}
            </View>
            {rewardedNotice ? (
              <T kind="small" testID="rewarded-notice">
                {rewardedNotice}
              </T>
            ) : null}
          </Card>
        </Section>

        {game.character.age >= 16 ? (
          <Section title="Investments">
            {(Object.keys(INVESTMENT_LABELS) as InvestmentKind[]).map((kind) => {
              const inv = fin.investments.find((i) => i.kind === kind);
              return (
                <Card key={kind} style={styles.card}>
                  <T kind="subheading">{INVESTMENT_LABELS[kind].name}</T>
                  <T kind="small">{INVESTMENT_LABELS[kind].description}</T>
                  {inv ? <T kind="small">Balance: {formatMoneyFull(inv.amount, cc)} (invested {formatMoneyFull(inv.costBasis, cc)})</T> : null}
                  <View style={styles.row}>
                    <Button title={`Invest ${formatMoney(investAmount, cc)}`} size="sm" onPress={() => act({ type: 'invest', kind, amount: investAmount })} disabled={fin.cash < 100} style={styles.flex} testID={`invest-${kind}`} />
                    {inv ? <Button title="Withdraw all" size="sm" variant="secondary" onPress={() => act({ type: 'withdraw', kind, amount: inv.amount })} style={styles.flex} testID={`withdraw-${kind}`} /> : null}
                  </View>
                </Card>
              );
            })}
          </Section>
        ) : null}

        {owned.length ? (
          <Section title="Owned">
            {owned.map((a) => (
              <Card key={a.id} style={styles.card}>
                <T kind="subheading">
                  {ASSETS.find((d) => d.id === a.defId)?.emoji ?? '📦'} {a.name}
                  {a.primary ? ' · home' : a.rentedOut ? ' · rented out' : ''}
                </T>
                <T kind="small">
                  Worth {formatMoneyFull(a.value, cc)} · condition {a.condition}% · upkeep {formatMoneyFull(a.yearlyUpkeep, cc)}/yr
                  {a.mortgage ? ` · mortgage ${formatMoneyFull(a.mortgage.remaining, cc)} (${formatMoneyFull(a.mortgage.yearlyPayment, cc)}/yr)` : ''}
                </T>
                <View style={styles.row}>
                  <Button title="Sell" size="sm" variant="secondary" onPress={() => act({ type: 'sellAsset', assetId: a.id })} style={styles.flex} testID={`sell-${a.defId}`} />
                  {a.kind !== 'item' && a.condition < 90 ? <Button title="Repair" size="sm" variant="secondary" onPress={() => act({ type: 'repairAsset', assetId: a.id })} style={styles.flex} /> : null}
                  {a.kind === 'house' && !a.primary ? <Button title={a.rentedOut ? 'Stop renting' : 'Rent out'} size="sm" variant="secondary" onPress={() => act({ type: 'repairAsset', assetId: `rent:${a.id}` })} style={styles.flex} /> : null}
                </View>
              </Card>
            ))}
          </Section>
        ) : null}

        <Section
          title="Shop"
          right={
            <View style={styles.row}>
              {(['car', 'house', 'item'] as AssetKind[]).map((k) => (
                <Button key={k} title={KIND_LABEL[k]} size="sm" variant={shop === k ? 'primary' : 'ghost'} onPress={() => setShop(k)} testID={`shop-${k}`} />
              ))}
            </View>
          }
        >
          {ASSETS.filter((d) => d.kind === shop).map((d) => {
            const price = assetPrice(game, d);
            const cash = canBuy(game, d.id, 'cash');
            const mort = d.mortgageable ? canBuy(game, d.id, 'mortgage') : null;
            const sub = cash.ok ? 'Buy outright' : mort?.ok ? `Mortgage: ${formatMoney(mort.cost, cc)} down, ${formatMoney(yearlyMortgagePayment(price - mort.cost), cc)}/yr` : (mort?.reason ?? cash.reason) || '';
            return (
              <ListRow
                key={d.id}
                emoji={d.emoji}
                title={d.name}
                subtitle={sub}
                right={formatMoney(price, cc)}
                onPress={cash.ok ? () => act({ type: 'buyAsset', defId: d.id, financing: 'cash' }) : mort?.ok ? () => act({ type: 'buyAsset', defId: d.id, financing: 'mortgage' }) : undefined}
                disabled={!cash.ok && !mort?.ok}
                testID={`buy-${d.id}`}
              />
            );
          })}
        </Section>
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.kv}>
      <Text style={styles.k}>{label}</Text>
      <Text style={[styles.v, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  flex: { flex: 1 },
  kv: { flexDirection: 'row', justifyContent: 'space-between' },
  k: { color: colors.textMuted, fontSize: 14 },
  v: { color: colors.text, fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
});

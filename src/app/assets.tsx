import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/game/ScreenHeader';
import { WorkActionRow } from '@/components/game/WorkActionRow';
import { Chip, ChipGroup } from '@/components/game/WorkChip';
import { DangerButton } from '@/components/game/WorkDangerButton';
import { Sheet, type SheetAction } from '@/components/game/WorkSheet';
import { Button, Card, confirmAction, Screen, Section, T } from '@/components/ui';
import { ASSET_BY_ID } from '@/data/assets';
import { assetPrice, canBuy, INVEST_MIN_AGE, INVESTMENT_LABELS, netWorth, yearlyMortgagePayment } from '@/engine';
import { assetsForSale, DOWN_PAYMENT, MORTGAGE_RATE, MORTGAGE_YEARS } from '@/engine/systems/assets';
import { investmentKinds } from '@/engine/systems/finance';
import type { Asset, AssetKind } from '@/engine/types';
import { formatMoney, formatMoneyFull, lowerTitle } from '@/engine/util';
import { useRewarded } from '@/hooks/useRewarded';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, spacing, workUi } from '@/theme';

const KIND_LABEL: Record<AssetKind, string> = { car: 'Vehicles', house: 'Property', item: 'Luxury' };

/** Share of cash to invest, or of a balance to withdraw. */
const AMOUNT_STEPS = [10, 25, 50, 100] as const;
type AmountStep = (typeof AMOUNT_STEPS)[number];

/** What selling returns: the engine pays 95% of value, less any mortgage still owed. */
const SALE_RATE = 0.95;

/** "+₹1,240 (+8.3%)" in green, "-₹300 (-2.1%)" in red, "±₹0 (0.0%)" in grey. */
function gainLine(gain: number, basis: number, cc: string, yr: number): { text: string; color: string } {
  const sign = gain >= 0.5 ? '+' : gain <= -0.5 ? '-' : '±';
  const pct = basis > 0 ? ` (${sign === '±' ? '' : sign}${Math.abs((gain / basis) * 100).toFixed(1)}%)` : '';
  const color = sign === '+' ? workUi.gain : sign === '-' ? workUi.loss : colors.textMuted;
  return { text: `${sign}${formatMoneyFull(sign === '±' ? 0 : Math.abs(gain), cc, yr)}${pct}`, color };
}

export default function AssetsScreen() {
  const game = useGameStore((s) => s.game);
  const act = useGameStore((s) => s.act);
  const canUseRewarded = useGameStore((s) => s.canUseRewarded);
  const premium = useSettingsStore((s) => s.premium);
  const { notice: rewardedNotice, run: runRewarded } = useRewarded();
  const [shop, setShop] = useState<AssetKind>('car');
  const [step, setStep] = useState<AmountStep>(25);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  if (!game) return <Redirect href="/" />;
  const cc = game.character.countryCode;
  // Amounts in this year's currency (lire, marks, francs or pesetas before the euro, as the journal shows them).
  const yr = game.year;
  const owned = game.assets;
  const fin = game.finances;
  const worth = netWorth(game);
  const canInvest = game.character.age >= INVEST_MIN_AGE;
  const investAmount = Math.round((fin.cash * step) / 100);
  const portfolioValue = fin.investments.reduce((sum, i) => sum + i.amount, 0);
  const portfolioBasis = fin.investments.reduce((sum, i) => sum + i.costBasis, 0);
  const portfolio = gainLine(portfolioValue - portfolioBasis, portfolioBasis, cc, yr);

  const buying = buyingId ? ASSET_BY_ID[buyingId] : undefined;
  const buyPrice = buying ? assetPrice(game, buying) : 0;
  const buyCash = buying ? canBuy(game, buying.id, 'cash') : null;
  const buyMortgage = buying?.mortgageable ? canBuy(game, buying.id, 'mortgage') : null;
  const down = Math.round(buyPrice * DOWN_PAYMENT);
  const loan = buyPrice - down;
  const yearly = yearlyMortgagePayment(loan);

  function buy(financing: 'cash' | 'mortgage') {
    if (buying) act({ type: 'buyAsset', defId: buying.id, financing });
    setBuyingId(null);
  }

  async function sell(a: Asset) {
    const proceeds = Math.round(a.value * SALE_RATE - (a.mortgage?.remaining ?? 0));
    const home = a.primary ? ' This is the home you live in.' : '';
    const message =
      proceeds >= 0
        ? `You'll get about ${formatMoneyFull(proceeds, cc, yr)}${a.mortgage ? ' after paying off the mortgage' : ' after fees'}.${home}`
        : `The mortgage is bigger than the sale price: you'll still owe about ${formatMoneyFull(-proceeds, cc, yr)}.${home}`;
    if (await confirmAction(`Sell your ${lowerTitle(a.name)}?`, message, 'Sell')) act({ type: 'sellAsset', assetId: a.id });
  }

  const mortgageAction: SheetAction | null = buyMortgage
    ? {
        title: `Take the mortgage · ${formatMoney(down, cc, yr)} down`,
        onPress: () => buy('mortgage'),
        variant: buyMortgage.ok ? 'primary' : 'secondary',
        disabled: !buyMortgage.ok,
        note: buyMortgage.ok ? undefined : buyMortgage.reason,
        testID: 'buy-mortgage',
      }
    : null;
  const cashAction: SheetAction | null = buyCash
    ? {
        title: `Pay ${formatMoney(buyPrice, cc, yr)} in cash`,
        onPress: () => buy('cash'),
        variant: buyCash.ok && !buyMortgage?.ok ? 'primary' : 'secondary',
        disabled: !buyCash.ok,
        note: buyCash.ok ? undefined : buyCash.reason,
        testID: 'buy-cash',
      }
    : null;
  const sheetActions = (buyMortgage?.ok ? [mortgageAction, cashAction] : [cashAction, mortgageAction]).filter((a): a is SheetAction => !!a);

  return (
    <Screen>
      <ScreenHeader title="Assets" subtitle={`Net worth ${formatMoneyFull(worth, cc, yr)}`} />
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Finances">
          <Card style={styles.card}>
            <Row label="Cash" value={formatMoneyFull(fin.cash, cc, yr)} color={colors.money} />
            {fin.debt > 0 ? <Row label="Debt" value={formatMoneyFull(fin.debt, cc, yr)} color={colors.danger} /> : null}
            {game.education.studentDebt > 0 ? <Row label="Student loans" value={formatMoneyFull(game.education.studentDebt, cc, yr)} color={colors.warning} /> : null}
            <Row label="Last year's income" value={formatMoneyFull(fin.lastYear.income, cc, yr)} />
            <Row label="Last year's expenses" value={formatMoneyFull(fin.lastYear.expenses, cc, yr)} />
            {fin.lastYear.taxes > 0 ? <Row label="Taxes paid" value={formatMoneyFull(fin.lastYear.taxes, cc, yr)} /> : null}
            <View style={styles.row}>
              {fin.debt > 0 ? <Button title={fin.cash > 0 ? 'Pay debt' : 'No cash to pay debt'} size="sm" onPress={() => act({ type: 'payDebt', amount: fin.cash })} disabled={fin.cash <= 0} style={[styles.flex, styles.tap]} testID="pay-debt" /> : null}
              {canUseRewarded('cashBoost') ? <Button title={premium ? '✨ Windfall' : '📺 Windfall'} size="sm" variant="accent" onPress={() => void runRewarded('cashBoost')} style={[styles.flex, styles.tap]} testID="rewarded-cash" /> : null}
            </View>
            {rewardedNotice ? (
              <T kind="small" testID="rewarded-notice">
                {rewardedNotice}
              </T>
            ) : null}
          </Card>
        </Section>

        {canInvest || fin.investments.length ? (
          <Section title="Investments">
            {fin.investments.length ? (
              <Card style={styles.card} testID="portfolio">
                <Row label="Portfolio value" value={formatMoneyFull(portfolioValue, cc, yr)} />
                <Row label="You put in" value={formatMoneyFull(portfolioBasis, cc, yr)} />
                <Row label="Gain / loss" value={portfolio.text} color={portfolio.color} />
              </Card>
            ) : null}
            <Card style={styles.card}>
              <T kind="label">AMOUNT</T>
              <ChipGroup label="Amount to invest or withdraw">
                {AMOUNT_STEPS.map((p) => (
                  <Chip key={p} label={`${p}%`} selected={step === p} onPress={() => setStep(p)} accessibilityLabel={`${p} percent`} testID={`amount-${p}`} />
                ))}
              </ChipGroup>
              <T kind="small">{canInvest ? `Invest moves ${step}% of your cash (${formatMoneyFull(investAmount, cc, yr)}). Withdraw takes ${step}% of that balance.` : `Withdraw takes ${step}% of that balance. Investing opens at ${INVEST_MIN_AGE}.`}</T>
            </Card>
            {investmentKinds(game).map((kind) => {
              const inv = fin.investments.find((i) => i.kind === kind);
              const gain = inv ? gainLine(inv.amount - inv.costBasis, inv.costBasis, cc, yr) : null;
              const withdrawAmount = inv ? (step === 100 ? inv.amount : Math.round((inv.amount * step) / 100)) : 0;
              return (
                <Card key={kind} style={styles.card}>
                  <View style={styles.titleRow}>
                    <T kind="subheading" style={styles.flex}>
                      {INVESTMENT_LABELS[kind].name}
                    </T>
                    {inv ? <Text style={styles.balance}>{formatMoneyFull(inv.amount, cc, yr)}</Text> : null}
                  </View>
                  <T kind="small">{INVESTMENT_LABELS[kind].description}</T>
                  {inv && gain ? (
                    <Text style={styles.small}>
                      Put in {formatMoneyFull(inv.costBasis, cc, yr)} · <Text style={[styles.gain, { color: gain.color }]}>{gain.text}</Text>
                    </Text>
                  ) : null}
                  <View style={styles.row}>
                    {canInvest ? (
                      <Button title={`Invest ${formatMoney(investAmount, cc, yr)}`} size="sm" onPress={() => act({ type: 'invest', kind, amount: investAmount })} disabled={investAmount <= 0} style={[styles.flex, styles.tap]} testID={`invest-${kind}`} />
                    ) : null}
                    {inv ? (
                      <Button
                        title={step === 100 ? 'Withdraw all' : `Withdraw ${formatMoney(withdrawAmount, cc, yr)}`}
                        size="sm"
                        variant="secondary"
                        onPress={() => act({ type: 'withdraw', kind, amount: withdrawAmount })}
                        disabled={withdrawAmount <= 0}
                        style={[styles.flex, styles.tap]}
                        testID={`withdraw-${kind}`}
                      />
                    ) : null}
                  </View>
                </Card>
              );
            })}
          </Section>
        ) : null}

        {owned.length ? (
          <Section title="Owned">
            {owned.map((a) => {
              const repairable = a.kind !== 'item' && a.condition < 90;
              const rentable = a.kind === 'house' && !a.primary;
              return (
                <Card key={a.id} style={styles.card}>
                  <T kind="subheading">
                    {ASSET_BY_ID[a.defId]?.emoji ?? '📦'} {a.name}
                    {a.primary ? ' · where I live' : a.rentedOut ? ' · rented out' : ''}
                  </T>
                  <Row label="Worth" value={formatMoneyFull(a.value, cc, yr)} />
                  {a.kind !== 'item' ? <Row label="Condition" value={`${a.condition}%`} color={a.condition < 50 ? colors.warning : undefined} /> : null}
                  <Row label="Upkeep" value={`${formatMoneyFull(a.yearlyUpkeep, cc, yr)}/yr`} />
                  {a.mortgage ? <Row label="Mortgage left" value={`${formatMoneyFull(a.mortgage.remaining, cc, yr)} · ${formatMoneyFull(a.mortgage.yearlyPayment, cc, yr)}/yr`} color={colors.warning} /> : null}
                  {repairable || rentable ? (
                    <View style={styles.row}>
                      {repairable ? <Button title="Repair" size="sm" variant="secondary" onPress={() => act({ type: 'repairAsset', assetId: a.id })} style={[styles.flex, styles.tap]} testID={`repair-${a.defId}`} /> : null}
                      {rentable ? (
                        <Button title={a.rentedOut ? 'Stop renting' : 'Rent out'} size="sm" variant="secondary" onPress={() => act({ type: 'repairAsset', assetId: `rent:${a.id}` })} style={[styles.flex, styles.tap]} testID={`rent-${a.defId}`} />
                      ) : null}
                    </View>
                  ) : null}
                  <DangerButton title="Sell" onPress={() => void sell(a)} testID={`sell-${a.defId}`} accessibilityLabel={`Sell ${a.name}`} />
                </Card>
              );
            })}
          </Section>
        ) : null}

        <Section title="Shop">
          <ChipGroup label="Shop category">
            {(['car', 'house', 'item'] as AssetKind[]).map((k) => (
              <Chip key={k} label={KIND_LABEL[k]} selected={shop === k} onPress={() => setShop(k)} testID={`shop-${k}`} />
            ))}
          </ChipGroup>
          {assetsForSale(game).filter((d) => d.kind === shop).map((d) => {
            const price = assetPrice(game, d);
            const cash = canBuy(game, d.id, 'cash');
            const mort = d.mortgageable ? canBuy(game, d.id, 'mortgage') : null;
            const sub = d.mortgageable
              ? cash.ok && mort?.ok
                ? 'Pay cash or take a mortgage'
                : mort?.ok
                  ? `Mortgage: ${formatMoney(mort.cost, cc, yr)} down, ${formatMoney(yearlyMortgagePayment(price - mort.cost), cc, yr)}/yr`
                  : cash.ok
                    ? 'Pay cash'
                    : (mort?.reason ?? cash.reason ?? '')
              : cash.ok
                ? 'Buy outright'
                : (cash.reason ?? '');
            const open = cash.ok || !!mort?.ok;
            return (
              <WorkActionRow
                key={d.id}
                emoji={d.emoji}
                title={d.name}
                subtitle={sub}
                badges={[{ label: `Upkeep ${formatMoney(price * d.upkeepRate, cc, yr)}/yr`, tone: 'neutral' }]}
                value={formatMoney(price, cc, yr)}
                onPress={open ? () => (d.mortgageable ? setBuyingId(d.id) : act({ type: 'buyAsset', defId: d.id, financing: 'cash' })) : undefined}
                disabled={!open}
                accessibilityHint={d.mortgageable ? 'Shows the price and mortgage terms' : 'Buys it with cash'}
                testID={`buy-${d.id}`}
              />
            );
          })}
        </Section>
      </ScrollView>

      <Sheet
        visible={!!buying}
        onClose={() => setBuyingId(null)}
        emoji={buying?.emoji}
        title={buying?.name ?? ''}
        subtitle={`Price ${formatMoneyFull(buyPrice, cc, yr)}`}
        rows={
          buying
            ? [
                { label: `Down payment (${Math.round(DOWN_PAYMENT * 100)}%)`, value: formatMoneyFull(down, cc, yr) },
                { label: 'Mortgage loan', value: formatMoneyFull(loan, cc, yr) },
                { label: 'Yearly payment', value: `${formatMoneyFull(yearly, cc, yr)}/yr`, strong: true, color: colors.warning },
                { label: 'Term', value: `${MORTGAGE_YEARS} years at ${Math.round(MORTGAGE_RATE * 1000) / 10}%` },
                { label: 'Total repaid', value: formatMoneyFull(yearly * MORTGAGE_YEARS, cc, yr) },
                { label: 'Upkeep', value: `${formatMoneyFull(Math.round(buyPrice * buying.upkeepRate), cc, yr)}/yr` },
                { label: 'Your cash', value: formatMoneyFull(fin.cash, cc, yr), color: colors.money },
              ]
            : []
        }
        note={`With a mortgage you pay ${formatMoneyFull(down, cc, yr)} now and ${formatMoneyFull(yearly, cc, yr)} a year for ${MORTGAGE_YEARS} years. Selling the home pays off whatever is left.`}
        actions={sheetActions}
        testID="buy-sheet"
      />
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
  tap: { minHeight: workUi.touch },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  balance: { color: colors.money, fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
  small: { color: colors.textMuted, fontSize: 13 },
  gain: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  kv: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  k: { color: colors.textMuted, fontSize: 14, flexShrink: 1 },
  v: { color: colors.text, fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'], textAlign: 'right', flexShrink: 1 },
});

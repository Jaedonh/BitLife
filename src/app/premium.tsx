import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/game/ScreenHeader';
import { Button, Card, Screen, T } from '@/components/ui';
import { buyPremium, restorePremium } from '@/services/monetization';
import { purchases, type PremiumOffer } from '@/services/purchases';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, spacing, typography } from '@/theme';

const PERKS = [
  ['🚫', 'No ads, ever', 'No banners, no interstitials. Rewarded perks are granted instantly.'],
  ['🎚️', 'Custom starting stats', 'Choose Happiness, Health, Smarts and Looks, or be born into wealth.'],
  ['🧬', 'Unlimited generations', 'Free play hands off to your child once per family line; Premium continues forever.'],
  ['✨', 'Instant second chances', 'Undo death once per life without watching anything.'],
  ['🔮', 'Everything we add next', 'All future core content stays free for everyone; premium perks keep growing.'],
] as const;

export default function PremiumScreen() {
  const premium = useSettingsStore((s) => s.premium);
  const [offer, setOffer] = useState<PremiumOffer | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const supported = purchases.isSupported();

  useEffect(() => {
    let live = true;
    purchases.getPremiumOffer().then((o) => live && setOffer(o)).catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const buy = async () => {
    setBusy(true);
    const r = await buyPremium();
    setBusy(false);
    if (r === 'purchased') {
      setMsg('Welcome to Premium!');
      setTimeout(() => router.back(), 800);
    } else if (r === 'cancelled') setMsg(null);
    else if (r === 'unavailable') setMsg('Purchases are not available in this build. Install the store version to upgrade.');
    else setMsg('The purchase could not be completed. Please try again.');
  };

  return (
    <Screen>
      <ScreenHeader title="LifeLoop Premium" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hero}>✨</Text>
        <Text style={styles.title}>One purchase. Every life.</Text>
        <T kind="small" style={{ textAlign: 'center' }}>
          The whole game is free. Premium removes ads and adds perks for people who want to support development.
        </T>
        <Card style={styles.card}>
          {PERKS.map(([emoji, title, desc]) => (
            <View key={title} style={styles.perk}>
              <Text style={styles.perkEmoji}>{emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={typography.subheading}>{title}</Text>
                <Text style={typography.small}>{desc}</Text>
              </View>
            </View>
          ))}
        </Card>
        {premium ? (
          <Card style={styles.card}>
            <T kind="subheading">✨ You already have Premium. Thank you!</T>
          </Card>
        ) : (
          <>
            <Button testID="buy-premium" title={offer ? `Unlock Premium · ${offer.priceString}` : supported ? 'Unlock Premium' : 'Unlock Premium (store build only)'} size="lg" variant="accent" loading={busy} disabled={!supported} onPress={() => void buy()} />
            <Button title="Restore purchases" variant="ghost" onPress={() => void restorePremium().then((ok) => setMsg(ok ? 'Premium restored.' : 'Nothing to restore on this account.'))} testID="premium-restore" />
          </>
        )}
        {msg ? (
          <T kind="small" style={{ textAlign: 'center' }}>
            {msg}
          </T>
        ) : null}
        <T kind="small" style={{ textAlign: 'center', color: colors.textFaint }}>
          One-time purchase. Not a subscription. Price shown in your local currency by the store.
        </T>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl, maxWidth: 520, width: '100%', alignSelf: 'center' },
  hero: { fontSize: 56, textAlign: 'center' },
  title: { ...typography.title, textAlign: 'center' },
  card: { gap: spacing.md },
  perk: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  perkEmoji: { fontSize: 24, width: 32 },
});

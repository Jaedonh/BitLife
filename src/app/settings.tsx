import * as Application from 'expo-application';
import { router } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import { useState } from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/game/ScreenHeader';
import { Button, Card, Screen, Section, T } from '@/components/ui';
import { PRIVACY_URL, SUPPORT_EMAIL } from '@/config/legal';
import { ads } from '@/services/ads';
import { restorePremium } from '@/services/monetization';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, spacing, typography } from '@/theme';

export default function SettingsScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const setSetting = useSettingsStore((s) => s.setSetting);
  const premium = useSettingsStore((s) => s.premium);
  const abandon = useGameStore((s) => s.abandonLife);
  const game = useGameStore((s) => s.game);
  const [restoring, setRestoring] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const restore = async () => {
    setRestoring(true);
    const ok = await restorePremium();
    setRestoring(false);
    setMsg(ok ? 'Premium restored. Thank you!' : 'No previous purchase found for this store account.');
  };

  const deleteLife = () => {
    const go = () => {
      abandon();
      router.replace('/');
    };
    if (Platform.OS === 'web') {
        if (globalThis.confirm?.('Delete the current life? This cannot be undone.')) go();
      return;
    }
    Alert.alert('Delete current life?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: go },
    ]);
  };

  return (
    <Screen>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Gameplay">
          <Card style={styles.card}>
            <Row label="Haptic feedback" value={settings.haptics} onChange={(v) => setSetting('haptics', v)} />
            <Row label="Show karma on tombstone & profile" value={settings.showKarma} onChange={(v) => setSetting('showKarma', v)} />
          </Card>
        </Section>
        <Section title="Premium">
          <Card style={styles.card}>
            <T kind="body">{premium ? '✨ Premium is active on this device.' : 'Remove ads and unlock premium perks with a one-time purchase.'}</T>
            <T kind="small">Free forever: every event, career, country, relationship, asset, activity, crime and ribbon, one generation hand-off per family line, and all future core content. Premium only adds no ads, custom starting stats, unlimited generations and instant second chances.</T>
            <View style={styles.row}>
              {!premium ? <Button title="Go Premium" onPress={() => router.push('/premium')} style={styles.flex} testID="settings-premium" /> : null}
              <Button title="Restore purchases" variant="secondary" loading={restoring} onPress={() => void restore()} style={styles.flex} testID="restore-purchases" />
            </View>
            {msg ? <T kind="small">{msg}</T> : null}
          </Card>
        </Section>
        <Section title="Privacy">
          <Card style={styles.card}>
            <T kind="small">LifeLoop stores your saves on this device only. Ads are provided by Google AdMob; purchases are processed by the app store and RevenueCat.</T>
            <View style={styles.row}>
              <Button title="Privacy policy" variant="secondary" onPress={() => void Linking.openURL(PRIVACY_URL)} style={styles.flex} testID="privacy-policy" />
              {ads.isPrivacyOptionsRequired() ? <Button title="Ad privacy options" variant="secondary" onPress={() => void ads.showPrivacyOptions()} style={styles.flex} /> : null}
            </View>
          </Card>
        </Section>
        <Section title="Support">
          <Card style={styles.card}>
            <View style={styles.row}>
              <Button title="Rate LifeLoop" variant="secondary" onPress={() => void StoreReview.isAvailableAsync().then((ok) => (ok ? StoreReview.requestReview() : undefined)).catch(() => {})} style={styles.flex} />
              <Button title="Contact" variant="secondary" onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} style={styles.flex} />
            </View>
          </Card>
        </Section>
        <Section title="Danger zone">
          <Card style={styles.card}>
            <Button title="Delete current life" variant="danger" onPress={deleteLife} disabled={!game} testID="delete-life" />
          </Card>
        </Section>
        <Text style={styles.version}>
          LifeLoop {Application.nativeApplicationVersion ?? '1.0.0'} ({Application.nativeBuildVersion ?? 'web'})
        </Text>
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggle}>
      <Text style={typography.body}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary, false: colors.cardBorder }} thumbColor={colors.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  toggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  version: { ...typography.small, textAlign: 'center', marginTop: spacing.lg },
});

import * as Application from 'expo-application';
import { router } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import { useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/game/ScreenHeader';
import { Button, Card, confirmAction, Screen, Section, T } from '@/components/ui';
import { PRIVACY_URL, SUPPORT_EMAIL } from '@/config/legal';
import { usingTestAds } from '@/config/monetization';
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

  const deleteLife = async () => {
    if (!(await confirmAction('Delete current life?', 'This cannot be undone.', 'Delete'))) return;
    abandon();
    router.replace('/');
  };

  return (
    <Screen>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Gameplay">
          <Card style={styles.card}>
            <Row label="Haptic feedback" detail="A light tap when you choose an answer." value={settings.haptics} onChange={(v) => setSetting('haptics', v)} testID="setting-haptics" />
            <View style={styles.divider} />
            <Row label="Show karma" detail="Karma is hidden by default. Turn this on to see it on your life card and on the tombstone." value={settings.showKarma} onChange={(v) => setSetting('showKarma', v)} testID="setting-karma" />
          </Card>
        </Section>
        <Section title="Premium">
          <Card style={styles.card}>
            <T kind="body">{premium ? '✨ Premium is active on this device.' : 'Remove ads and unlock premium perks with a one-time purchase.'}</T>
            <T kind="small">Free forever: every event, career, country, relationship, asset, activity, crime and ribbon, one generation hand-off per family line, and all future core content. Premium only adds no ads, custom starting stats, unlimited generations and instant second chances.</T>
            <View style={styles.stack}>
              {!premium ? <Button title="Go Premium" onPress={() => router.push('/premium')} testID="settings-premium" /> : null}
              <Button title="Restore purchases" variant="secondary" loading={restoring} onPress={() => void restore()} testID="restore-purchases" />
            </View>
            {msg ? <T kind="small">{msg}</T> : null}
          </Card>
        </Section>
        <Section title="Privacy">
          <Card style={styles.card}>
            <T kind="small">LifeLoop stores your saves on this device only. Ads are provided by Google AdMob; purchases are processed by the app store and RevenueCat.</T>
            <View style={styles.stack}>
              <Button title="Privacy policy" variant="secondary" onPress={() => void Linking.openURL(PRIVACY_URL)} testID="privacy-policy" />
              {ads.isPrivacyOptionsRequired() ? <Button title="Ad privacy options" variant="secondary" onPress={() => void ads.showPrivacyOptions()} /> : null}
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
            <T kind="small">Ends the life you are playing without a tombstone. Your graveyard and purchases stay.</T>
            <Button title="Delete current life" variant="danger" onPress={() => void deleteLife()} disabled={!game} testID="delete-life" />
          </Card>
        </Section>
        <Text style={styles.version}>
          LifeLoop {Application.nativeApplicationVersion ?? '1.0.0'} ({Application.nativeBuildVersion ?? 'web'})
          {/* Visible proof that this binary serves Google's test ad units (dev/preview builds; never a store build). */}
          {ads.isSupported() && usingTestAds ? ' · test ads' : ''}
        </Text>
      </ScrollView>
    </Screen>
  );
}

/** react-native-web paints the "on" thumb teal unless told otherwise (activeThumbColor is a web-only prop). */
const WEB_SWITCH = (Platform.OS === 'web' ? { activeThumbColor: colors.text } : {}) as object;

/** A whole-row toggle: the label, its explanation and the switch form one 48+ px tap target. */
function Row({ label, detail, value, onChange, testID }: { label: string; detail: string; value: boolean; onChange: (v: boolean) => void; testID: string }) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={detail}
      accessibilityState={{ checked: value }}
      style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
      testID={testID}
    >
      <View style={styles.toggleText}>
        <Text style={typography.subheading}>{label}</Text>
        <Text style={typography.small}>{detail}</Text>
      </View>
      {/* The row handles the tap; the switch only shows the state, so one tap never toggles twice. */}
      <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants">
        <Switch value={value} trackColor={{ true: colors.primary, false: colors.cardBorder }} thumbColor={colors.text} {...WEB_SWITCH} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  stack: { gap: spacing.sm },
  flex: { flex: 1 },
  toggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md, minHeight: 48, paddingVertical: spacing.xs },
  toggleText: { flex: 1, gap: 2 },
  pressed: { opacity: 0.8 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.cardBorder },
  version: { ...typography.small, textAlign: 'center', marginTop: spacing.lg },
});

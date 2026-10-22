import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { achievementProgress } from '@/components/game/achievements';
import { LegacyAvatar } from '@/components/game/LegacyAvatar';
import { causeLine, lifeAvatar, ribbonTally } from '@/components/game/legacy';
import { lifeStatus } from '@/components/game/StatsHeader';
import { BrandMark, Button, Card, confirmAction, Screen, T } from '@/components/ui';
import { getCountry } from '@/data/countries';
import { RIBBON_BY_ID, RIBBONS } from '@/engine';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, legacyColors, radius, spacing, typography } from '@/theme';

export default function MenuScreen() {
  const game = useGameStore((s) => s.game);
  const newLife = useGameStore((s) => s.newLife);
  const premium = useSettingsStore((s) => s.premium);
  const graveyard = useSettingsStore((s) => s.graveyard);
  const showKarma = useSettingsStore((s) => s.settings.showKarma);
  const unlocked = useSettingsStore((s) => s.achievements);
  const achievements = achievementProgress(unlocked);
  const alive = !!game && game.alive;
  const dead = !!game && !game.alive;
  const earned = Object.keys(ribbonTally(graveyard)).filter((id) => RIBBON_BY_ID[id]).length;
  const lastRibbon = graveyard[0] ? RIBBON_BY_ID[graveyard[0].ribbonId] : undefined;

  const startRandom = async () => {
    if (alive && !(await confirmAction('Start a new life?', 'Your current life will be lost.', 'Start over'))) return;
    newLife({});
    router.replace('/life');
  };

  const graveyardSubtitle = graveyard.length
    ? `${graveyard.length} ${graveyard.length === 1 ? 'life' : 'lives'} · ${earned}/${RIBBONS.length} ribbons${lastRibbon ? ` · last: ${lastRibbon.emoji} ${lastRibbon.name}` : ''}`
    : 'Finished lives and your ribbon collection';

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.brand, game ? styles.brandCompact : null]}>
          <BrandMark size={game ? 40 : 96} />
          <Text style={[styles.title, game ? styles.titleCompact : null]} accessibilityRole="header">
            Yearborn
          </Text>
          {!game ? <T kind="small">Live a thousand lives. Keep the one you like.</T> : null}
        </View>

        {alive && game ? (
          <Card style={styles.lifeCard} testID="current-life">
            <T kind="label">CURRENT LIFE</T>
            <View style={styles.lifeTop}>
              <LegacyAvatar emoji={lifeAvatar(game.character.gender, game.character.age)} size={56} />
              <View style={styles.lifeText}>
                <Text style={typography.heading} numberOfLines={2} testID="home-life-name">
                  {game.character.firstName} {game.character.lastName}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  Age {game.character.age} · {getCountry(game.character.countryCode).flag} {game.character.city}
                </Text>
                <Text style={typography.small} numberOfLines={1} testID="home-life-status">
                  {lifeStatus(game)}
                </Text>
                {showKarma ? (
                  <Text style={styles.karma} testID="home-karma">
                    ⚖️ Karma {game.character.karma}%
                  </Text>
                ) : null}
              </View>
            </View>
            <Button title="Continue" size="lg" variant="accent" onPress={() => router.replace('/life')} testID="continue-life" accessibilityLabel={`Continue as ${game.character.firstName} ${game.character.lastName}`} />
          </Card>
        ) : dead && game ? (
          <Card style={styles.lifeCard} testID="last-life">
            <T kind="label">LAST LIFE</T>
            <View style={styles.lifeTop}>
              <LegacyAvatar emoji="🪦" size={56} style={styles.graveAvatar} />
              <View style={styles.lifeText}>
                <Text style={typography.heading} numberOfLines={2}>
                  {game.character.firstName} {game.character.lastName}
                </Text>
                <Text style={styles.meta} numberOfLines={2}>
                  {game.death ? `${causeLine(game.death.cause)} at ${game.character.age}` : `Aged ${game.character.age}`}
                </Text>
              </View>
            </View>
            <Button title="View tombstone" variant="secondary" onPress={() => router.replace('/death')} testID="view-death" />
          </Card>
        ) : null}

        <View style={styles.group}>
          {game ? <T kind="label" style={styles.groupLabel}>START A NEW LIFE</T> : null}
          <View style={styles.tiles}>
            <Tile emoji="🎲" title="Random life" subtitle="Random country, family and looks" primary={!alive} onPress={() => void startRandom()} testID="new-random-life" label="New random life" />
            <Tile emoji="✏️" title="Custom life" subtitle="Pick how it starts, a name and a country" onPress={() => router.push('/new-life')} testID="new-custom-life" label="Custom life" />
          </View>
        </View>

        <View style={styles.nav}>
          <NavRow emoji="🪦" title="Graveyard" subtitle={graveyardSubtitle} onPress={() => router.push('/graveyard')} testID="menu-graveyard" />
          <NavRow
            emoji="🏆"
            title="Achievements"
            subtitle={achievements.unlocked ? `${achievements.unlocked}/${achievements.total} unlocked` : `${achievements.total} goals that carry over from life to life`}
            onPress={() => router.push('/achievements')}
            testID="menu-achievements"
          />
          <NavRow emoji="⚙️" title="Settings" subtitle="Haptics, karma, purchases and privacy" onPress={() => router.push('/settings')} testID="menu-settings" />
        </View>

        {!premium ? (
          <Card onPress={() => router.push('/premium')} style={styles.premiumCard} testID="menu-premium">
            <T kind="subheading">✨ Go Premium</T>
            <T kind="small">Remove ads, unlock custom stats, unlimited generations, and more.</T>
          </Card>
        ) : (
          <T kind="small" style={styles.center}>
            ✨ Premium active. Thank you for supporting Yearborn.
          </T>
        )}
      </ScrollView>
    </Screen>
  );
}

function Tile({ emoji, title, subtitle, onPress, testID, label, primary }: { emoji: string; title: string; subtitle: string; onPress: () => void; testID: string; label: string; primary?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={subtitle}
      style={({ pressed }) => [styles.tile, primary ? styles.tilePrimary : styles.tileSecondary, pressed && styles.pressed]}
      testID={testID}
    >
      <Text style={styles.tileEmoji} accessible={false}>
        {emoji}
      </Text>
      <Text style={[styles.tileTitle, primary && styles.tileTitlePrimary]}>{title}</Text>
      <Text style={[styles.tileSubtitle, primary && styles.tileSubtitlePrimary]}>{subtitle}</Text>
    </Pressable>
  );
}

function NavRow({ emoji, title, subtitle, onPress, testID }: { emoji: string; title: string; subtitle: string; onPress: () => void; testID: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title} accessibilityHint={subtitle} style={({ pressed }) => [styles.navRow, pressed && styles.pressed]} testID={testID}>
      <Text style={styles.navEmoji} accessible={false}>
        {emoji}
      </Text>
      <View style={styles.navText}>
        <Text style={typography.subheading}>{title}</Text>
        <Text style={typography.small} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl, maxWidth: 520, width: '100%', alignSelf: 'center' },
  brand: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.xxl, marginBottom: spacing.lg },
  brandCompact: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.sm, marginBottom: 0 },
  title: { ...typography.title, fontSize: 34 },
  titleCompact: { fontSize: 24 },
  lifeCard: { gap: spacing.md },
  lifeTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  lifeText: { flex: 1, gap: 2 },
  meta: { ...typography.small, color: colors.text },
  karma: { ...typography.small, color: colors.info, fontWeight: '600' },
  graveAvatar: { backgroundColor: legacyColors.stone },
  group: { gap: spacing.sm },
  groupLabel: { paddingHorizontal: spacing.xs },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  tile: { flex: 1, minHeight: 112, borderRadius: radius.lg, padding: spacing.md, gap: 2, borderWidth: 1 },
  tilePrimary: { backgroundColor: colors.accent, borderColor: colors.accent },
  tileSecondary: { backgroundColor: colors.bgElevated, borderColor: colors.cardBorder },
  tileEmoji: { fontSize: 26, lineHeight: 32, marginBottom: spacing.xs },
  tileTitle: { ...typography.subheading, color: colors.text },
  tileTitlePrimary: { color: colors.bg, fontWeight: '800' },
  tileSubtitle: { ...typography.small },
  tileSubtitlePrimary: { color: legacyColors.onAccentMuted },
  pressed: { opacity: 0.85 },
  nav: { gap: spacing.sm },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 64, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.cardBorder },
  navEmoji: { fontSize: 24, width: 30, textAlign: 'center' },
  navText: { flex: 1, gap: 2 },
  chevron: { color: colors.textMuted, fontSize: 26, lineHeight: 28 },
  premiumCard: { borderColor: colors.primary, borderWidth: 1, gap: 4 },
  center: { textAlign: 'center' },
});

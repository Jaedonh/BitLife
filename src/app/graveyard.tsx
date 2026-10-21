import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { LegacyAvatar } from '@/components/game/LegacyAvatar';
import { LegacySheet } from '@/components/game/LegacySheet';
import { causeLine, childrenLeft, familyLine, heirLabel, lifespanLine, obituaryShareText, ribbonTally } from '@/components/game/legacy';
import { shareNotice, shareText } from '@/components/game/legacyShare';
import { ScreenHeader } from '@/components/game/ScreenHeader';
import { Button, Card, Screen, T } from '@/components/ui';
import { getCountry } from '@/data/countries';
import { RIBBON_BY_ID, RIBBONS } from '@/engine';
import type { RibbonDef } from '@/engine/systems/ribbons';
import type { GameState } from '@/engine/types';
import { formatMoney, formatMoneyFull } from '@/engine/util';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore, type GraveyardEntry } from '@/store/settingsStore';
import { colors, legacyColors, radius, spacing, typography } from '@/theme';

type Tab = 'lives' | 'ribbons';

const MAX_CONTENT = 520;
const GRID_PADDING = spacing.md;

export default function GraveyardScreen() {
  const graveyard = useSettingsStore((s) => s.graveyard);
  const clearGraveyard = useSettingsStore((s) => s.clearGraveyard);
  const game = useGameStore((s) => s.game);
  const [tab, setTab] = useState<Tab>('lives');
  const [openGrave, setOpenGrave] = useState<GraveyardEntry | null>(null);
  const [openRibbon, setOpenRibbon] = useState<RibbonDef | null>(null);
  const tally = ribbonTally(graveyard);
  const earnedCount = RIBBONS.filter((r) => tally[r.id]).length;
  const lives = `${graveyard.length} ${graveyard.length === 1 ? 'life' : 'lives'}`;
  const progress = `${earnedCount}/${RIBBONS.length}`;

  // The privacy policy promises this deletion path (docs/PRIVACY_POLICY.md §1, "What stays on your device"; §9, "Deleting your data").
  const clear = () => {
    const title = 'Clear the graveyard?';
    const message = 'Every remembered life, obituary and earned ribbon on this device will be deleted. This cannot be undone.';
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(`${title}\n\n${message}`)) clearGraveyard();
      return;
    }
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: clearGraveyard },
    ]);
  };

  return (
    <Screen>
      <ScreenHeader title="Graveyard" subtitle={`${lives} · ${progress} ribbons`} />
      <View style={styles.tabsWrap}>
        <View style={styles.tabs} accessibilityRole="tablist">
          <TabButton label={`Lives (${graveyard.length})`} active={tab === 'lives'} onPress={() => setTab('lives')} testID="graveyard-tab-lives" />
          <TabButton label={`Ribbons ${progress}`} active={tab === 'ribbons'} onPress={() => setTab('ribbons')} testID="graveyard-tab-ribbons" />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {tab === 'lives' ? (
          <>
            {graveyard.length === 0 ? (
              <Card style={styles.empty}>
                <Text style={styles.emptyEmoji} accessible={false}>
                  🪦
                </Text>
                <T kind="subheading" style={styles.center}>
                  No lives finished yet
                </T>
                <T kind="small" style={styles.center}>
                  Every life you complete is remembered here with its obituary, epitaph and ribbon.
                </T>
              </Card>
            ) : (
              <T kind="small" style={styles.hint}>
                Tap a grave to read its obituary.
              </T>
            )}
            {graveyard.map((g) => (
              <GraveCard key={g.id + g.diedAt} entry={g} onPress={() => setOpenGrave(g)} />
            ))}
            {graveyard.length > 0 ? (
              <View style={styles.danger}>
                <T kind="small">Past lives are stored only on this device. Clearing the graveyard also resets your ribbon collection.</T>
                <Button title="Clear graveyard" variant="danger" onPress={clear} testID="clear-graveyard" />
              </View>
            ) : null}
          </>
        ) : (
          <RibbonCollection tally={tally} earnedCount={earnedCount} onOpen={setOpenRibbon} />
        )}
      </ScrollView>

      <LegacySheet visible={!!openGrave} onClose={() => setOpenGrave(null)} title="In memory" testID="grave-sheet">
        {openGrave ? <GraveDetails entry={openGrave} graveyard={graveyard} game={game} /> : null}
      </LegacySheet>
      <LegacySheet visible={!!openRibbon} onClose={() => setOpenRibbon(null)} title="Ribbon" testID="ribbon-sheet">
        {openRibbon ? <RibbonDetails ribbon={openRibbon} graveyard={graveyard} /> : null}
      </LegacySheet>
    </Screen>
  );
}

function TabButton({ label, active, onPress, testID }: { label: string; active: boolean; onPress: () => void; testID: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: active }} style={[styles.tab, active && styles.tabActive]} testID={testID}>
      <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function GraveCard({ entry, onPress }: { entry: GraveyardEntry; onPress: () => void }) {
  const ribbon = RIBBON_BY_ID[entry.ribbonId];
  const country = getCountry(entry.countryCode);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${entry.name}, ${entry.birthYear} to ${entry.deathYear}. ${ribbon?.name ?? ''}. Open obituary`}
      style={({ pressed }) => [styles.grave, pressed && styles.pressed]}
      testID="grave"
    >
      <LegacyAvatar emoji={ribbon?.emoji ?? '🪦'} size={44} style={styles.graveAvatar} />
      <View style={styles.graveBody}>
        <Text style={typography.subheading} numberOfLines={2}>
          {entry.name}
        </Text>
        <Text style={typography.small} numberOfLines={1}>
          {country.flag} {entry.birthYear}–{entry.deathYear} · {entry.age === 0 ? 'under a year old' : `aged ${entry.age}`} · gen {entry.generation}
        </Text>
        <Text style={typography.small} numberOfLines={1}>
          <Text style={styles.ribbonInline}>{ribbon?.name ?? entry.ribbonId}</Text> · {formatMoney(entry.netWorth, entry.countryCode, entry.deathYear)}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function GraveDetails({ entry, graveyard, game }: { entry: GraveyardEntry; graveyard: readonly GraveyardEntry[]; game: GameState | null }) {
  const ribbon = RIBBON_BY_ID[entry.ribbonId];
  const country = getCountry(entry.countryCode);
  const line = familyLine(entry, game);
  const children = childrenLeft(entry, game);
  const timesEarned = graveyard.filter((g) => g.ribbonId === entry.ribbonId).length;
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const share = async () => {
    setShareMsg(null);
    setShareMsg(shareNotice(await shareText(`${entry.name}'s obituary`, obituaryShareText(entry))));
  };
  return (
    <>
      <View style={styles.memorial}>
        <Text style={styles.memorialEmoji} accessible={false}>
          {ribbon?.emoji ?? '🪦'}
        </Text>
        <Text style={styles.memorialName} accessibilityRole="header">
          {entry.name}
        </Text>
        <Text style={[typography.small, styles.center]}>{lifespanLine(entry.countryCode, entry.birthYear, entry.deathYear, entry.age)}</Text>
        <Text style={styles.cause}>{causeLine(entry.cause)}</Text>
        <Text style={styles.epitaph} testID="grave-epitaph">
          “{entry.epitaph}”
        </Text>
      </View>

      {ribbon ? (
        <View style={styles.ribbonRow}>
          <Text style={styles.ribbonRowEmoji} accessible={false}>
            {ribbon.emoji}
          </Text>
          <View style={styles.flex}>
            <Text style={[typography.subheading, { color: colors.accent }]}>{ribbon.name}</Text>
            <Text style={typography.small}>
              {ribbon.description} Earned {timesEarned === 1 ? 'once' : `${timesEarned} times`}.
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.block}>
        <T kind="label">OBITUARY</T>
        <Text style={typography.body} testID="grave-obituary">
          {entry.obituary}
        </Text>
      </View>

      <View style={styles.block}>
        <T kind="label">FAMILY</T>
        <KV label="Generation" value={String(entry.generation)} />
        <KV label="Country" value={`${country.flag} ${country.name}`} />
        <KV label="Net worth" value={formatMoneyFull(entry.netWorth, entry.countryCode, entry.deathYear)} />
        {children.length ? <KV label="Left behind" value={children.map((p) => `${p.firstName} (${heirLabel(p).toLowerCase()}, ${p.age})`).join(', ')} /> : null}
      </View>

      {line ? (
        <View style={styles.block} testID="family-line">
          <T kind="label">FAMILY LINE</T>
          {line.map((m) => (
            <View key={m.key} style={[styles.lineRow, m.isEntry && styles.lineRowActive]}>
              <Text style={styles.lineGen}>{m.generation}</Text>
              <View style={styles.flex}>
                <Text style={typography.subheading} numberOfLines={2}>
                  {m.name}
                </Text>
                <Text style={typography.small} numberOfLines={1}>
                  {m.playing ? `Playing now · age ${m.age}` : `${m.birthYear}–${m.deathYear} · aged ${m.age}`}
                  {m.ribbonId && RIBBON_BY_ID[m.ribbonId] ? ` · ${RIBBON_BY_ID[m.ribbonId]!.emoji} ${RIBBON_BY_ID[m.ribbonId]!.name}` : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <Button title="Share obituary" variant="secondary" onPress={() => void share()} testID="grave-share" />
      {shareMsg ? <T kind="small" style={styles.center}>{shareMsg}</T> : null}
    </>
  );
}

function RibbonCollection({ tally, earnedCount, onOpen }: { tally: Record<string, number>; earnedCount: number; onOpen: (r: RibbonDef) => void }) {
  const { width } = useWindowDimensions();
  // The grid's measured width once laid out; before that, an estimate from the window (screen gutter and borders).
  const [gridWidth, setGridWidth] = useState<number | null>(null);
  const inner = (gridWidth ?? Math.min(width, MAX_CONTENT) - spacing.lg * 2 - 2) - GRID_PADDING * 2;
  // Tiles at least ~96 px wide so the longest names ("Heartbreaker", "Globetrotter") never break mid-word.
  const cols = Math.max(3, Math.floor((inner + spacing.sm) / (96 + spacing.sm)));
  // A pixel of slack so rounding never pushes the last tile of a row onto the next one.
  const tileWidth = Math.floor((inner - 1 - (cols - 1) * spacing.sm) / cols);
  const pct = RIBBONS.length ? Math.round((earnedCount / RIBBONS.length) * 100) : 0;
  return (
    <>
      <Card style={styles.progressCard}>
        <View style={styles.progressTop}>
          <Text style={typography.subheading}>Ribbons collected</Text>
          <Text style={styles.progressCount} testID="ribbon-progress">
            {earnedCount}/{RIBBONS.length}
          </Text>
        </View>
        <View style={styles.track} accessibilityLabel={`${earnedCount} of ${RIBBONS.length} ribbons collected`}>
          <View style={[styles.fill, { width: `${pct}%` }]} />
        </View>
        <T kind="small">Each life earns one ribbon. Tap any ribbon to see how to earn it.</T>
      </Card>
      <View style={styles.grid} onLayout={(e) => setGridWidth(Math.floor(e.nativeEvent.layout.width) - 2)}>
        {RIBBONS.map((r) => {
          const count = tally[r.id] ?? 0;
          const earned = count > 0;
          return (
            <Pressable
              key={r.id}
              onPress={() => onOpen(r)}
              accessibilityRole="button"
              accessibilityLabel={`${r.name}, ${earned ? `earned ${count === 1 ? 'once' : `${count} times`}` : 'locked'}. ${r.description}`}
              style={({ pressed }) => [styles.tile, { width: tileWidth }, earned ? styles.tileEarned : styles.tileLocked, pressed && styles.pressed]}
              testID={`ribbon-${r.id}`}
            >
              <View>
                <Text style={[styles.tileEmoji, !earned && styles.silhouette]} accessible={false}>
                  {r.emoji}
                </Text>
                {!earned ? <Text style={styles.lock}>🔒</Text> : null}
              </View>
              <Text style={[styles.tileName, earned && styles.tileNameEarned]} numberOfLines={2}>
                {r.name}
              </Text>
              {count > 1 ? <Text style={styles.tileCount}>×{count}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

function RibbonDetails({ ribbon, graveyard }: { ribbon: RibbonDef; graveyard: readonly GraveyardEntry[] }) {
  const lives = graveyard.filter((g) => g.ribbonId === ribbon.id);
  const earned = lives.length > 0;
  return (
    <View style={styles.memorial} testID={`ribbon-details-${ribbon.id}`}>
      <Text style={[styles.memorialEmoji, !earned && styles.silhouette]} accessible={false}>
        {ribbon.emoji}
      </Text>
      <Text style={styles.memorialName} accessibilityRole="header">
        {ribbon.name}
      </Text>
      <View style={[styles.status, earned ? styles.statusEarned : styles.statusLocked]}>
        <Text style={[styles.statusText, earned && styles.statusTextEarned]}>{earned ? `Earned ${lives.length === 1 ? 'once' : `${lives.length} times`}` : '🔒 Not earned yet'}</Text>
      </View>
      <View style={styles.howTo}>
        <T kind="label">HOW TO EARN IT</T>
        <Text style={typography.body}>{ribbon.description}</Text>
        <T kind="small">A life gets the highest-ranked ribbon it qualifies for, so rarer ribbons win over common ones.</T>
      </View>
      {earned ? (
        <View style={styles.howTo}>
          <T kind="label">EARNED BY</T>
          {lives.slice(0, 5).map((g) => (
            <Text key={g.id + g.diedAt} style={typography.body} numberOfLines={1}>
              {g.name} · {g.deathYear}
            </Text>
          ))}
          {lives.length > 5 ? <T kind="small">and {lives.length - 5} more</T> : null}
        </View>
      ) : null}
    </View>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kv}>
      <Text style={styles.k}>{label}</Text>
      <Text style={styles.v}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsWrap: { paddingHorizontal: spacing.lg, maxWidth: MAX_CONTENT, width: '100%', alignSelf: 'center' },
  tabs: { flexDirection: 'row', gap: spacing.xs, padding: spacing.xs, borderRadius: radius.md, backgroundColor: colors.bgElevated, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.cardBorder },
  tab: { flex: 1, minHeight: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.subheading, fontSize: 15, color: colors.textMuted },
  tabTextActive: { color: colors.text },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl, maxWidth: MAX_CONTENT, width: '100%', alignSelf: 'center' },
  center: { textAlign: 'center' },
  flex: { flex: 1 },
  hint: { paddingHorizontal: spacing.xs },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  emptyEmoji: { fontSize: 44, lineHeight: 52 },
  grave: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, padding: spacing.md, minHeight: 72 },
  graveAvatar: { backgroundColor: legacyColors.stone },
  graveBody: { flex: 1, gap: 1 },
  ribbonInline: { color: colors.accent, fontWeight: '600' },
  chevron: { color: colors.textMuted, fontSize: 26, lineHeight: 28 },
  pressed: { opacity: 0.85 },
  danger: { gap: spacing.sm, marginTop: spacing.lg },
  memorial: { alignItems: 'center', gap: spacing.xs },
  memorialEmoji: { fontSize: 48, lineHeight: 58 },
  memorialName: { ...typography.title, fontSize: 22, textAlign: 'center' },
  cause: { ...typography.body, color: colors.danger, textAlign: 'center' },
  epitaph: { ...typography.body, fontStyle: 'italic', color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
  ribbonRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.bgElevated, borderRadius: radius.md, padding: spacing.md },
  ribbonRowEmoji: { fontSize: 30 },
  block: { gap: spacing.sm, backgroundColor: colors.bgElevated, borderRadius: radius.md, padding: spacing.md },
  kv: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  k: { color: colors.textMuted, fontSize: 14 },
  v: { color: colors.text, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  lineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radius.sm },
  lineRowActive: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.primary },
  lineGen: { ...typography.label, width: 20, textAlign: 'center', color: colors.accent },
  progressCard: { gap: spacing.sm },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressCount: { ...typography.heading, color: colors.accent, fontVariant: ['tabular-nums'] },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.bgElevated, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.accent },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, padding: GRID_PADDING, backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: radius.lg },
  tile: { alignItems: 'center', gap: 2, paddingVertical: spacing.sm, paddingHorizontal: 2, borderRadius: radius.md, borderWidth: 1, minHeight: 84 },
  tileEarned: { borderColor: colors.accent, backgroundColor: colors.bgElevated },
  tileLocked: { borderColor: colors.cardBorder, backgroundColor: legacyColors.lockedTile },
  tileEmoji: { fontSize: 28, lineHeight: 36, textAlign: 'center' },
  silhouette: { opacity: 0.25 },
  lock: { position: 'absolute', right: -8, bottom: -2, fontSize: 13 },
  tileName: { fontSize: 12, lineHeight: 15, fontWeight: '600', color: colors.textMuted, textAlign: 'center' },
  tileNameEarned: { color: colors.text },
  tileCount: { fontSize: 11, fontWeight: '700', color: colors.accent },
  status: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4, marginTop: spacing.xs },
  statusEarned: { backgroundColor: colors.accent },
  statusLocked: { backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.cardBorder },
  statusText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  statusTextEarned: { color: colors.bg },
  howTo: { alignSelf: 'stretch', gap: spacing.xs, backgroundColor: colors.bgElevated, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
});

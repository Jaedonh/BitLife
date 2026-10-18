import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatMoney } from '@/engine/util';
import { colors, peopleColors, radius, spacing } from '@/theme';

import type { InteractionTile } from './people';

type Badge = { key: string; text: string; bg: string; color: string };

function badges(tile: InteractionTile, countryCode: string): Badge[] {
  const out: Badge[] = [];
  if (tile.cost) out.push({ key: 'cost', text: formatMoney(tile.cost, countryCode), bg: peopleColors.moneyBg, color: colors.money });
  if (tile.def.energy) out.push({ key: 'energy', text: `⚡${tile.def.energy}`, bg: peopleColors.energyBg, color: colors.warning });
  if (tile.usesLeft !== undefined) out.push({ key: 'uses', text: `${tile.usesLeft} left`, bg: peopleColors.usesBg, color: colors.textMuted });
  return out;
}

/** What a screen reader says for a tile: the action, then its price, energy and uses, or why it is unavailable. */
export function tileAccessibilityLabel(tile: InteractionTile, countryCode: string): string {
  const { def } = tile;
  if (!tile.available) return `${def.label}. Unavailable: ${tile.reason}.`;
  const parts = [
    tile.cost ? `costs ${formatMoney(tile.cost, countryCode)}` : null,
    def.energy ? `uses ${def.energy} energy` : null,
    tile.usesLeft !== undefined ? `${tile.usesLeft} left this year` : null,
  ].filter(Boolean);
  return parts.length ? `${def.label}, ${parts.join(', ')}.` : `${def.label}.`;
}

function Tile({ tile, countryCode, onPress }: { tile: InteractionTile; countryCode: string; onPress: (tile: InteractionTile) => void }) {
  const { def, available, risky } = tile;
  const list = badges(tile, countryCode);
  return (
    <Pressable
      testID={`interact-${def.id}`}
      accessibilityRole="button"
      accessibilityLabel={tileAccessibilityLabel(tile, countryCode)}
      accessibilityState={{ disabled: !available }}
      disabled={!available}
      onPress={() => onPress(tile)}
      style={({ pressed }) => [styles.tile, risky && styles.risky, !available && styles.unavailable, pressed && styles.pressed]}
    >
      <View style={styles.head}>
        <Text style={[styles.emoji, !available && styles.dimmed]}>{def.emoji}</Text>
        <Text style={[styles.label, risky && styles.riskyLabel, !available && styles.unavailableLabel]} numberOfLines={2}>
          {def.label}
        </Text>
      </View>
      {available ? (
        list.length ? (
          <View style={styles.badges}>
            {list.map((b) => (
              <View key={b.key} style={[styles.badge, { backgroundColor: b.bg }]}>
                <Text style={[styles.badgeText, { color: b.color }]}>{b.text}</Text>
              </View>
            ))}
          </View>
        ) : null
      ) : (
        <Text style={styles.reason} numberOfLines={2}>
          {tile.reason}
        </Text>
      )}
    </Pressable>
  );
}

/** Interaction tiles in two columns that wrap; the last row keeps tile widths even. */
export function PeopleInteractionGrid({ tiles, countryCode, onPress }: { tiles: InteractionTile[]; countryCode: string; onPress: (tile: InteractionTile) => void }) {
  const rows: InteractionTile[][] = [];
  for (let i = 0; i < tiles.length; i += 2) rows.push(tiles.slice(i, i + 2));
  return (
    <View style={styles.grid}>
      {rows.map((row) => (
        <View key={row.map((t) => t.def.id).join('-')} style={styles.row}>
          {row.map((t) => (
            <Tile key={t.def.id} tile={t} countryCode={countryCode} onPress={onPress} />
          ))}
          {row.length === 1 ? <View style={styles.spacer} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  // Explicit basis 0 so a lone tile in the last row stays exactly half width next to its spacer.
  spacer: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 },
  tile: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    minHeight: 72,
    gap: spacing.sm,
    justifyContent: 'space-between',
    backgroundColor: colors.bgElevated,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  risky: { backgroundColor: peopleColors.riskyBg, borderColor: peopleColors.riskyBorder },
  unavailable: { backgroundColor: colors.bg, borderStyle: 'dashed' },
  pressed: { opacity: 0.8 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  emoji: { fontSize: 18, lineHeight: 22 },
  dimmed: { opacity: 0.5 },
  label: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  riskyLabel: { color: colors.danger },
  unavailableLabel: { color: colors.textMuted },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  reason: { fontSize: 12, fontWeight: '600', color: colors.warning },
});

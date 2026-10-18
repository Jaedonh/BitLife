import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { colors, radius, spacing, typography, workUi } from '@/theme';

export type SheetRow = { label: string; value: string; color?: string; strong?: boolean };

export type SheetAction = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  disabled?: boolean;
  testID?: string;
  /** One line under the button, e.g. why it is disabled. */
  note?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  emoji?: string;
  subtitle?: string;
  /** Label/value lines, e.g. "Down payment · ₹1.9M". */
  rows?: readonly SheetRow[];
  /** A short paragraph under the figures. */
  note?: string;
  actions: readonly SheetAction[];
  cancelLabel?: string;
  testID?: string;
};

/**
 * A bottom sheet that spells out what a big decision costs before the player commits
 * (a mortgage, a degree). The backdrop and "Cancel" both close it without acting.
 */
export function Sheet({ visible, onClose, title, emoji, subtitle, rows = [], note, actions, cancelLabel = 'Cancel', testID }: Props) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" testID="sheet-backdrop">
          <View style={styles.backdrop} />
        </Pressable>
        <View style={[styles.sheet, { paddingBottom: spacing.xl + insets.bottom }]} testID={testID} accessibilityViewIsModal>
          <View style={styles.handle} />
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <View style={styles.head}>
              {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
              <View style={styles.titles}>
                <Text style={typography.heading} accessibilityRole="header">
                  {title}
                </Text>
                {subtitle ? <Text style={typography.small}>{subtitle}</Text> : null}
              </View>
            </View>
            {rows.length ? (
              <View style={styles.rows}>
                {rows.map((r) => (
                  <View key={r.label} style={styles.kv}>
                    <Text style={[styles.k, r.strong && styles.strong]}>{r.label}</Text>
                    <Text style={[styles.v, r.strong && styles.strong, r.color ? { color: r.color } : null]}>{r.value}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {note ? <Text style={styles.note}>{note}</Text> : null}
          </ScrollView>
          <View style={styles.actions}>
            {actions.map((a) => (
              <View key={a.title} style={styles.action}>
                <Button title={a.title} variant={a.variant ?? 'primary'} onPress={a.onPress} disabled={a.disabled} testID={a.testID} numberOfLines={2} />
                {a.note ? <Text style={styles.actionNote}>{a.note}</Text> : null}
              </View>
            ))}
            <Button title={cancelLabel} variant="ghost" onPress={onClose} testID="sheet-cancel" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '88%',
    backgroundColor: workUi.sheetBg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: radius.pill, backgroundColor: workUi.sheetHandle, marginBottom: spacing.xs },
  scroll: { flexGrow: 0 },
  scrollContent: { gap: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  emoji: { fontSize: 32 },
  titles: { flex: 1, gap: 2 },
  rows: { gap: spacing.sm, backgroundColor: colors.bgElevated, borderRadius: radius.md, padding: spacing.md },
  kv: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  k: { color: colors.textMuted, fontSize: 14, flexShrink: 1 },
  v: { color: colors.text, fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'], textAlign: 'right' },
  strong: { color: colors.text, fontWeight: '800', fontSize: 15 },
  note: { ...typography.small, lineHeight: 18 },
  actions: { gap: spacing.sm },
  action: { gap: 2 },
  actionNote: { ...typography.small, textAlign: 'center' },
});

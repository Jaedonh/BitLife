import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography, workUi } from '@/theme';

type Props = PropsWithChildren<{
  title: string;
  /** One line under the title, e.g. "25 majors · from ₹9,000/yr". */
  summary?: string;
  emoji?: string;
  open: boolean;
  onToggle: () => void;
  testID?: string;
}>;

/** A collapsible group: a full-width header that expands its rows in place (an accordion). */
export function Disclosure({ title, summary, emoji, open, onToggle, testID, children }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable
        testID={testID}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={summary ? `${title}. ${summary}` : title}
        accessibilityHint={open ? 'Collapses the list' : 'Expands the list'}
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [styles.header, open && styles.headerOpen, pressed && styles.pressed]}
      >
        {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
        <View style={styles.titles}>
          <Text style={typography.subheading} numberOfLines={2}>
            {title}
          </Text>
          {summary ? (
            <Text style={typography.small} numberOfLines={2}>
              {summary}
            </Text>
          ) : null}
        </View>
        <Text style={styles.toggle}>{open ? 'Hide' : 'Show'}</Text>
        <Text style={[styles.chevron, open && styles.chevronOpen]}>›</Text>
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: workUi.touch + 12,
    backgroundColor: colors.bgElevated,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  headerOpen: { borderColor: workUi.chipSelectedBorder },
  pressed: { opacity: 0.85 },
  emoji: { fontSize: 22 },
  titles: { flex: 1, gap: 2 },
  toggle: { ...typography.label, color: colors.textMuted },
  chevron: { color: colors.textMuted, fontSize: 22, transform: [{ rotate: '90deg' }] },
  chevronOpen: { transform: [{ rotate: '-90deg' }] },
  body: { gap: spacing.sm },
});

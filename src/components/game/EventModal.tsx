import * as Haptics from 'expo-haptics';
import { Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, radius, spacing, typography } from '@/theme';

export function EventModal() {
  const pending = useGameStore((s) => s.game?.pendingEvent ?? null);
  const choose = useGameStore((s) => s.choose);
  const haptics = useSettingsStore((s) => s.settings.haptics);
  if (!pending) return null;
  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <View style={styles.backdrop}>
        <View style={styles.card} testID="event-modal">
          <Text style={styles.title}>{pending.title}</Text>
          <ScrollView style={styles.textScroll} contentContainerStyle={{ paddingBottom: spacing.sm }}>
            <Text style={styles.text} testID="event-text">
              {pending.text}
            </Text>
          </ScrollView>
          <View style={styles.choices}>
            {pending.choices.map((c, i) => (
              <View key={c.id}>
                <Button
                  testID={`choice-${i}`}
                  title={c.label}
                  variant={i === 0 ? 'primary' : 'secondary'}
                  size="lg"
                  onPress={() => {
                    if (haptics && Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
                    choose(c.id);
                  }}
                />
                {c.hint ? <Text style={styles.hint}>{c.hint}</Text> : null}
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: { width: '100%', maxWidth: 440, maxHeight: '85%', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.md, borderWidth: 1, borderColor: colors.cardBorder },
  title: { ...typography.heading, color: colors.accent },
  textScroll: { flexGrow: 0 },
  text: { ...typography.body, fontSize: 16, lineHeight: 23 },
  choices: { gap: spacing.sm },
  hint: { ...typography.small, textAlign: 'center', marginTop: 2 },
});

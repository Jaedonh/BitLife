import * as Haptics from 'expo-haptics';
import { useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { Animated, Easing, Modal, Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { useGameStore } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';
import { colors, radius, spacing, typography } from '@/theme';

import { EventChoice } from './EventChoice';
import { eventCardModel, type EventCardModel } from './eventCard';
import { USE_NATIVE_DRIVER, useReducedMotion } from './eventMotion';

/** A new card ignores taps this long, so a quick double tap cannot also answer the card that replaces it. */
const TAP_GUARD_MS = 200;
const ENTER_MS = 280;
const CARD_PAD = 20;
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const NO_INSETS = { top: 0, bottom: 0, left: 0, right: 0 };

/** Safe-area insets, or zeros when rendered outside a SafeAreaProvider (unit tests, isolated previews). */
function useInsets() {
  return useContext(SafeAreaInsetsContext) ?? NO_INSETS;
}

export function EventModal() {
  // The whole state only while a card is open (the card reads age, year, cash and people); null otherwise,
  // so ordinary state changes between cards do not re-render this component.
  const game = useGameStore((s) => (s.game?.pendingEvent ? s.game : null));
  const choose = useGameStore((s) => s.choose);
  const haptics = useSettingsStore((s) => s.settings.haptics);
  const pending = game?.pendingEvent ?? null;
  if (!game || !pending) return null;
  const model = eventCardModel(game, pending);
  const onChoose = (choiceId: string) => {
    if (haptics && Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
    choose(choiceId);
  };
  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={() => {}}>
      <EventStage>
        {/* Keyed per card: each event mounts fresh, so it slides in and its tap guard restarts. */}
        <EventCard key={model.key} model={model} onChoose={onChoose} />
      </EventStage>
    </Modal>
  );
}

/** Full-screen dimmed backdrop that fades in once when the first card of a batch opens. */
function EventStage({ children }: PropsWithChildren) {
  const insets = useInsets();
  const reduceMotion = useReducedMotion();
  const [fade] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const anim = Animated.timing(fade, { toValue: 1, duration: reduceMotion ? 120 : 200, easing: Easing.out(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER });
    anim.start();
    return () => anim.stop();
  }, [fade, reduceMotion]);
  return (
    <View style={[styles.stage, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg, paddingLeft: insets.left + spacing.lg, paddingRight: insets.right + spacing.lg }]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: fade }]} />
      {children}
    </View>
  );
}

function EventCard({ model, onChoose }: { model: EventCardModel; onChoose: (choiceId: string) => void }) {
  const reduceMotion = useReducedMotion();
  const insets = useInsets();
  const { height } = useWindowDimensions();
  const [enter] = useState(() => new Animated.Value(0));
  const [interactive, setInteractive] = useState(false);
  const cardRef = useRef<View>(null);
  const [scroll, setScroll] = useState({ view: 0, content: 0, y: 0 });

  useEffect(() => {
    // Reduced motion: a short dissolve instead of the slide.
    const anim = Animated.timing(enter, { toValue: 1, duration: reduceMotion ? 140 : ENTER_MS, easing: EASE_OUT, useNativeDriver: USE_NATIVE_DRIVER });
    anim.start();
    const t = setTimeout(() => setInteractive(true), TAP_GUARD_MS);
    return () => {
      anim.stop();
      clearTimeout(t);
    };
  }, [enter, reduceMotion]);

  useEffect(() => {
    // Web: move focus to the new card itself, so keyboard and screen-reader users start at the dialog
    // (announced by its title) rather than on the first choice, which would then look pre-selected.
    if (Platform.OS !== 'web') return;
    const el = cardRef.current as unknown as { focus?: (options?: { preventScroll?: boolean }) => void } | null;
    el?.focus?.({ preventScroll: true });
  }, []);

  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [reduceMotion ? 0 : 36, 0] });
  const scale = enter.interpolate({ inputRange: [0, 1], outputRange: [reduceMotion ? 1 : 0.97, 1] });
  const maxHeight = Math.max(240, height - insets.top - insets.bottom - spacing.lg * 2);
  // Text and choices scroll together inside the card when they do not fit (long text, large font sizes),
  // so every choice stays reachable; a fade at the bottom edge says there is more below.
  const moreBelow = scroll.content - scroll.view - scroll.y > 6;

  return (
    <Animated.View ref={cardRef} testID="event-modal" role="dialog" aria-modal aria-label={model.title} tabIndex={-1} style={[styles.card, { maxHeight, opacity: enter, transform: [{ translateY }, { scale }] }]}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: `${model.tint}24`, borderColor: `${model.tint}5C` }]}>
          <Text style={styles.badgeEmoji} accessibilityRole="image" accessibilityLabel={`${model.categoryLabel} event`} testID="event-category">
            {model.emoji}
          </Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title} accessibilityRole="header">
            {model.title}
          </Text>
          {model.caption ? (
            <Text style={styles.caption} testID="event-caption">
              {model.caption}
            </Text>
          ) : null}
        </View>
      </View>
      {model.person ? (
        <View style={styles.person} testID="event-person" accessible accessibilityLabel={`About ${model.person.name}, ${model.person.relation}`}>
          <Text style={styles.personEmoji} aria-hidden>
            {model.person.emoji}
          </Text>
          <Text style={styles.personText} numberOfLines={2}>
            <Text style={styles.personName}>{model.person.name}</Text>
            {/* No-break space: "· Husband" wraps as one piece when a long name fills the line. */}
            <Text style={styles.personRelation}>{` ·\u00A0${model.person.relation}`}</Text>
          </Text>
        </View>
      ) : null}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator
        scrollEventThrottle={32}
        onLayout={(e) => {
          const view = e.nativeEvent.layout.height;
          setScroll((s) => (s.view === view ? s : { ...s, view }));
        }}
        onContentSizeChange={(_w, content) => setScroll((s) => (s.content === content ? s : { ...s, content }))}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          setScroll((s) => (Math.abs(s.y - y) < 1 ? s : { ...s, y }));
        }}
      >
        <Text style={styles.text} testID="event-text">
          {model.text}
        </Text>
        <View style={[styles.choices, { pointerEvents: interactive ? 'auto' : 'none' }]}>
          {model.choices.map((c, i) => (
            <EventChoice key={c.id} testID={`choice-${i}`} label={c.label} chip={c.chip} tone={c.tone} accessibilityLabel={c.accessibilityLabel} onPress={() => onChoose(c.id)} />
          ))}
        </View>
      </ScrollView>
      {moreBelow ? (
        <View style={styles.fade}>
          {FADE_STEPS.map((a) => (
            <View key={a} style={[styles.fadeStep, { backgroundColor: `${colors.card}${a}` }]} />
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
}

/** Alpha steps (hex) of a hand-rolled gradient from transparent to the card colour. */
const FADE_STEPS = ['1A', '40', '66', '8C', 'B3', 'E6'];

const styles = StyleSheet.create({
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backdrop: { backgroundColor: colors.overlay },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: CARD_PAD,
    gap: spacing.md,
    // The card takes focus as a dialog (web); a ring around the whole card would only add noise.
    outlineWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  badge: { width: 48, height: 48, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  badgeEmoji: { fontSize: 26, lineHeight: 32 },
  headerText: { flex: 1, gap: 2 },
  title: { ...typography.heading, lineHeight: 25 },
  caption: { ...typography.small, fontWeight: '600', letterSpacing: 0.2 },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    gap: 6,
    paddingVertical: 5,
    paddingLeft: spacing.sm,
    paddingRight: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.bgElevated,
  },
  personEmoji: { fontSize: 15 },
  personText: { flexShrink: 1, fontSize: 13, lineHeight: 17 },
  personName: { color: colors.text, fontWeight: '700' },
  personRelation: { color: colors.textMuted, fontWeight: '600' },
  body: { flexGrow: 0, flexShrink: 1 },
  bodyContent: { gap: spacing.lg },
  text: { ...typography.body, fontSize: 16, lineHeight: 23 },
  choices: { gap: 10 },
  fade: { position: 'absolute', left: CARD_PAD, right: CARD_PAD, bottom: CARD_PAD, height: 40, pointerEvents: 'none' },
  fadeStep: { flex: 1 },
});

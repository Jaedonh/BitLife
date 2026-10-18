/**
 * Design tokens. Single source of truth for colours, spacing and type.
 * Dark, card-based UI; the accent palette mirrors the app icon.
 */
export const colors = {
  bg: '#0F0E1A',
  bgElevated: '#1A1830',
  card: '#221F3D',
  cardBorder: '#2F2B55',
  primary: '#7C3AED',
  primaryDark: '#4338CA',
  accent: '#A3E635',
  text: '#F5F3FF',
  textMuted: '#A5A1C2',
  textFaint: '#6E6A8F',
  danger: '#F87171',
  warning: '#FBBF24',
  success: '#4ADE80',
  info: '#60A5FA',
  happiness: '#FBBF24',
  health: '#4ADE80',
  smarts: '#60A5FA',
  looks: '#F472B6',
  money: '#A3E635',
  overlay: 'rgba(5, 4, 15, 0.72)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 26, fontWeight: '800' as const, color: colors.text },
  heading: { fontSize: 20, fontWeight: '700' as const, color: colors.text },
  subheading: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text, lineHeight: 21 },
  small: { fontSize: 13, fontWeight: '400' as const, color: colors.textMuted },
  label: { fontSize: 12, fontWeight: '600' as const, color: colors.textMuted, letterSpacing: 0.4 },
} as const;

// --- u2-people: People list and person screen tokens ---
export const peopleColors = {
  /** Romantic bond (Love bar); distinct from Looks pink. */
  love: '#F43F5E',
  /** Love percentage text (lighter than the bar for AA contrast on cards). */
  loveText: '#FB7185',
  /** Relation chip on the person header. */
  chipBg: 'rgba(124, 58, 237, 0.22)',
  chipText: '#DDD6FE',
  /** Cost / energy / uses badges on interaction tiles. */
  moneyBg: 'rgba(163, 230, 53, 0.14)',
  energyBg: 'rgba(251, 191, 36, 0.16)',
  usesBg: 'rgba(165, 161, 194, 0.16)',
  /** Risky interactions (insult, break up, divorce). */
  riskyBg: 'rgba(127, 29, 29, 0.32)',
  riskyBorder: '#9F2D2D',
  /** Inline outcome banner after an interaction. */
  noticeBg: '#1E1B38',
} as const;

// ---- u1-life: life screen journal, feedback toasts and profile sheet ----
/** Translucent fills for change pills and status chips (text on them uses the matching solid colour). */
export const lifeTints = {
  up: 'rgba(74, 222, 128, 0.14)',
  down: 'rgba(248, 113, 113, 0.16)',
  money: 'rgba(163, 230, 53, 0.14)',
  warning: 'rgba(251, 191, 36, 0.16)',
  accent: 'rgba(163, 230, 53, 0.12)',
  primary: 'rgba(124, 58, 237, 0.22)',
  neutral: 'rgba(165, 161, 194, 0.12)',
} as const;

/** Dark text for use on the lime accent (the Age button and accent chips). */
export const onAccent = '#0F0E1A';

/** Light violet for text that names the brand purple (the primary itself is too dark for text on dark cards). */
export const violetSoft = '#C4B5FD';

// ---- u4-work: chips, badges, sheets and gain/loss colours for Work & School, Assets and Activities ----
export const workUi = {
  /** Minimum touch target (px) for controls on these screens. */
  touch: 44,
  gain: colors.success,
  loss: colors.danger,
  chipBg: colors.bgElevated,
  chipBorder: colors.cardBorder,
  chipSelectedBg: 'rgba(124, 58, 237, 0.32)',
  chipSelectedBorder: '#A78BFA',
  badgeNeutralBg: 'rgba(165, 161, 194, 0.14)',
  badgeGoodBg: 'rgba(74, 222, 128, 0.14)',
  badgeBadBg: 'rgba(248, 113, 113, 0.14)',
  badgeEnergyBg: 'rgba(251, 191, 36, 0.14)',
  badgeInfoBg: 'rgba(96, 165, 250, 0.14)',
  rowDisabledBg: '#1C1A33',
  sheetBg: colors.card,
  sheetHandle: '#4B4775',
  meterEmpty: colors.bgElevated,
} as const;

// ── u5-legacy: tombstone, graveyard and legacy screens ──────────────────────
export const legacyColors = {
  /** Tombstone face and its carved edge. */
  stone: '#2A2740',
  stoneEdge: '#3D3866',
  /** Gold for a ribbon earned for the first time. */
  newRibbon: '#FBBF24',
  /** Locked ribbon tile background. */
  lockedTile: '#1A1830',
  /** Secondary text on an accent (lime) surface. */
  onAccentMuted: '#2E3B10',
} as const;

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

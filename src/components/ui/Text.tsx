import { Text as RNText, type TextProps } from 'react-native';

import { typography } from '@/theme';

type Kind = keyof typeof typography;

export function T({ kind = 'body', style, ...rest }: TextProps & { kind?: Kind }) {
  return <RNText {...rest} style={[typography[kind], style]} />;
}

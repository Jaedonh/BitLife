import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors } from '@/theme';

type Props = PropsWithChildren<{ style?: ViewStyle; edges?: Edge[] }>;

/** Full-screen dark background with safe-area padding. */
export function Screen({ children, style, edges = ['top', 'left', 'right'] }: Props) {
  return (
    <SafeAreaView edges={edges} style={[styles.root, style]}>
      {children}
    </SafeAreaView>
  );
}

/** Non-safe-area wrapper for nested content. */
export function Fill({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.root, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});

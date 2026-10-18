import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Fragment, useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FullWindowOverlay } from 'react-native-screens';

import { ResultToast } from '@/components/game/ResultToast';
import { bootMonetization } from '@/services/monetization';
import { useGameStore } from '@/store/gameStore';
import { attachLifeLedger, hydrateLifeLedger } from '@/store/lifeLedger';
import { useSettingsStore } from '@/store/settingsStore';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Year boundaries are recorded from the first state the game store loads.
attachLifeLedger();

/**
 * Layer for the app-wide toasts. On iOS, modal routes are native modals that cover the whole
 * React tree, so the toasts need their own window on top; elsewhere a plain overlay is enough.
 */
const ToastLayer: ComponentType<{ children: ReactNode }> = Platform.OS === 'ios' ? FullWindowOverlay : Fragment;

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([useSettingsStore.getState().hydrate(), useGameStore.getState().hydrate().then(hydrateLifeLedger)]);
      } finally {
        if (!cancelled) {
          setReady(true);
          SplashScreen.hideAsync().catch(() => {});
          // Consent + SDK init happens after first paint so the splash never blocks on the network.
          void bootMonetization();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="life" options={{ gestureEnabled: false }} />
          <Stack.Screen name="occupation" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="assets" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="relationships" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="activities" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="person/[id]" options={{ presentation: 'modal', animation: 'slide_from_right' }} />
          <Stack.Screen name="death" options={{ gestureEnabled: false }} />
        </Stack>
        <ToastLayer>
          <ResultToast />
        </ToastLayer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

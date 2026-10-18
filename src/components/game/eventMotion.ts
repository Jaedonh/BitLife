import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/** Animated's native driver does not exist on web; asking for it there only logs a warning. */
export const USE_NATIVE_DRIVER = Platform.OS !== 'web';

/**
 * Last known "reduce motion" preference. The platform query is async, so it is primed when this module
 * loads: by the time the first event card opens, a card can read the answer synchronously and never
 * starts a slide it would have to cancel.
 */
let reduceMotionCache = false;

function prime(): void {
  try {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        reduceMotionCache = !!v;
      })
      .catch(() => {});
  } catch {
    // Not available on this platform: keep the default (motion on).
  }
}
prime();

/** True when the user asked the OS to reduce motion (iOS/Android setting, or prefers-reduced-motion on web). */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(reduceMotionCache);
  useEffect(() => {
    let alive = true;
    const update = (v: boolean) => {
      reduceMotionCache = !!v;
      if (alive) setReduced(!!v);
    };
    AccessibilityInfo.isReduceMotionEnabled()
      .then(update)
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', update);
    return () => {
      alive = false;
      sub?.remove();
    };
  }, []);
  return reduced;
}

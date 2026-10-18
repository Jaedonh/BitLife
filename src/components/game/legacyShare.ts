import { Platform, Share } from 'react-native';

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'unavailable';

/**
 * Opens the system share sheet with `message`. On the web, browsers without the Web Share API get the
 * text copied to the clipboard instead, so the button always does something visible.
 */
export async function shareText(title: string, message: string): Promise<ShareOutcome> {
  if (Platform.OS !== 'web') {
    try {
      const r = await Share.share({ title, message });
      return r.action === Share.dismissedAction ? 'cancelled' : 'shared';
    } catch {
      return 'unavailable';
    }
  }
  const nav = (globalThis as { navigator?: Navigator }).navigator;
  if (nav && typeof nav.share === 'function') {
    try {
      await nav.share({ title, text: message });
      return 'shared';
    } catch (e) {
      // The player closed the share sheet.
      if (e instanceof Error && e.name === 'AbortError') return 'cancelled';
    }
  }
  if (nav?.clipboard?.writeText) {
    try {
      await nav.clipboard.writeText(message);
      return 'copied';
    } catch {
      return 'unavailable';
    }
  }
  return 'unavailable';
}

/** What to show under the share button after a share attempt (null when nothing needs saying). */
export function shareNotice(outcome: ShareOutcome): string | null {
  switch (outcome) {
    case 'copied':
      return 'Obituary copied to the clipboard.';
    case 'unavailable':
      return 'Sharing is not available on this device.';
    default:
      return null;
  }
}

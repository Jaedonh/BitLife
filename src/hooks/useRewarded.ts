import { useCallback, useState } from 'react';

import { rewardedOutcomeMessage, useGameStore, type RewardedOutcome, type RewardedPlacement } from '@/store/gameStore';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * Runs a rewarded placement and remembers why it did not pay out, so the screen
 * can say so instead of leaving a button that silently does nothing. Subscribing
 * to `adsReady` re-renders the screen when the ads SDK finishes starting, so a
 * screen opened during startup gains its rewarded buttons without a manual refresh.
 */
export function useRewarded(): { notice: string | null; adsReady: boolean; run: (placement: RewardedPlacement, option?: string) => Promise<RewardedOutcome> } {
  const rewarded = useGameStore((s) => s.rewarded);
  const adsReady = useSettingsStore((s) => s.adsReady);
  const [notice, setNotice] = useState<string | null>(null);
  const run = useCallback(
    async (placement: RewardedPlacement, option?: string): Promise<RewardedOutcome> => {
      const outcome = await rewarded(placement, option);
      setNotice(rewardedOutcomeMessage(outcome));
      return outcome;
    },
    [rewarded],
  );
  return { notice, adsReady, run };
}

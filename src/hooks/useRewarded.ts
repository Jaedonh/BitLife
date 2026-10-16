import { useCallback, useState } from 'react';

import { rewardedOutcomeMessage, useGameStore, type RewardedOutcome, type RewardedPlacement } from '@/store/gameStore';

/**
 * Runs a rewarded placement and remembers why it did not pay out, so the screen
 * can say so instead of leaving a button that silently does nothing.
 */
export function useRewarded(): { notice: string | null; run: (placement: RewardedPlacement, option?: string) => Promise<RewardedOutcome> } {
  const rewarded = useGameStore((s) => s.rewarded);
  const [notice, setNotice] = useState<string | null>(null);
  const run = useCallback(
    async (placement: RewardedPlacement, option?: string): Promise<RewardedOutcome> => {
      const outcome = await rewarded(placement, option);
      setNotice(rewardedOutcomeMessage(outcome));
      return outcome;
    },
    [rewarded],
  );
  return { notice, run };
}

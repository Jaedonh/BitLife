/**
 * Analytics seam. The MVP ships with no analytics SDK (nothing to declare in
 * the privacy forms); the store calls `track()` at the key moments so a
 * provider can be plugged in later by implementing `setAnalyticsSink`.
 */
export type AnalyticsEvent =
  | { name: 'life_started'; generation: number; custom: boolean; scenario: string }
  | { name: 'age_up'; age: number }
  | { name: 'event_choice'; eventId: string; choiceId: string }
  | { name: 'life_ended'; age: number; ribbon: string; cause: string }
  | { name: 'heir_continued'; generation: number }
  | { name: 'rewarded_ad'; placement: string; result: string }
  | { name: 'interstitial_shown' }
  | { name: 'premium_purchased' }
  | { name: 'premium_restored' };

export type AnalyticsSink = (event: AnalyticsEvent) => void;

let sink: AnalyticsSink | null = null;

export function setAnalyticsSink(next: AnalyticsSink | null): void {
  sink = next;
}

export function track(event: AnalyticsEvent): void {
  try {
    sink?.(event);
  } catch {
    // analytics must never break the game
  }
}

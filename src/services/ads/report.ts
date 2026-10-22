/**
 * "Report an ad". App Store Review Guideline 2.5.18 says apps that show ads must let people
 * report inappropriate or age-inappropriate ads
 * (https://developer.apple.com/app-store/review/guidelines/#2.5.18). Google's AdChoices
 * icon on each ad also offers feedback, but this route does not depend on the ad network:
 * a prefilled email to the support address, opened from Settings. The player's report
 * goes to us; forward it to AdMob's ad review center to block the ad.
 */
export const AD_REPORT_SUBJECT = 'Report an ad';

export interface AdReportContext {
  /** Store version, such as "1.0.0". */
  appVersion?: string | null;
  /** Build number, such as "12". */
  buildVersion?: string | null;
  /** "ios" or "android". */
  platform: string;
}

/** A mailto: link with the subject and a short form to fill in. Never includes any identifier. */
export function adReportMailto(supportEmail: string, context: AdReportContext): string {
  const version = [context.appVersion, context.buildVersion ? `(${context.buildVersion})` : null].filter(Boolean).join(' ');
  const body = [
    'What did the ad show, and why is it a problem?',
    '',
    '',
    'Where did it appear (banner at the bottom, full-screen ad, or a rewarded video)?',
    '',
    '',
    'Roughly when did you see it?',
    '',
    '',
    'A screenshot helps if you have one.',
    '',
    `App: Yearborn ${version || 'unknown version'} on ${context.platform}`,
  ].join('\n');
  return `mailto:${supportEmail}?subject=${encodeURIComponent(AD_REPORT_SUBJECT)}&body=${encodeURIComponent(body)}`;
}

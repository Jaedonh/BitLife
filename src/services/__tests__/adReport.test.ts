/**
 * App Store Review Guideline 2.5.18: an app with ads must let people report an inappropriate ad.
 */
import { AD_REPORT_SUBJECT, adReportMailto } from '../ads';

function parse(link: string) {
  const [target, query = ''] = link.split('?');
  const params = new URLSearchParams(query);
  return { target, subject: params.get('subject'), body: params.get('body') ?? '' };
}

describe('report an ad', () => {
  it('opens a prefilled email to the support address', () => {
    const { target, subject, body } = parse(adReportMailto('help@studio.example.org', { appVersion: '1.0.0', buildVersion: '12', platform: 'ios' }));
    expect(target).toBe('mailto:help@studio.example.org');
    expect(subject).toBe(AD_REPORT_SUBJECT);
    expect(body).toContain('What did the ad show');
    expect(body).toContain('App: LifeLoop 1.0.0 (12) on ios');
  });

  it('copes with an unknown version and keeps the link a single valid URL', () => {
    const link = adReportMailto('help@studio.example.org', { appVersion: null, buildVersion: null, platform: 'android' });
    expect(link).not.toMatch(/\s/);
    expect(parse(link).body).toContain('App: LifeLoop unknown version on android');
  });
});

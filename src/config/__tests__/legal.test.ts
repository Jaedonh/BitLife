import { PRIVACY_URL, SUPPORT_EMAIL } from '../legal';

describe('legal links', () => {
  it('privacy policy URL is https and carries no third-party trademark or placeholder', () => {
    expect(PRIVACY_URL).toMatch(/^https:\/\/[^\s/]+\.[^\s/]+\//);
    // The URL is public (in-app link + both store listings): never a competitor's mark.
    expect(PRIVACY_URL).not.toMatch(/bitlife|candywriter|yourdomain|example\.com/i);
  });

  it('support email is a real mailto target', () => {
    expect(SUPPORT_EMAIL).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(SUPPORT_EMAIL).not.toMatch(/yourdomain|example\.com/i);
  });
});

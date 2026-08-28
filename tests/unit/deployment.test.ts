import { describe, expect, it } from 'vitest';
import config from '../../public/staticwebapp.config.json';

describe('static deployment response policy', () => {
  const headers: Partial<Record<string, string>> = config.globalHeaders;

  it('ships a restrictive content security policy compatible with local data and billing checks', () => {
    const csp = headers['Content-Security-Policy'];
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("connect-src 'self' https://api.sociobot.in https://pilot-api.sociobot.in");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
  });

  it('allows this origin to use the scanner camera and disables unrelated sensitive capabilities', () => {
    const policy = headers['Permissions-Policy'];
    expect(policy).toContain('camera=(self)');
    for (const feature of ['geolocation=()', 'microphone=()', 'payment=()', 'usb=()']) {
      expect(policy).toContain(feature);
    }
  });

  it('serves the PWA manifest with its registered content type', () => {
    expect(config.mimeTypes?.['.webmanifest']).toBe('application/manifest+json');
  });
});

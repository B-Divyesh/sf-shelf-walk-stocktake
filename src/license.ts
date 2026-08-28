const SLUG = 'shelf-walk-stocktake';
const API_BASE = location.hostname === 'shelf-walk-stocktake.sociobot.in'
  ? 'https://api.sociobot.in'
  : 'https://pilot-api.sociobot.in';
const TOKEN_KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `${TOKEN_KEY}:verdict`;
const DAY = 86_400_000;

export type LicenseState = { unlocked: boolean; checking: boolean; reason?: string };

export function captureLicense(): void {
  const url = new URL(location.href);
  const token = url.searchParams.get('license');
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.removeItem(VERDICT_KEY);
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

export function storedToken(): string { return localStorage.getItem(TOKEN_KEY) ?? ''; }

export function restoreLicense(token: string): void {
  const clean = token.trim();
  if (!clean) throw new Error('Paste the license token from your receipt.');
  localStorage.setItem(TOKEN_KEY, clean);
  localStorage.removeItem(VERDICT_KEY);
}

export function clearLicense(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(VERDICT_KEY);
}

export async function checkLicense(force = false): Promise<LicenseState> {
  const token = storedToken();
  if (!token) return { unlocked: false, checking: false };
  const cached = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? 'null') as { valid: boolean; at: number; reason?: string } | null;
  if (!force && cached && Date.now() - cached.at < DAY) return { unlocked: cached.valid, checking: false, reason: cached.reason };
  try {
    const response = await fetch(`${API_BASE}/api/v1/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('verify unavailable');
    const result = await response.json() as { valid: boolean; reason?: string };
    localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: result.valid, reason: result.reason, at: Date.now() }));
    return { unlocked: result.valid, checking: false, reason: result.reason };
  } catch {
    // A previous valid verdict remains useful offline; a new token waits for a network check.
    return { unlocked: cached?.valid === true, checking: false, reason: cached ? undefined : 'offline' };
  }
}

export const checkoutUrl = `${API_BASE}/api/v1/products/${SLUG}/checkout`;

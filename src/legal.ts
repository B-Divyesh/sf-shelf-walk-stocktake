import './styles.css';

const isPrivacy = location.pathname.includes('privacy');
const content = isPrivacy ? `
  <p class="eyebrow">Local-first by design</p><h1>Privacy</h1>
  <p class="lede">Your shelf list, counts, notes and photos stay in this browser’s local storage. Shelf Walk Stocktake has no analytics, advertising trackers or account system.</p>
  <h2>What stays on your device</h2><p>Imported item data, stock counts, reason codes, notes, optional photos, audit events and paid-unlock preferences are stored in IndexedDB or localStorage. They leave only when you export or share a file.</p>
  <h2>Camera and photos</h2><p>Camera access begins only after you choose “Scan barcode”. Photo notes are optional and stored locally. Your browser controls permission; you can revoke it in site settings. Avoid photographing people, access codes or unrelated confidential material.</p>
  <h2>License checks</h2><p>If you add a Pro license, the token is sent to Sociobot’s billing API no more than once daily to check whether it remains valid. Payment is handled on a hosted page by Sociobot/Dodo, the merchant of record; this app never receives card details.</p>
  <h2>Your control</h2><p>Use Backup data to keep a portable copy. “Erase this stocktake” removes active count data from this browser. Removing site data in browser settings clears everything, including the stored license token.</p>
  <p class="muted">Effective 28 August 2026. Questions: support@sociobot.in</p>` : `
  <p class="eyebrow">Plain terms for a practical tool</p><h1>Terms</h1>
  <p class="lede">Shelf Walk Stocktake helps prepare physical-count records. You remain responsible for checking counts and deciding what to import into your inventory system.</p>
  <h2>Use of the service</h2><p>You may use the app for lawful stocktaking. Do not use it to process data you lack permission to handle. The software is provided “as is” without a guarantee that a scan, count, export or browser storage will be error-free.</p>
  <h2>One-time Pro purchase</h2><p>Pro is a one-time ₹799 purchase for the features described at checkout. Sociobot/Dodo is the merchant of record and handles payment and refunds. A refund revokes the associated license. A license is for one operator or business and may be restored on replacement devices.</p>
  <h2>Data and availability</h2><p>The app is local-first. Clearing browser storage can remove count data, so export audit files and backups before relying on them as records. Offline use depends on a successful first load and the browser’s service-worker support.</p>
  <h2>Liability</h2><p>To the maximum extent permitted by law, Sociobot is not liable for indirect losses, lost inventory records or decisions made from exported data.</p>
  <p class="muted">Effective 28 August 2026. Questions: support@sociobot.in</p>`;

document.querySelector<HTMLDivElement>('#legal')!.innerHTML = `
  <header class="site-header"><a class="brand" href="/" aria-label="Shelf Walk Stocktake home"><span class="brand-mark" aria-hidden="true">//</span> Shelf Walk</a></header>
  <main id="main" tabindex="-1" class="legal-page">${content}<p><a class="text-link" href="/">← Return to stocktake</a></p></main>
  <footer class="site-footer"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><span>© 2026 Sociobot</span></footer>`;

document.addEventListener('click', (event) => {
  const skip = (event.target as HTMLElement).closest<HTMLAnchorElement>('a.skip-link');
  if (!skip) return;
  const target = document.querySelector<HTMLElement>(skip.hash);
  if (!target) return;
  event.preventDefault();
  history.replaceState({}, '', skip.hash);
  target.focus();
  target.scrollIntoView();
});

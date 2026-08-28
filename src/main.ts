import './styles.css';
import { loadState, saveSnapshot, saveState, listSnapshots } from './db';
import { emptyState, type Item, type StocktakeState } from './model';
import { auditCsv, importItems, toCsv, varianceCsv } from './csv';
import { captureLicense, checkLicense, checkoutUrl, restoreLicense, storedToken, type LicenseState } from './license';

type Mode = 'start' | 'walk' | 'review' | 'more';
let state: StocktakeState = emptyState();
let mode: Mode = 'start';
let activeId = '';
let query = '';
let reviewFilter: 'all' | 'variance' | 'uncounted' = 'all';
let license: LicenseState = { unlocked: false, checking: true };
let snapshots: Array<{ savedAt: string; state: StocktakeState }> = [];
let deferredInstall: Event | null = null;
let cameraStream: MediaStream | null = null;
let scannerReturnFocus: HTMLElement | null = null;
const pendingPhotos: Record<string, string> = {};
const app = document.querySelector<HTMLDivElement>('#app')!;
const fmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

const esc = (value: unknown) => String(value ?? '').replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]!));
const current = () => state.items.find((item) => item.id === activeId) ?? state.items.find((item) => !state.counts[item.id]) ?? state.items[0];
const countedTotal = () => Object.keys(state.counts).length;
const varianceTotal = () => state.items.filter((i) => state.counts[i.id] && state.counts[i.id].counted !== i.expected).length;
const addAudit = (action: string, detail: string, itemId?: string) => state.audit.push({ at: new Date().toISOString(), action, detail, itemId, counter: state.counter });

function shell(content: string): string {
  const online = navigator.onLine;
  return `<header class="site-header">
    <a class="brand" href="/" data-action="home" aria-label="Shelf Walk Stocktake home"><span class="brand-mark" aria-hidden="true">//</span> Shelf Walk</a>
    <div class="header-status"><span class="status-dot ${online ? '' : 'offline'}" aria-hidden="true"></span>${online ? 'Local save on' : 'Offline · local save on'}</div>
  </header>
  ${state.items.length ? `<nav class="step-rail" aria-label="Stocktake steps">
    <button data-mode="walk" class="${mode === 'walk' ? 'active' : ''}"><b>01</b> Walk</button>
    <button data-mode="review" class="${mode === 'review' ? 'active' : ''}"><b>02</b> Review</button>
    <button data-mode="more" class="${mode === 'more' ? 'active' : ''}"><b>03</b> Finish</button>
  </nav>` : ''}
  <main id="main" tabindex="-1">${content}</main>
  <footer class="site-footer"><span>Built for basements and back aisles.</span><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><span>Original AI-generated scene.</span></footer>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>`;
}

function startView(): string {
  return `<section class="hero">
    <div class="hero-copy"><p class="eyebrow">Offline stock count · no ERP required</p><h1>Walk the shelf.<br><em>Trust the variance.</em></h1>
      <p class="lede">Import the list you already have, count in full shelf-path order, and leave with clean variance and audit files.</p>
      <div class="import-panel"><label class="file-button file-picker"><span>Import shelf-list CSV</span><input id="csv-file" type="file" accept=".csv,text/csv"></label>
        <button class="button secondary" data-action="template">Download CSV template</button>
        <p class="field-help">Required: <code>sku, location, expected</code>. Optional: <code>name, barcode</code>. Max 10,000 rows / 2 MB.</p>
        <p id="import-error" class="error" role="alert"></p>
      </div>
      <details class="restore"><summary>Restore a local backup</summary><label for="backup-file">Choose Shelf Walk JSON backup</label><input id="backup-file" type="file" accept="application/json,.json"></details>
    </div>
    <figure class="hero-art"><picture><source srcset="/assets/shelf-walk-hero.webp" type="image/webp"><img src="/assets/shelf-walk-hero.webp" width="1536" height="1024" fetchpriority="high" decoding="async" alt="Concrete stockroom aisle with steel shelves, green crates and a barcode scanner"></picture><figcaption>Full shelf paths stay visible on every count.</figcaption></figure>
  </section>
  <section class="method" aria-labelledby="method-title"><p class="eyebrow">A controlled count pass</p><h2 id="method-title">Paper-simple. Audit-ready.</h2><ol><li><b>Import</b><span>Bring a plain CSV from any inventory system.</span></li><li><b>Count</b><span>Scan or search without losing shelf order.</span></li><li><b>Explain</b><span>Reason codes and photo notes stay attached.</span></li><li><b>Export</b><span>Only variances, plus a complete audit trail.</span></li></ol></section>`;
}

function walkView(): string {
  const item = current();
  if (!item) return '';
  activeId = item.id;
  const count = state.counts[item.id];
  const photo = count?.photo ?? pendingPhotos[item.id];
  const matches = query.trim() ? state.items.filter((i) => `${i.barcode} ${i.sku} ${i.name} ${i.location}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 12) : [];
  const percent = Math.round((countedTotal() / state.items.length) * 100);
  return `<section class="workbench">
    <div class="work-top"><div><p class="eyebrow">Shelf walk in progress</p><h1>Count stock</h1></div><div class="progress-copy"><b>${countedTotal()} / ${state.items.length}</b><span>${percent}% counted</span></div></div>
    <div class="progress" role="progressbar" aria-label="Count progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><span style="width:${percent}%"></span></div>
    <div class="find-row"><div class="field"><label for="item-search">Scan barcode or find an item</label><input id="item-search" type="search" value="${esc(query)}" placeholder="Barcode, SKU, name or shelf path" autocomplete="off"></div><button class="button scan" data-action="scan"><span aria-hidden="true">⌗</span> Scan barcode</button></div>
    ${matches.length ? `<div class="search-results" role="listbox" aria-label="Matching items">${matches.map((i) => `<button role="option" data-select="${esc(i.id)}"><span><b>${esc(i.sku)}</b> ${esc(i.name || 'Unnamed item')}</span><small>${esc(i.location)}</small></button>`).join('')}</div>` : query ? `<p class="empty-inline">No item matches “${esc(query)}”. Try the SKU or full shelf path.</p>` : ''}
    <article class="count-sheet">
      <div class="location-stamp"><span>Full shelf path</span><strong>${esc(item.location)}</strong></div>
      <div class="item-head"><div><p class="sku">${esc(item.sku)}${item.barcode ? ` · ${esc(item.barcode)}` : ''}</p><h2>${esc(item.name || 'Unnamed item')}</h2></div><div class="expected"><span>Expected</span><b>${item.expected}</b></div></div>
      <form id="count-form" novalidate>
        <div class="count-control"><label for="counted">Counted quantity</label><div><button type="button" data-action="minus" aria-label="Decrease count">−</button><input id="counted" name="counted" inputmode="decimal" type="number" min="0" step="any" required value="${count?.counted ?? item.expected}"><button type="button" data-action="plus" aria-label="Increase count">+</button></div></div>
        <div class="field"><label for="reason">Variance reason <span>(required if count differs)</span></label><select id="reason" name="reason"><option value="">Choose a reason</option>${['Damaged','Misplaced','Delivery timing','Unit or pack mismatch','Data error','Unknown'].map((v) => `<option ${count?.reason === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
        <div class="field"><label for="note">Note <span>(optional)</span></label><textarea id="note" name="note" rows="2" maxlength="500" placeholder="Add the detail someone reconciling this will need">${esc(count?.note ?? '')}</textarea></div>
        <div class="photo-row"><label class="button secondary" for="photo">${photo ? 'Replace photo note' : 'Add photo note'}</label><input class="visually-hidden" id="photo" type="file" accept="image/*" capture="environment">${photo ? `<img src="${photo}" width="72" height="72" alt="Current photo note"><button type="button" class="text-button danger" data-action="remove-photo">Remove</button>` : '<span>Optional · kept on this device</span>'}</div>
        <p id="count-error" class="error" role="alert"></p>
        <div class="form-actions"><button class="button primary" type="submit">Save &amp; next shelf <span aria-hidden="true">→</span></button><button class="button secondary" type="button" data-mode="review">Review count</button></div>
      </form>
    </article>
    <div class="shelf-queue"><h2>Next on the walk</h2>${state.items.filter((i) => !state.counts[i.id] && i.id !== item.id).slice(0,4).map((i) => `<button data-select="${esc(i.id)}"><span>${esc(i.location)}</span><b>${esc(i.sku)}</b></button>`).join('') || '<p>Every item has a count. Review the variances.</p>'}</div>
  </section>`;
}

function reviewView(): string {
  const rows = state.items.filter((item) => reviewFilter === 'all' || (reviewFilter === 'variance' ? state.counts[item.id] && state.counts[item.id].counted !== item.expected : !state.counts[item.id]));
  return `<section class="review-page"><p class="eyebrow">Reconcile before export</p><h1>Review the count</h1>
    <div class="summary-strip"><div><b>${countedTotal()}</b><span>Counted</span></div><div><b>${state.items.length-countedTotal()}</b><span>Uncounted</span></div><div><b>${varianceTotal()}</b><span>Variances</span></div></div>
    ${countedTotal() === state.items.length ? '<p class="notice success"><b>Walk complete.</b> Every imported item has a count.</p>' : `<p class="notice warning"><b>${state.items.length-countedTotal()} still uncounted.</b> You can export now, but the audit will show an incomplete walk.</p>`}
    <div class="filter-row" aria-label="Filter review"><button data-filter="all" class="${reviewFilter==='all'?'active':''}">All ${state.items.length}</button><button data-filter="variance" class="${reviewFilter==='variance'?'active':''}">Variances ${varianceTotal()}</button><button data-filter="uncounted" class="${reviewFilter==='uncounted'?'active':''}">Uncounted ${state.items.length-countedTotal()}</button></div>
    <div class="review-list">${rows.map((item) => { const c=state.counts[item.id]; const diff=c ? c.counted-item.expected : null; return `<button data-select="${esc(item.id)}" data-goto-walk><span class="path">${esc(item.location)}</span><span class="review-name"><b>${esc(item.sku)}</b> ${esc(item.name)}</span><span class="tally">${c ? `${c.counted} / ${item.expected}` : 'Not counted'}</span><span class="variance ${diff===0?'even':diff===null?'missing':''}">${diff===null?'—':diff===0?'Even':`${diff>0?'+':''}${diff}`}</span></button>`; }).join('') || '<div class="empty-state"><b>Nothing in this view.</b><span>Try a different filter.</span></div>'}</div>
  </section>`;
}

function moreView(): string {
  return `<section class="finish-page"><p class="eyebrow">Own the result</p><h1>Export &amp; hand off</h1><p class="lede">Files are created on this device. Spreadsheet-formula characters are neutralised on export.</p>
    <div class="export-grid"><div><span class="stamp">CSV</span><h2>Variance file</h2><p>Only counted items that differ from expected stock.</p><button class="button primary" data-action="export-variance">Export ${varianceTotal()} variances</button></div><div><span class="stamp">CSV</span><h2>Audit trail</h2><p>Timestamped import and count events, including full paths.</p><button class="button primary" data-action="export-audit">Export audit trail</button></div><div><span class="stamp">JSON</span><h2>Local backup</h2><p>A portable copy of this full stocktake, including photo notes.</p><button class="button secondary" data-action="backup">Backup data</button></div></div>
    <section class="pro-panel" aria-labelledby="pro-title"><div><p class="eyebrow">Optional permanent upgrade</p><h2 id="pro-title">Pro checkpoint pack</h2><p>₹799 once. Add a named counter to audit rows and save up to five restorable checkpoints on this device. Counting, photos and both CSV exports stay free.</p></div>
      ${license.unlocked ? `<div class="license-active"><b>Pro unlocked</b><label for="counter">Counter name on new audit rows</label><input id="counter" value="${esc(state.counter)}" maxlength="80"><button class="button secondary" data-action="snapshot">Save checkpoint</button>${snapshots.length ? `<div class="snapshots"><span>Recent checkpoints</span>${snapshots.map((s,i)=>`<button data-snapshot="${i}">${fmt.format(new Date(s.savedAt))} · ${s.state.items.length} items</button>`).join('')}</div>` : ''}</div>` : `<div class="license-buy"><a class="button accent" href="${checkoutUrl}">Buy Pro — ₹799 once</a><details><summary>Have a license? Restore it</summary><form id="license-form"><label for="license-token">License token</label><input id="license-token" autocomplete="off" value="${esc(storedToken())}"><button class="button secondary">Verify &amp; unlock</button><p class="field-help">${license.reason === 'offline' ? 'Connect once to verify this license.' : license.reason ? 'License no longer active. Check the token or buy a new license.' : 'Paste the token from your receipt.'}</p></form></details></div>`}
    </section>
    <details class="danger-zone"><summary>Erase this stocktake</summary><p>Removes the current import, counts, notes and audit events from this device. Download a backup first if you may need them.</p><button class="button danger-button" data-action="erase">Erase current stocktake</button></details>
  </section>`;
}

function render(focusId?: string): void {
  const content = state.items.length === 0 ? startView() : mode === 'review' ? reviewView() : mode === 'more' ? moreView() : walkView();
  app.innerHTML = shell(content);
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function toast(message: string): void {
  const node = document.querySelector<HTMLDivElement>('#toast'); if (!node) return;
  node.textContent = message; node.classList.add('show'); window.setTimeout(() => node.classList.remove('show'), 3200);
}

async function persist(message?: string): Promise<void> {
  state.updatedAt = new Date().toISOString(); await saveState(state); if (message) toast(message);
}

function download(name: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function handleCsv(file: File): Promise<void> {
  try {
    const items = importItems(await file.text());
    state = emptyState(); state.items = items; addAudit('import', `Imported ${items.length} items from ${file.name}`);
    activeId = items[0].id; mode = 'walk'; await persist(); render('counted'); toast(`${items.length} items ready in shelf order.`);
  } catch (error) {
    const node = document.querySelector('#import-error'); if (node) node.textContent = error instanceof Error ? error.message : 'Could not read that CSV.';
  }
}

async function photoData(file: File): Promise<string> {
  if (file.size > 12_000_000) throw new Error('That photo is over 12 MB. Choose a smaller image.');
  const bitmap = await createImageBitmap(file); const scale = Math.min(1, 960 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas'); canvas.width = Math.round(bitmap.width*scale); canvas.height = Math.round(bitmap.height*scale);
  canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close(); return canvas.toDataURL('image/jpeg',.72);
}

function stopCamera(): void { cameraStream?.getTracks().forEach((track) => track.stop()); cameraStream = null; document.querySelector('#scan-dialog')?.remove(); scannerReturnFocus?.focus(); scannerReturnFocus=null; }

async function scanCamera(): Promise<void> {
  scannerReturnFocus=document.activeElement as HTMLElement;
  const supported = 'BarcodeDetector' in window;
  const dialog = document.createElement('div'); dialog.id='scan-dialog'; dialog.className='dialog-backdrop';
  dialog.innerHTML = `<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="scan-title"><button class="dialog-close" data-action="close-scan" aria-label="Close scanner">×</button><p class="eyebrow">Camera permission required</p><h2 id="scan-title">Scan a barcode</h2><p>${supported ? 'Your camera frames stay on this device and are not uploaded. You can also enter a barcode manually.' : 'Automatic camera scanning is unavailable in this browser. Enter the barcode below.'}</p>${supported ? '<video id="scan-video" playsinline muted aria-label="Live barcode camera view"></video><p id="scan-status" role="status">Point the camera at one barcode.</p>' : ''}<form id="manual-scan"><label for="barcode-entry">Barcode</label><input id="barcode-entry" inputmode="numeric" autocomplete="off"><button class="button primary">Find item</button></form></div>`;
  dialog.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).closest<HTMLElement>('[data-action="close-scan"]')) stopCamera();
  });
  dialog.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    if (form.id !== 'manual-scan') return;
    const code = (form.querySelector('#barcode-entry') as HTMLInputElement).value;
    stopCamera();
    findBarcode(code);
  });
  document.body.append(dialog); (dialog.querySelector('.dialog-close') as HTMLButtonElement).focus();
  if (!supported) return;
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    const video = document.querySelector<HTMLVideoElement>('#scan-video')!; video.srcObject = cameraStream; await video.play();
    const Detector = (window as unknown as { BarcodeDetector: new (o: {formats: string[]}) => { detect(v: HTMLVideoElement): Promise<Array<{rawValue:string}>> } }).BarcodeDetector;
    const detector = new Detector({formats:['ean_13','ean_8','upc_a','upc_e','code_128','code_39','itf','qr_code']});
    const tick = async () => { if (!cameraStream) return; try { const codes=await detector.detect(video); if(codes[0]) { findBarcode(codes[0].rawValue); stopCamera(); return; } } catch { /* transient frame error */ } requestAnimationFrame(tick); }; tick();
  } catch {
    const status = document.querySelector('#scan-status'); if(status) status.textContent='Camera access was blocked or unavailable. Type the barcode below, or allow camera access in browser settings.';
  }
}

function findBarcode(code: string): void {
  const exact = state.items.filter((i) => i.barcode === code.trim() || i.sku === code.trim());
  if (exact.length === 1) { activeId=exact[0].id; query=''; mode='walk'; render('counted'); toast(`Matched ${exact[0].sku} at ${exact[0].location}.`); }
  else { query=code.trim(); mode='walk'; render('item-search'); if(!exact.length) toast('No exact barcode match. Showing search results.'); else toast(`${exact.length} locations match. Choose the full shelf path.`); }
}

app.addEventListener('click', async (event) => {
  const el = (event.target as HTMLElement).closest<HTMLElement>('[data-action],[data-mode],[data-select],[data-filter],[data-snapshot]'); if (!el) return;
  if (el.dataset.mode) { mode=el.dataset.mode as Mode; query=''; render(); return; }
  if (el.dataset.select) { activeId=el.dataset.select; query=''; mode='walk'; render('counted'); return; }
  if (el.dataset.filter) { reviewFilter=el.dataset.filter as typeof reviewFilter; render(); return; }
  if (el.dataset.snapshot) { if(!confirm('Restore this checkpoint? Your current active count will be replaced.')) return; state=structuredClone(snapshots[Number(el.dataset.snapshot)].state); await persist('Checkpoint restored.'); mode='walk'; render(); return; }
  const action=el.dataset.action;
  if(action==='home') { event.preventDefault(); mode=state.items.length?'walk':'start'; render(); }
  if(action==='template') download('shelf-walk-template.csv',toCsv([['sku','name','barcode','location','expected'],['SKU-001','Example item','8901234567890','Aisle 01 / Bay 02 / Shelf B',12]]),'text/csv');
  if(action==='minus'||action==='plus') { const input=document.querySelector<HTMLInputElement>('#counted')!; const value=Number(input.value)||0; input.value=String(Math.max(0,value+(action==='plus'?1:-1))); input.focus(); }
  if(action==='scan') scanCamera();
  if(action==='close-scan') stopCamera();
  if(action==='remove-photo') { const c=state.counts[activeId]; if(c) delete c.photo; delete pendingPhotos[activeId]; if(c) await persist(); render(); toast('Photo note removed.'); }
  if(action==='export-variance') { download(`variances-${state.sessionId.slice(0,8)}.csv`,varianceCsv(state),'text/csv'); addAudit('export','Exported variance CSV'); await persist('Variance file downloaded.'); }
  if(action==='export-audit') { addAudit('export','Exported audit CSV'); await persist(); download(`audit-${state.sessionId.slice(0,8)}.csv`,auditCsv(state),'text/csv'); toast('Audit trail downloaded.'); }
  if(action==='backup') download(`shelf-walk-backup-${state.sessionId.slice(0,8)}.json`,JSON.stringify(state,null,2),'application/json');
  if(action==='snapshot'&&license.unlocked) { await saveSnapshot(structuredClone(state)); snapshots=await listSnapshots(); render(); toast('Checkpoint saved on this device.'); }
  if(action==='erase') { if(!confirm(`Erase this ${state.items.length}-item stocktake and all of its counts from this device?`)) return; state=emptyState(); await persist(); mode='start'; activeId=''; render(); }
});

app.addEventListener('input', async (event) => {
  const target=event.target as HTMLInputElement;
  if(target.id==='item-search') { query=target.value; render('item-search'); const input=document.querySelector<HTMLInputElement>('#item-search'); input?.setSelectionRange(query.length,query.length); }
  if(target.id==='counter'&&license.unlocked) { state.counter=target.value; await persist(); }
});

app.addEventListener('change', async (event) => {
  const target=event.target as HTMLInputElement;
  if(target.id==='csv-file'&&target.files?.[0]) handleCsv(target.files[0]);
  if(target.id==='photo'&&target.files?.[0]) { try { const data=await photoData(target.files[0]); const c=state.counts[activeId]; if(c){c.photo=data;addAudit('photo','Added or replaced photo note',activeId);await persist();}else pendingPhotos[activeId]=data; render(); toast(c?'Photo note saved locally.':'Photo ready; save the count to keep it.'); } catch(e){ toast(e instanceof Error?e.message:'Could not read the photo.'); } }
  if(target.id==='backup-file'&&target.files?.[0]) { try { const restored=JSON.parse(await target.files[0].text()) as StocktakeState; if(restored.version!==1||!Array.isArray(restored.items)||typeof restored.counts!=='object') throw new Error(); state=restored; addAudit('restore','Restored from a local JSON backup'); await persist(); mode='walk'; activeId=''; render(); toast('Backup restored.'); } catch { const n=document.querySelector('#import-error'); if(n)n.textContent='That file is not a valid Shelf Walk backup.'; } }
});

app.addEventListener('submit', async (event) => {
  event.preventDefault(); const form=event.target as HTMLFormElement;
  if(form.id==='count-form') { const data=new FormData(form); const qty=Number(data.get('counted')); const item=current()!; const reason=String(data.get('reason')??''); const error=document.querySelector('#count-error')!;
    if(!Number.isFinite(qty)||qty<0){error.textContent='Enter a count of zero or more.';return;} if(qty!==item.expected&&!reason){error.textContent='Choose a reason for this variance.';document.querySelector<HTMLSelectElement>('#reason')?.focus();return;}
    const prior=state.counts[item.id]; state.counts[item.id]={itemId:item.id,counted:qty,reason,note:String(data.get('note')??'').trim(),photo:prior?.photo??pendingPhotos[item.id],updatedAt:new Date().toISOString()}; delete pendingPhotos[item.id]; addAudit(prior?'recount':'count',`Expected ${item.expected}; counted ${qty}${reason?`; reason: ${reason}`:''}`,item.id);
    const idx=state.items.findIndex((i)=>i.id===item.id); activeId=state.items.slice(idx+1).find((i)=>!state.counts[i.id])?.id ?? state.items.find((i)=>!state.counts[i.id])?.id ?? item.id; await persist('Count saved. Moving to the next shelf.'); render('counted');
  }
  if(form.id==='license-form') { const token=(form.querySelector('#license-token') as HTMLInputElement).value; try { restoreLicense(token); license={unlocked:false,checking:true}; render(); license=await checkLicense(true); if(license.unlocked){snapshots=await listSnapshots();toast('Pro unlocked on this device.');} render(); } catch(e){toast(e instanceof Error?e.message:'Could not verify license.');} }
});

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

document.addEventListener('keydown',(event)=>{
  const dialog=document.querySelector<HTMLElement>('#scan-dialog .dialog');
  if(event.key==='Escape'&&dialog){stopCamera();return;}
  if(event.key==='Tab'&&dialog){const focusable=[...dialog.querySelectorAll<HTMLElement>('button,input,[href],[tabindex]:not([tabindex="-1"])')].filter((node)=>!node.hasAttribute('disabled'));if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
});
window.addEventListener('online',()=>render()); window.addEventListener('offline',()=>render());
window.addEventListener('beforeinstallprompt',(event)=>{event.preventDefault();deferredInstall=event;void deferredInstall;});

async function registerServiceWorker(): Promise<void> {
  if(!('serviceWorker' in navigator)) return;
  const reg=await navigator.serviceWorker.register('/sw.js');
  reg.addEventListener('updatefound',()=>{ const worker=reg.installing; worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller) toast('An update is ready. Reload to use it.');}); });
}

async function init(): Promise<void> {
  captureLicense();
  try { state=(await loadState())??emptyState(); } catch { state=emptyState(); }
  if(state.items.length) { mode='walk'; activeId=state.items.find((i)=>!state.counts[i.id])?.id??state.items[0].id; }
  render();
  license=await checkLicense(); if(license.unlocked) snapshots=await listSnapshots();
  if(mode==='more') render();
  registerServiceWorker().catch(()=>{});
}
init();

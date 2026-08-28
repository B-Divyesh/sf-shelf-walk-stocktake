const VERSION='shelf-walk-v1';
const SHELL=['/offline.html','/manifest.webmanifest','/assets/shelf-walk-hero.webp','/icons/icon-192.png','/icons/icon-512.png'];
async function cachePage(cache,path){
  const response=await fetch(path);const text=await response.text();await cache.put(path,new Response(text,{headers:response.headers,status:response.status,statusText:response.statusText}));
  const assets=[...text.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match)=>match[1]);
  await Promise.all([...new Set(assets)].map((asset)=>cache.add(asset)));
}
self.addEventListener('install',(event)=>{event.waitUntil(caches.open(VERSION).then(async(cache)=>{await cache.addAll(SHELL);await Promise.all(['/','/privacy/','/terms/'].map((path)=>cachePage(cache,path)));}).then(()=>self.skipWaiting()));});
self.addEventListener('activate',(event)=>{event.waitUntil(caches.keys().then((keys)=>Promise.all(keys.filter((key)=>key!==VERSION).map((key)=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',(event)=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then((response)=>{const copy=response.clone();caches.open(VERSION).then((cache)=>cache.put(event.request,copy));return response;}).catch(async()=>await caches.match(event.request)||await caches.match('/')||await caches.match('/offline.html')));return;
  }
  event.respondWith(caches.match(event.request).then((cached)=>cached||fetch(event.request).then((response)=>{if(response.ok){const copy=response.clone();caches.open(VERSION).then((cache)=>cache.put(event.request,copy));}return response;})));
});

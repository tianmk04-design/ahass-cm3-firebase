const V='ahass-v4',SHELL=['./','index.html','frontdesk.html','manifest-index.json','manifest-frontdesk.json','icon-192.png','icon-512.png','fb.js','firebase-config.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
// Stale-while-revalidate: buka instan dari cache, perbarui di latar belakang.
self.addEventListener('fetch',e=>{
 const r=e.request,u=new URL(r.url);
 if(r.method!=='GET')return;
 if(u.origin!==location.origin){/* Firebase SDK: cache-first so the apps can start offline */
  if(u.hostname==='www.gstatic.com'&&u.pathname.startsWith('/firebasejs/'))e.respondWith(caches.open(V).then(async c=>{const h=await c.match(r);if(h)return h;const res=await fetch(r);if(res&&res.ok)c.put(r,res.clone());return res}));
  return}
 e.respondWith((async()=>{
  const c=await caches.open(V);
  const hit=await c.match(r,{ignoreSearch:true});
  const net=fetch(r).then(res=>{if(res&&res.ok)c.put(r,res.clone());return res}).catch(()=>null);
  if(hit){e.waitUntil(net);return hit}
  return (await net)||(r.mode==='navigate'?c.match('index.html'):Response.error());
 })());
});

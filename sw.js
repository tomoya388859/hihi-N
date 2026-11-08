// 通知を受け取り、アプリの一覧用に保存する
const DB = 'keiba-notify', STORE = 'picks';
function db() { return new Promise((res, rej) => { const q = indexedDB.open(DB, 1); q.onupgradeneeded = () => q.result.createObjectStore(STORE, { keyPath: 'key' }); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); }
async function save(p) {
  const d = await db();
  await new Promise((res, rej) => { const t = d.transaction(STORE, 'readwrite'); t.objectStore(STORE).put({ ...p, key: p.id, received: new Date().toISOString() }); t.oncomplete = res; t.onerror = () => rej(t.error); });
}
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('push', e => {
  let p = {}; try { p = e.data ? e.data.json() : {}; } catch (err) { p = { title: 'hihi-N', body: e.data ? e.data.text() : '' }; }
  e.waitUntil((async () => {
    if (p.id) await save(p);
    await self.registration.showNotification(p.title || 'hihi-N', { body: p.body || '', tag: p.id || undefined, icon: 'icon-192.png', badge: 'icon-192.png', data: { id: p.id } });
    for (const c of await self.clients.matchAll({ type: 'window' })) c.postMessage({ type: 'refresh' });
  })());
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (cs.length) { cs[0].focus(); cs[0].postMessage({ type: 'refresh', focus: e.notification.data && e.notification.data.id }); }
    else await self.clients.openWindow('./?id=' + encodeURIComponent((e.notification.data && e.notification.data.id) || ''));
  })());
});

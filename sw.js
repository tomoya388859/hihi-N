// 通知を受け取り、アプリの一覧用に保存する。予想データの鍵もここで受け取る
const DB = 'keiba-notify', STORE = 'picks';
function db() { return new Promise((res, rej) => { const q = indexedDB.open(DB, 1); q.onupgradeneeded = () => q.result.createObjectStore(STORE, { keyPath: 'key' }); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); }
function appDb() { return new Promise((res, rej) => { const q = indexedDB.open('hihi-app', 1); q.onupgradeneeded = () => { const d = q.result; if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv'); if (!d.objectStoreNames.contains('bets')) d.createObjectStore('bets', { keyPath: 'id' }); }; q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); }
async function save(p) {
  const d = await db();
  await new Promise((res, rej) => { const t = d.transaction(STORE, 'readwrite'); t.objectStore(STORE).put({ ...p, key: p.id, received: new Date().toISOString() }); t.oncomplete = res; t.onerror = () => rej(t.error); });
}
async function setKv(k, v) {
  const d = await appDb();
  await new Promise((res, rej) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); });
}
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('push', e => {
  let p = {}; try { p = e.data ? e.data.json() : {}; } catch (err) { p = { title: 'hihi-N', body: e.data ? e.data.text() : '' }; }
  e.waitUntil((async () => {
    if (p.type === 'key') { await setKv('dataKey', p.key); if (p.repo) await setKv('repo', p.repo); if (p.token) await setKv('ghToken', p.token); }
    else if (p.id) await save(p);
    await self.registration.showNotification(p.title || 'hihi-N', { body: p.body || '', tag: p.id || undefined, icon: 'icon-192.png', badge: 'icon-192.png', data: { id: p.id, type: p.type } });
    for (const c of await self.clients.matchAll({ type: 'window' })) c.postMessage({ type: 'refresh' });
  })());
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const id = (e.notification.data && e.notification.data.id) || '';
  e.waitUntil((async () => {
    const cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (cs.length) { cs[0].focus(); cs[0].postMessage({ type: 'refresh', focus: id }); }
    else await self.clients.openWindow('./?id=' + encodeURIComponent(id));
  })());
});

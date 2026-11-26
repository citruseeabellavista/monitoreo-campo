/* Service worker de la app de campo: deja la app disponible SIN SEÑAL.
 * Guarda los archivos propios en el dispositivo; las llamadas al sistema
 * (Google Apps Script) nunca pasan por acá. Para forzar una actualización en
 * todos los celulares, cambie el número de VERSION. */
const VERSION = 'campo-v3.1';
const BASICOS = ['./', './index.html', './config.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(BASICOS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return;
  // Primero lo guardado (abre al instante, con o sin señal) y en segundo plano se actualiza.
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(function (guardado) {
    const red = fetch(r).then(function (resp) {
      if (resp && resp.ok) { const copia = resp.clone(); caches.open(VERSION).then(function (c) { c.put(r, copia); }); }
      return resp;
    }).catch(function () { return guardado || (r.mode === 'navigate' ? caches.match('./index.html') : undefined); });
    return guardado || red;
  }));
});

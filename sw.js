// Service worker da versão pública (cifrada): guarda o app no celular para abrir sem sinal no campo.
// Gerado por cifra/cifrar_app.py; o nome do cache segue a VERSAO do config.js (força os celulares a baixarem de novo).
const CACHE = 'medicao-bicos-v0.7.0';
const ARQUIVOS = [
  './', './index.html', './manifest.webmanifest', './pacote.cifrado',
  './vendor/jspdf.umd.min.js', './icones/icone_192.png', './icones/icone_512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(chaves => Promise.all(chaves.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Abre na hora com o que está guardado (sinal fraco no campo não trava o app) e,
// se houver rede, atualiza a cópia em segundo plano para a próxima abertura.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.open(CACHE).then(async c => {
      const guardado = await c.match(e.request, { ignoreSearch: true });
      const daRede = fetch(e.request)
        .then(resp => { if (resp.ok) c.put(e.request, resp.clone()); return resp; })
        .catch(() => guardado);
      return guardado || daRede;
    })
  );
});

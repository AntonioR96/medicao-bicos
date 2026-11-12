// Service worker da versão pública (cifrada): guarda o app no celular para abrir sem sinal no campo.
// Gerado por cifra/cifrar_app.py; o nome do cache segue a VERSAO do config.js (força os celulares a baixarem de novo).
//
// v0.9.1 (12/11/2026): versão nova não chegava ao celular. O GitHub Pages manda o navegador guardar cada arquivo por
// 10 min (max-age=600) e o sw antigo abria o pacote guardado primeiro, atualizando só para a abertura seguinte.
// Agora: instalação baixa tudo direto do servidor (cache: 'reload') e, com internet, cada abertura busca o arquivo novo
// primeiro (cache: 'no-cache', revalida pelo ETag); sem sinal ou com rede lenta (mais de 4 s), abre o que está guardado.
const CACHE = 'medicao-bicos-v0.9.3';
const ARQUIVOS = [
  './', './index.html', './manifest.webmanifest', './pacote.cifrado',
  './vendor/jspdf.umd.min.js', './icones/icone_192.png', './icones/icone_512.png',
];
const ESPERA_REDE_MS = 4000;

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ARQUIVOS.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(chaves => Promise.all(chaves.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Rede primeiro (sempre a versão publicada); guardado como reserva para o campo sem sinal.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async c => {
      const guardado = await c.match(e.request, { ignoreSearch: true });
      const daRede = fetch(e.request.url, { cache: 'no-cache', credentials: 'same-origin' })
        .then(resp => { if (resp.ok) c.put(e.request, resp.clone()); return resp; });
      if (!guardado) return daRede;
      const espera = new Promise(ok => setTimeout(() => ok(guardado), ESPERA_REDE_MS));
      return Promise.race([daRede.catch(() => guardado), espera]);
    })
  );
});

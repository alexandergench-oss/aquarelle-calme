// Gardien du jeu hors ligne. Fichier fabriqué par scripts/preparer-site.js : ne pas modifier à la main.
const CACHE = 'aquarelle-calme-c7a38c277bad';
const NOYAU = ["./","manifest.webmanifest","icones/icone-512.png","icones/icone-192.png","icones/icone-180.png","assets/assets/audio/bol-0.5a8c8bff7d699ef2e1b2ae586b1ac8ea.wav","assets/assets/audio/bol-1.a62990addf58f1e11c86e21b4c456b8f.wav","assets/assets/audio/bol-2.3d4602e0b3e1a536264ffbfa979b5f94.wav","assets/assets/audio/bol-3.4efef2cb6873413dbe1830b0a70d1fcf.wav","assets/assets/audio/bol-4.b4b6e4d190376b441572956ec53365df.wav","assets/assets/audio/bol-5.e9b5284ef47fde4806e12467cecac445.wav","assets/assets/audio/bol-6.40f9f8793dd6d8034ad5bf673aa1e465.wav","assets/assets/audio/bol-7.ecf1340392fd0ef44a0f247903ae9bab.wav","assets/assets/audio/choix.2a90e6dd00f312570c717bd2fdb720db.wav","assets/assets/audio/fin.d752155f3029e828205d46ac379be5ab.wav","assets/assets/audio/goutte-0.9511bb6ecd1443cc0829d02a4d5c7d9c.wav","assets/assets/audio/goutte-1.e5d1e36c2601983f4dc347ac02c24233.wav","assets/assets/audio/goutte-2.eda6e2991b23cb2da21a6529954a8d49.wav","assets/assets/audio/goutte-3.5095260361a57ba62c860c98462c386b.wav","assets/assets/audio/goutte-4.26f41ded033ba0dbd49ad205dc81f74e.wav","assets/assets/audio/goutte-5.44b52f4fd1d87b29318f0700baf57353.wav","assets/assets/audio/goutte-6.fe7256843ebd21c9f0b955cd2ea9b376.wav","assets/assets/audio/goutte-7.645855d708aaceb8318ac954e89f41b3.wav","assets/assets/audio/kalimba-0.676c598f00bbdab003cb9696db4240ba.wav","assets/assets/audio/kalimba-1.b93746719529753898fdc87da91f144a.wav","assets/assets/audio/kalimba-2.1eaa7d37f2f1b1f6d8ead4a06a01802c.wav","assets/assets/audio/kalimba-3.021c21990a1460aade6735ebd860433d.wav","assets/assets/audio/kalimba-4.58cf55130eb67622d4e0349b7d239804.wav","assets/assets/audio/kalimba-5.be109b4805ebc9ad54d92d03604e374a.wav","assets/assets/audio/kalimba-6.9ae702d3db14409774fa694c3a376e5f.wav","assets/assets/audio/kalimba-7.e5a8a891090b80fcfb41793cb6917a84.wav","assets/assets/textures/bruit.3358310f2d86384eda603423482a2b37.png","canvaskit.wasm","jeu.js"];

self.addEventListener('install', (evenement) => {
  evenement.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(NOYAU))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evenement) => {
  evenement.waitUntil(
    (async () => {
      // On efface les fichiers des anciennes versions du jeu.
      for (const nom of await caches.keys()) {
        if (nom.startsWith('aquarelle-calme-') && nom !== CACHE) await caches.delete(nom);
      }
      await self.clients.claim();
    })()
  );
});

/** Les lecteurs audio demandent souvent un morceau de fichier : on le découpe dans la copie enregistrée. */
async function morceau(requete, reponse) {
  const demande = requete.headers.get('range');
  const trouve = demande && /bytes=(\d*)-(\d*)/.exec(demande);
  if (!trouve) return reponse;
  const octets = await reponse.arrayBuffer();
  const total = octets.byteLength;
  let debut = trouve[1] === '' ? Math.max(0, total - Number(trouve[2])) : Number(trouve[1]);
  let fin = trouve[1] === '' || trouve[2] === '' ? total - 1 : Math.min(Number(trouve[2]), total - 1);
  if (debut > fin || debut >= total) {
    debut = 0;
    fin = total - 1;
  }
  return new Response(octets.slice(debut, fin + 1), {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': reponse.headers.get('Content-Type') || 'application/octet-stream',
      'Content-Range': 'bytes ' + debut + '-' + fin + '/' + total,
      'Content-Length': String(fin - debut + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}

async function repondre(requete) {
  const cache = await caches.open(CACHE);
  // L'adresse du jeu elle-même (le dossier) correspond à la page enregistrée sous « ./ ».
  const clef = requete.mode === 'navigate' ? new URL('./', self.registration.scope).href : requete.url;
  const enregistre = await cache.match(clef, { ignoreSearch: true });
  if (enregistre) return morceau(requete, enregistre);
  return fetch(requete);
}

self.addEventListener('fetch', (evenement) => {
  const requete = evenement.request;
  if (requete.method !== 'GET' || new URL(requete.url).origin !== self.location.origin) return;
  evenement.respondWith(repondre(requete));
});

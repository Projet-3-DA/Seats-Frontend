// CommonJS (pas ESM) : ce module est testé avec node:test (node --test), qui exécute les fichiers
// directement sans passer par Babel/Metro. Toujours importable normalement dans l'app (import { x }
// from '@/utils/liens') : Metro fait l'interopérabilité CJS/ESM sans configuration supplémentaire.

function isLienHttp(value) {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

module.exports = { isLienHttp };

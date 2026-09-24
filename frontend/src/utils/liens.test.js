const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isLienHttp } = require('./liens');

const cas = [
  ['https://exemple.com/affiche.png', true],
  ['http://exemple.com/affiche.png', true],
  ['ftp://exemple.com/affiche.png', false],
  ['javascript:alert(1)', false],
  ['pas un lien', false],
  ['', false],
];
for (const [valeur, attendu] of cas) {
  test(`isLienHttp(${JSON.stringify(valeur)}) -> ${attendu}`, () => {
    assert.equal(isLienHttp(valeur), attendu);
  });
}

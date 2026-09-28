import { isLienHttp } from './liens';

describe('isLienHttp', () => {
  it.each([
    ['https://exemple.com/affiche.png', true],
    ['http://exemple.com/affiche.png', true],
    ['ftp://exemple.com/affiche.png', false],
    ['javascript:alert(1)', false],
    ['pas un lien', false],
    ['', false],
  ])('%s -> %s', (valeur, attendu) => {
    expect(isLienHttp(valeur)).toBe(attendu);
  });
});

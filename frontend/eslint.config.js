// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // eslint-config-expo (via son propre settings.import/resolver, plus tardif dans sa config que
    // celui qui active `typescript: true`) ne résout pas l'alias "@/" de jsconfig.json : tout import
    // "@/…" ressortait en `import/no-unresolved`. On le pointe explicitement vers src/, comme
    // jsconfig.json (seul alias du projet, pas besoin du résolveur TypeScript pour un projet JS).
    settings: {
      'import/resolver': {
        alias: {
          map: [['@', './src']],
          extensions: ['.js', '.jsx', '.json'],
        },
      },
    },
  },
  {
    // French oblige : les apostrophes ("l'événement", "J'ai déjà un compte"…) sont partout dans les
    // textes d'interface. Les échapper systématiquement (&apos;) nuirait à la lisibilité du JSX pour
    // un bénéfice de sécurité qui ne s'applique pas ici (pas de contenu HTML injecté).
    rules: {
      'react/no-unescaped-entities': 'off',
    },
  },
  {
    // Fichiers de test : globales de Jest (describe/it/expect/jest…), et import/first désactivé car
    // jest.mock(...) doit être visuellement avant les imports qu'il concerne (Babel le hisse au-dessus
    // des imports au moment de l'exécution ; le laisser après les imports serait trompeur).
    files: ['**/*.test.{js,jsx}'],
    languageOptions: {
      globals: globals.jest,
    },
    rules: {
      'import/first': 'off',
    },
  },
]);

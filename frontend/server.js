const path = require('node:path');
const express = require('express');
const { createRequestHandler } = require('@expo/server/adapter/express');

const CLIENT_BUILD_DIR = path.join(process.cwd(), 'dist/client');
const SERVER_BUILD_DIR = path.join(process.cwd(), 'dist/server');

const app = express();

app.use(
  express.static(CLIENT_BUILD_DIR, {
    maxAge: '1h',
    extensions: ['html'],
  })
);

app.use(createRequestHandler({ build: SERVER_BUILD_DIR }));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Serveur web Seats (SSR) démarré sur http://localhost:${port}`);
});

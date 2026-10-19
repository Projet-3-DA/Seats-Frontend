export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Socket.IO écoute à la racine du serveur, pas sous /api.
export const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

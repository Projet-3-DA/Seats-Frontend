import { Stack } from 'expo-router';

import { useAuth } from '@/lib/auth-context';

// Une fois connecté, les écrans d'authentification (connexion, inscription) deviennent inaccessibles :
// Expo Router retire alors toutes leurs entrées de l'historique, donc un retour arrière ne peut plus
// y ramener, et ouvrir directement /login redirige vers l'accueil. Tant que la session sauvegardée n'est
// pas relue, ils restent accessibles pour ne pas bloquer un utilisateur réellement déconnecté.
export function NavigationRacine() {
  const { user, chargementInitial } = useAuth();
  const connecte = !chargementInitial && Boolean(user);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!connecte}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

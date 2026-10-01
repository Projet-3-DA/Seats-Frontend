import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/lib/auth-context';

// Les pages organisateur appellent des routes réservées aux organisateurs : sans session, on renvoie
// au login ; connecté avec un autre rôle, on renvoie à la liste des événements.
export default function OrganisateurLayout() {
  const { user, chargementInitial } = useAuth();

  if (chargementInitial) {
    return (
      <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role !== 'organisateur') return <Redirect href="/(tabs)/events" />;

  return <Stack screenOptions={{ headerShown: true }} />;
}

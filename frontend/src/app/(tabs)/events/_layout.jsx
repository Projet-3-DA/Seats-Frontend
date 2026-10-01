import { Stack } from 'expo-router';

export default function EventsStackLayout() {
  // La liste n'a pas d'en-tête (l'onglet porte déjà le nom et l'écran son titre) ; le plan de salle en a un,
  // avec le bouton retour.
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Plan de salle' }} />
    </Stack>
  );
}

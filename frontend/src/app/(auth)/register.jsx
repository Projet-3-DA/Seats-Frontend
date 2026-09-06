import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function RegisterScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Créer un compte</ThemedText>
      <ThemedText themeColor="textSecondary">
        Formulaire d'inscription (courriel, mot de passe, rôle) à implémenter (récit #1).
      </ThemedText>

      <Link href="/(auth)/login">
        <ThemedText type="link">J'ai déjà un compte</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
});

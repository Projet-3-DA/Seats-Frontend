import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function LoginScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Connexion</ThemedText>
      <ThemedText themeColor="textSecondary">Formulaire de connexion à implémenter (récit #1).</ThemedText>

      <Link href="/(auth)/register">
        <ThemedText type="link">Créer un compte</ThemedText>
      </Link>
      <Link href="/(tabs)/events">
        <ThemedText type="link">Continuer sans se connecter (démo)</ThemedText>
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

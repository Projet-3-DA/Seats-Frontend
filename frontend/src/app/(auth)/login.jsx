import { useState } from 'react';
import { Link, router } from 'expo-router';
import { ActivityIndicator, Image, Pressable, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { Spacing } from '@/constants/theme';

export default function LoginScreen() {
  const theme = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erreur, setErreur] = useState(null);
  const [enCours, setEnCours] = useState(false);

  async function handleLogin() {
    setErreur(null);
    setEnCours(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)/events');
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <Image source={require('../../../assets/images/icon.png')} style={styles.logo} />
      <ThemedText type="title" style={styles.titre}>
        Seats
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.tagline}>
        Réservez vos places pour vos spectacles préférés en quelques clics.
      </ThemedText>

      <ThemedView type="backgroundElement" style={styles.carte}>
        <ThemedText type="subtitle" style={styles.carteTitle}>
          Se connecter
        </ThemedText>

        <ThemedText type="smallBold">Adresse email</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: theme.backgroundSelected, color: theme.text }]}
          placeholder="votre@email.com"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <ThemedText type="smallBold">Mot de passe</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: theme.backgroundSelected, color: theme.text }]}
          placeholder="••••••••"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {erreur && (
          <ThemedText type="small" style={styles.erreur}>
            {erreur}
          </ThemedText>
        )}

        <Pressable
          style={[styles.bouton, { backgroundColor: theme.primary }]}
          onPress={handleLogin}
          disabled={enCours}
        >
          {enCours ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.boutonTexte}>Se connecter</ThemedText>}
        </Pressable>
      </ThemedView>

      <ThemedText type="small" themeColor="textSecondary">
        Nouveau sur Seats ?{' '}
        <Link href="/(auth)/register">
          <ThemedText type="linkPrimary" style={{ color: theme.primary }}>
            Créer un compte
          </ThemedText>
        </Link>
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  logo: { width: 56, height: 56, borderRadius: 14, marginBottom: Spacing.one },
  titre: { fontSize: 24, marginBottom: Spacing.half },
  tagline: { textAlign: 'center', marginBottom: Spacing.four, maxWidth: 280 },
  carte: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  carteTitle: { marginBottom: Spacing.two },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  erreur: { color: '#ef4444' },
  bouton: {
    paddingVertical: Spacing.three,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  boutonTexte: { color: '#fff', fontWeight: '600' },
});
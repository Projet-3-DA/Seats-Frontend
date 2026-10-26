import { useEffect, useRef, useState } from 'react';
import { Link, router } from 'expo-router';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { lireEtEffacerFragment } from '@/utils/fragment-url';

// Retour d'une connexion externe : le backend redirige ici avec #token=<JWT> ou #erreur=<message>.
// Le fragment (#) n'est jamais envoyé à un serveur ; il est effacé de l'URL dès qu'il est lu.
export default function ConnexionExterneScreen() {
  const theme = useTheme();
  const { loginAvecToken } = useAuth();
  const [erreur, setErreur] = useState(null);

  // Le fragment est effacé dès sa lecture : une deuxième exécution de l'effet ne trouverait plus le token.
  const dejaLu = useRef(false);

  useEffect(() => {
    if (dejaLu.current) return;
    dejaLu.current = true;

    const params = lireEtEffacerFragment();
    const token = params.get('token');
    const connexion = token
      ? loginAvecToken(token)
      : Promise.reject(new Error(params.get('erreur') || 'Connexion impossible, veuillez réessayer.'));
    connexion.then(() => router.replace('/(tabs)/events')).catch((err) => setErreur(err.message));
  }, [loginAvecToken]);

  return (
    <ThemedView style={styles.container}>
      {erreur ? (
        <>
          <ThemedText style={styles.erreur}>{erreur}</ThemedText>
          <Link href="/(auth)/login">
            <ThemedText type="linkPrimary" style={{ color: theme.primary }}>
              Retour à la connexion
            </ThemedText>
          </Link>
        </>
      ) : (
        <>
          <ActivityIndicator color={theme.primary} />
          <ThemedText themeColor="textSecondary">Connexion en cours…</ThemedText>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, padding: Spacing.four },
  erreur: { color: '#ef4444', textAlign: 'center' },
});

import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/hooks/use-theme';

const LIBELLE_ROLE = {
  spectateur: 'Spectateur',
  organisateur: 'Organisateur',
  administrateur: 'Administrateur',
};

export default function ProfilScreen() {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const router = useRouter();

  async function handleDeconnexion() {
    await logout();
    router.replace('/(auth)/login');
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Profil</ThemedText>

      <View style={[styles.carte, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.ligne}>
          <ThemedText type="small" themeColor="textSecondary">Nom</ThemedText>
          <ThemedText type="smallBold">{user?.prenom} {user?.nom}</ThemedText>
        </View>
        <View style={styles.ligne}>
          <ThemedText type="small" themeColor="textSecondary">Email</ThemedText>
          <ThemedText type="smallBold">{user?.email}</ThemedText>
        </View>
        <View style={styles.ligne}>
          <ThemedText type="small" themeColor="textSecondary">Rôle</ThemedText>
          <ThemedText type="smallBold">{LIBELLE_ROLE[user?.role] ?? user?.role}</ThemedText>
        </View>
      </View>

      <Pressable
        onPress={handleDeconnexion}
        style={[styles.bouton, { borderColor: theme.error }]}
      >
        <ThemedText type="smallBold" style={{ color: theme.error }}>Se déconnecter</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.four, gap: Spacing.four },
  carte: { borderWidth: 1, borderRadius: 12, padding: Spacing.three, gap: Spacing.three },
  ligne: { gap: 2 },
  bouton: { borderWidth: 1, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
});

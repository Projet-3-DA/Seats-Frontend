import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function Carte({ icone, titre, description, onPress }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.carte, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
    >
      <View style={[styles.carteIcone, { backgroundColor: theme.background }]}>
        <Feather name={icone} size={22} color={theme.primary} />
      </View>
      <View style={styles.carteTexte}>
        <ThemedText type="smallBold">{titre}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">{description}</ThemedText>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
  );
}

export default function OrganisateurScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Organiser</ThemedText>

      <Carte
        icone="layout"
        titre="Créer une salle"
        description="Configurer les rangées et les sièges d'un nouvel espace."
        onPress={() => router.push('/organisateur/salles/nouvelle')}
      />
      <Carte
        icone="calendar"
        titre="Créer un événement"
        description="Programmer une séance dans l'une de vos salles."
        onPress={() => router.push('/organisateur/evenements/nouveau')}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.four, gap: Spacing.three },
  carte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
  },
  carteIcone: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carteTexte: { flex: 1, gap: 2 },
});

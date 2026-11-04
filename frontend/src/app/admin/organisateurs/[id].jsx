import { Feather } from '@expo/vector-icons';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_URL } from '@/constants/api';
import { MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { formatDateHeure } from '@/utils/dates';
import { capaciteSalle } from '@/utils/salle';

function Info({ icone, children, theme }) {
  return (
    <View style={styles.info}>
      <Feather name={icone} size={16} color={theme.textSecondary} />
      <ThemedText style={styles.infoTexte}>{children}</ThemedText>
    </View>
  );
}

function Chiffre({ label, valeur, theme }) {
  return (
    <View
      accessible
      accessibilityLabel={`${label} : ${valeur}`}
      style={[styles.chiffre, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
    >
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText style={styles.chiffreValeur}>{valeur}</ThemedText>
    </View>
  );
}

// Détail d'un organisateur pour l'administrateur (#19 du backlog) : ses salles et ses événements,
// chaque événement menant à son propre détail (#36).
export default function DetailOrganisateurAdminScreen() {
  const { id } = useLocalSearchParams();
  const { token } = useAuth();
  const theme = useTheme();
  const [organisateur, setOrganisateur] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    if (!token) return undefined;

    let annule = false;
    async function charger() {
      try {
        const res = await fetch(`${API_URL}/admin/organisateurs/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Échec du chargement de l'organisateur.");
        if (!annule) setOrganisateur(json.data);
      } catch (err) {
        if (!annule) setErreur(err.message || "Échec du chargement de l'organisateur.");
      }
    }
    charger();
    return () => {
      annule = true;
    };
  }, [id, token]);

  if (!organisateur) {
    return (
      <ThemedView style={styles.center}>
        <Stack.Screen options={{ title: 'Organisateur' }} />
        {erreur ? (
          <ThemedText style={styles.erreur}>{erreur}</ThemedText>
        ) : (
          <ActivityIndicator color={theme.primary} />
        )}
      </ThemedView>
    );
  }

  const { salles, evenements } = organisateur;

  return (
    <ScrollView contentContainerStyle={styles.scroll} style={{ backgroundColor: theme.background }}>
      <Stack.Screen options={{ title: 'Organisateur' }} />
      <View style={[styles.page, { maxWidth: MaxContentWidth }]}>
        <ThemedText style={styles.titre}>{`${organisateur.prenom} ${organisateur.nom}`}</ThemedText>

        <View style={styles.infos}>
          <Info icone="mail" theme={theme}>
            {organisateur.email}
          </Info>
          <Info icone="clock" theme={theme}>
            {`Inscrit le ${formatDateHeure(organisateur.createdAt)}`}
          </Info>
        </View>

        <View style={styles.chiffres}>
          <Chiffre label="Événements" valeur={organisateur.nombreEvenements} theme={theme} />
          <Chiffre label="Salles" valeur={organisateur.nombreSalles} theme={theme} />
        </View>

        <View style={styles.section}>
          <ThemedText type="smallBold">Événements</ThemedText>
          {evenements.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              Aucun événement créé.
            </ThemedText>
          ) : (
            evenements.map((e) => (
              <Link key={e.id} href={`/admin/evenements/${e.id}`} asChild>
                <Pressable
                  accessibilityLabel={`Voir le détail de ${e.titre}`}
                  style={[styles.ligne, { borderColor: theme.border }]}
                >
                  <View style={styles.ligneTexte}>
                    <View style={styles.titreRow}>
                      <ThemedText type="smallBold">{e.titre}</ThemedText>
                      {e.terminee && (
                        <View style={[styles.badge, { borderColor: theme.border }]}>
                          <ThemedText type="small" themeColor="textSecondary">
                            Terminé
                          </ThemedText>
                        </View>
                      )}
                    </View>
                    <ThemedText type="small" themeColor="textSecondary">
                      {`${formatDateHeure(e.dateHeure)} · ${e.salle.nom}`}
                    </ThemedText>
                  </View>
                  <Feather name="chevron-right" size={18} color={theme.textSecondary} />
                </Pressable>
              </Link>
            ))
          )}
        </View>

        <View style={styles.section}>
          <ThemedText type="smallBold">Salles</ThemedText>
          {salles.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              Aucune salle créée.
            </ThemedText>
          ) : (
            salles.map((s) => (
              <View key={s.id} style={[styles.ligne, { borderColor: theme.border }]}>
                <View style={styles.ligneTexte}>
                  <ThemedText type="smallBold">{s.nom}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {`${s.nombreRangees} rangées × ${s.siegesParRangee} sièges · ${capaciteSalle(s)} places`}
                  </ThemedText>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scroll: { flexGrow: 1, alignItems: 'center' },
  page: { width: '100%', padding: 24, gap: 24 },
  titre: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  infos: { gap: 8 },
  info: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoTexte: { flex: 1 },
  chiffres: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chiffre: { flexGrow: 1, flexBasis: 140, borderWidth: 1, borderRadius: 12, padding: 16, gap: 4 },
  chiffreValeur: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  section: { gap: 12 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, paddingBottom: 8 },
  ligneTexte: { flex: 1, gap: 2 },
  titreRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  badge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8 },
  erreur: { color: '#DC2626', textAlign: 'center' },
});

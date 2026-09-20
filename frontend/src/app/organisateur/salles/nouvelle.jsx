import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';

import { API_URL } from '@/constants/api';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// ponytail: cap la grille de prévisualisation pour éviter de rendre des milliers de sièges.
const MAX_APERCU = 26;
// ponytail: seuil arbitraire desktop/mobile, à raffiner si un vrai design system de breakpoints arrive.
const DESKTOP_BREAKPOINT = 700;
// ponytail: pas d'auth branchée côté frontend (récit #1 pas fait) donc pas d'ID d'organisateur réel.
// À remplacer par l'utilisateur connecté une fois le login en place.
const DEMO_ORGANISATEUR_ID = 1;

function toCount(value) {
  const n = parseInt(value, 10);
  return Number.isNaN(n) || n < 0 ? 0 : n;
}

function rowLabel(index) {
  return index < 26 ? String.fromCharCode(65 + index) : String(index + 1);
}

export default function NouvelleSalleScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  const [nom, setNom] = useState('Studio Multimédia Cégep');
  const [rangees, setRangees] = useState('5');
  const [siegesParRangee, setSiegesParRangee] = useState('10');
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  const nbRangees = toCount(rangees);
  const nbSieges = toCount(siegesParRangee);
  const total = nbRangees * nbSieges;

  const nomManquant = nom.trim().length === 0;
  const sansSiege = total === 0;
  const isValid = !nomManquant && !sansSiege;

  const rows = useMemo(
    () => Array.from({ length: Math.min(nbRangees, MAX_APERCU) }, (_, i) => rowLabel(i)),
    [nbRangees],
  );
  const seatCols = useMemo(
    () => Array.from({ length: Math.min(nbSieges, MAX_APERCU) }, (_, i) => i + 1),
    [nbSieges],
  );

  async function handleEnregistrer() {
    if (!isValid || saving) return;
    setSaving(true);
    setApiError('');
    try {
      const res = await fetch(`${API_URL}/salles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organisateurId: DEMO_ORGANISATEUR_ID,
          nom: nom.trim(),
          nombreRangees: nbRangees,
          siegesParRangee: nbSieges,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Échec de la création de la salle.');
      }
      router.back();
    } catch (err) {
      setApiError(err.message || 'Échec de la création de la salle.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <ThemedView style={styles.page}>
        <View style={[styles.wrapper, { maxWidth: MaxContentWidth }]}>
          <ThemedText style={styles.heading}>Créer une salle</ThemedText>
          <ThemedText themeColor="textSecondary">Configurez la structure des rangées et des sièges.</ThemedText>

          <View style={[styles.cards, isDesktop && styles.cardsRow]}>
            <View
              style={[
                styles.card,
                isDesktop && styles.cardFlex,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}
            >
              <ThemedText type="smallBold">Nom de la salle</ThemedText>
              <TextInput
                value={nom}
                onChangeText={setNom}
                placeholder="Nom de la salle"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
              />

              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <ThemedText type="smallBold">Rangées</ThemedText>
                  <TextInput
                    value={rangees}
                    onChangeText={setRangees}
                    keyboardType="number-pad"
                    style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                  />
                </View>
                <View style={styles.rowItem}>
                  <ThemedText type="smallBold">Sièges / Rangée</ThemedText>
                  <TextInput
                    value={siegesParRangee}
                    onChangeText={setSiegesParRangee}
                    keyboardType="number-pad"
                    style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                  />
                </View>
              </View>

              {sansSiege && (
                <ThemedText type="small" style={styles.error}>
                  Une salle sans aucun siège ne peut pas être enregistrée.
                </ThemedText>
              )}
              {!sansSiege && nomManquant && (
                <ThemedText type="small" style={styles.error}>
                  Le nom de la salle est requis.
                </ThemedText>
              )}
              {apiError.length > 0 && (
                <ThemedText type="small" style={styles.error}>
                  {apiError}
                </ThemedText>
              )}

              <Pressable
                onPress={handleEnregistrer}
                disabled={!isValid || saving}
                style={[styles.button, { backgroundColor: theme.primary, opacity: isValid && !saving ? 1 : 0.5 }]}
              >
                <ThemedText type="smallBold" style={styles.buttonTextPrimary}>
                  {saving ? 'Enregistrement…' : 'Enregistrer la salle'}
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => router.back()}
                disabled={saving}
                style={[styles.button, styles.buttonSecondary, { borderColor: theme.border }]}
              >
                <ThemedText type="smallBold">Annuler</ThemedText>
              </Pressable>
            </View>

            <View
              style={[
                styles.card,
                isDesktop && styles.cardFlex,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}
            >
              <ThemedText type="smallBold" style={styles.center}>
                Aperçu dynamique de la salle
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                Une grille de {total} sièges générée automatiquement.
              </ThemedText>

              <View style={styles.scene}>
                <View style={[styles.sceneLine, { backgroundColor: theme.border }]} />
                <ThemedText type="small" themeColor="textSecondary">
                  SCÈNE
                </ThemedText>
                <View style={[styles.sceneLine, { backgroundColor: theme.border }]} />
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.seatsView}>
                <View style={styles.grid}>
                  {rows.map((label) => (
                    <View key={label} style={styles.seatRow}>
                      <ThemedText type="small" themeColor="textSecondary" style={styles.seatRowLabel}>
                        {label}
                      </ThemedText>
                      {seatCols.map((n) => (
                        <View key={n} style={[styles.seat, { borderColor: theme.primary }]}>
                          <ThemedText type="small" style={{ color: theme.primary, fontSize: 11 }}>
                            {n}
                          </ThemedText>
                        </View>
                      ))}
                      <ThemedText type="small" themeColor="textSecondary" style={styles.seatRowLabel}>
                        {label}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.legend}>
                <View style={[styles.seat, { borderColor: theme.primary }]} />
                <ThemedText type="small" themeColor="textSecondary">
                  Siège disponible
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  seatsView: { paddingBottom: 8 },
  scroll: { flexGrow: 1 },
  page: { flex: 1, alignItems: 'center', padding: 24 },
  wrapper: { width: '100%', gap: 16 },
  heading: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  cards: { gap: 16 },
  cardsRow: { flexDirection: 'row', alignItems: 'flex-start' },
  card: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 12 },
  cardFlex: { flex: 1 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  row: { flexDirection: 'row', gap: 12 },
  rowItem: { flex: 1, gap: 8 },
  error: { color: '#DC2626' },
  button: { borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  buttonSecondary: { borderWidth: 1 },
  buttonTextPrimary: { color: '#ffffff' },
  center: { textAlign: 'center' },
  scene: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sceneLine: { flex: 1, height: 2, borderRadius: 1 },
  grid: { gap: 4 },
  seatRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seatRowLabel: { width: 16, textAlign: 'center' },
  seat: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 4 },
});

import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { API_URL } from '@/constants/api';
import { Affiche } from '@/components/affiche';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { parseDateHeure } from '@/utils/dates';
import { isLienHttp } from '@/utils/liens';
import { capaciteSalle } from '@/utils/salle';

// ponytail: pas d'auth branchée côté frontend (récit #1 pas fait) donc pas d'ID d'organisateur réel.
// À remplacer par l'utilisateur connecté une fois le login en place.
const DEMO_ORGANISATEUR_ID = 1;
// Même limite que le backend (express.raw, 5 Mo) : on refuse avant d'envoyer.
const MAX_AFFICHE_OCTETS = 5 * 1024 * 1024;

// Sans fichier ni lien, on prend une image aléatoire de picsum.photos. Avec /seed/<graine>, la même
// graine redonne toujours la même image : sans graine, l'adresse en renverrait une autre à chaque affichage.
function nouvelleGraine() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function urlImageAleatoire(graine) {
  return `https://picsum.photos/seed/${graine}/600/900`;
}

// Accepte "25", "25,5" ou "25.50" : 6 chiffres avant la virgule et 2 après au plus (Decimal(8,2) en base).
function parseTarif(texte) {
  const t = texte.trim().replace(',', '.');
  return /^\d{1,6}(\.\d{1,2})?$/.test(t) ? Number(t) : null;
}

function Champ({ label, erreur, children }) {
  return (
    <View style={styles.champ}>
      <ThemedText type="smallBold">{label}</ThemedText>
      {children}
      {erreur ? (
        <ThemedText type="small" style={styles.error}>
          {erreur}
        </ThemedText>
      ) : null}
    </View>
  );
}

export default function NouvelEvenementScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [heure, setHeure] = useState('');
  const [fichier, setFichier] = useState(null);
  const [lien, setLien] = useState('');
  const [graine, setGraine] = useState(null);
  const [tarifTexte, setTarifTexte] = useState('');
  const [salleId, setSalleId] = useState(null);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [tentative, setTentative] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  const [salles, setSalles] = useState([]);
  const [sallesLoading, setSallesLoading] = useState(true);
  const [sallesError, setSallesError] = useState('');

  useEffect(() => {
    setGraine(nouvelleGraine());
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_URL}/salles`);
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Échec du chargement des salles.');
        // ponytail: le backend renvoie toutes les salles, on garde celles de l'organisateur ici.
        // À faire côté serveur (req.user.id) une fois l'auth en place.
        if (!cancelled) setSalles(json.data.filter((s) => s.organisateurId === DEMO_ORGANISATEUR_ID));
      } catch (err) {
        if (!cancelled) setSallesError(err.message || 'Échec du chargement des salles.');
      } finally {
        if (!cancelled) setSallesLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const salle = salles.find((s) => s.id === salleId);
  const dateHeure = parseDateHeure(date, heure);
  const dateVide = date.trim().length === 0 || heure.trim().length === 0;
  const tarif = parseTarif(tarifTexte);
  const tarifVide = tarifTexte.trim().length === 0;
  const erreurs = {
    titre: titre.trim().length === 0 ? 'Le titre est requis.' : '',
    date: dateVide
      ? "La date et l'heure sont requises."
      : !dateHeure
        ? 'Format attendu : JJ/MM/AAAA et HH:MM.'
        : dateHeure <= new Date()
          ? 'Cette date est déjà passée.'
          : '',
    salle: salleId === null ? "Choisissez une salle pour l'événement." : '',
    tarif: tarifVide ? 'Le tarif est requis (0 si gratuit).' : tarif === null ? 'Montant invalide (ex. 25 ou 25,50).' : '',
    affiche: lien.trim().length > 0 && !isLienHttp(lien.trim()) ? 'Le lien doit commencer par http:// ou https://.' : '',
  };
  const isValid = !erreurs.titre && !erreurs.date && !erreurs.salle && !erreurs.tarif && !erreurs.affiche;
  const lienValide = isLienHttp(lien.trim());
  const apercuAffiche = fichier
    ? fichier.uri
    : lienValide
      ? lien.trim()
      : lien.trim().length === 0 && graine
        ? urlImageAleatoire(graine)
        : null;

  async function handleChoisirFichier() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (result.canceled) return;
      setFichier(result.assets[0]);
      setLien('');
    } catch (err) {
      setApiError(`Impossible d'ouvrir la sélection d'image : ${err.message}`);
    }
  }

  function handleChangerLien(texte) {
    setLien(texte);
    setFichier(null);
  }

  // Envoie le fichier choisi au backend (qui le range dans Supabase Storage) et renvoie son URL publique.
  async function televerserAffiche() {
    const blob = await (await fetch(fichier.uri)).blob();
    if (blob.size > MAX_AFFICHE_OCTETS) throw new Error("L'image dépasse 5 Mo.");
    const res = await fetch(`${API_URL}/evenements/affiche`, {
      method: 'POST',
      headers: { 'Content-Type': fichier.mimeType || blob.type || 'image/jpeg' },
      body: blob,
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || "Échec de l'envoi de l'image.");
    return json.data.url;
  }

  async function handlePublier() {
    if (saving) return;
    setTentative(true);
    if (!isValid) return;
    setSaving(true);
    setApiError('');
    try {
      const afficheUrl = fichier
        ? await televerserAffiche()
        : lien.trim() || urlImageAleatoire(graine ?? nouvelleGraine());
      const res = await fetch(`${API_URL}/evenements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organisateurId: DEMO_ORGANISATEUR_ID,
          salleId,
          titre: titre.trim(),
          description: description.trim(),
          dateHeure: dateHeure.toISOString(),
          tarif,
          afficheUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Échec de la création de l'événement.");
      }
      router.back();
    } catch (err) {
      setApiError(err.message || "Échec de la création de l'événement.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = [styles.input, { borderColor: theme.border, color: theme.text }];

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <ThemedView style={styles.page}>
        <View style={[styles.wrapper, { maxWidth: MaxContentWidth }]}>
          <ThemedText style={styles.heading}>Créer un événement</ThemedText>
          <ThemedText themeColor="textSecondary">Publiez une nouvelle date et mettez en vente.</ThemedText>

          <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText type="smallBold" style={styles.cardTitle}>
              Informations générales
            </ThemedText>

            <Champ label="Titre du spectacle" erreur={tentative ? erreurs.titre : ''}>
              <TextInput
                value={titre}
                onChangeText={setTitre}
                placeholder="Festival de Jazz — Session d'improvisation"
                placeholderTextColor={theme.textSecondary}
                style={inputStyle}
              />
            </Champ>

            <Champ label="Description de l'événement">
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Décrivez l'événement (facultatif)"
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={[...inputStyle, styles.textarea]}
              />
            </Champ>

            <Champ label="Affiche de l'événement (facultatif)" erreur={erreurs.affiche}>
              <View style={styles.afficheRow}>
                <Affiche uri={apercuAffiche} style={styles.affichePreview} />
                <View style={styles.afficheControles}>
                  <Pressable
                    onPress={handleChoisirFichier}
                    disabled={saving}
                    style={[styles.choisirFichier, { borderColor: theme.border }]}
                  >
                    <Feather name="upload" size={16} color={theme.text} />
                    <ThemedText type="smallBold">Choisir un fichier</ThemedText>
                  </Pressable>
                  {fichier ? (
                    <View style={styles.fichierRow}>
                      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.fichierNom}>
                        {fichier.fileName || 'Image sélectionnée'}
                      </ThemedText>
                      <Pressable onPress={() => setFichier(null)} disabled={saving} hitSlop={8}>
                        <Feather name="x" size={16} color={theme.textSecondary} />
                      </Pressable>
                    </View>
                  ) : (
                    <TextInput
                      value={lien}
                      onChangeText={handleChangerLien}
                      placeholder="…ou collez un lien https://"
                      placeholderTextColor={theme.textSecondary}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="url"
                      style={inputStyle}
                    />
                  )}
                  {!fichier && lien.trim().length === 0 && (
                    <ThemedText type="small" themeColor="textSecondary">
                      Sans fichier ni lien, une image aléatoire sera utilisée.
                    </ThemedText>
                  )}
                </View>
              </View>
            </Champ>

            <Champ label="Date et heure" erreur={tentative || !dateVide ? erreurs.date : ''}>
              <View style={styles.row}>
                <View style={[styles.iconInput, styles.dateInput, { borderColor: theme.border }]}>
                  <Feather name="calendar" size={16} color={theme.textSecondary} />
                  <TextInput
                    value={date}
                    onChangeText={setDate}
                    placeholder="28/10/2026"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.iconInputText, { color: theme.text }]}
                  />
                </View>
                <View style={[styles.iconInput, styles.heureInput, { borderColor: theme.border }]}>
                  <Feather name="clock" size={16} color={theme.textSecondary} />
                  <TextInput
                    value={heure}
                    onChangeText={setHeure}
                    placeholder="20:00"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.iconInputText, { color: theme.text }]}
                  />
                </View>
              </View>
            </Champ>

            <Champ label="Choisir la salle" erreur={tentative ? erreurs.salle : ''}>
              {sallesLoading ? (
                <ActivityIndicator color={theme.primary} />
              ) : sallesError.length > 0 ? (
                <ThemedText type="small" style={styles.error}>
                  {sallesError}
                </ThemedText>
              ) : salles.length === 0 ? (
                <View style={styles.aucuneSalle}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Vous n'avez encore créé aucune salle.
                  </ThemedText>
                  <Link href="/organisateur/salles/nouvelle">
                    <ThemedText type="link" style={{ color: theme.primary }}>
                      Créer une salle
                    </ThemedText>
                  </Link>
                </View>
              ) : (
                <View>
                  <Pressable
                    onPress={() => setMenuOuvert((ouvert) => !ouvert)}
                    style={[styles.select, { borderColor: theme.border }]}
                  >
                    <ThemedText style={styles.selectText} themeColor={salle ? 'text' : 'textSecondary'}>
                      {salle ? `${salle.nom} (${capaciteSalle(salle)} pl.)` : 'Choisir une salle…'}
                    </ThemedText>
                    <Feather name={menuOuvert ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textSecondary} />
                  </Pressable>
                  {menuOuvert && (
                    <View style={[styles.menu, { borderColor: theme.border, backgroundColor: theme.background }]}>
                      {salles.map((s) => (
                        <Pressable
                          key={s.id}
                          onPress={() => {
                            setSalleId(s.id);
                            setMenuOuvert(false);
                          }}
                          style={[styles.option, s.id === salleId && { backgroundColor: theme.backgroundSelected }]}
                        >
                          <ThemedText type="small" style={styles.selectText}>
                            {s.nom} ({capaciteSalle(s)} pl.)
                          </ThemedText>
                          {s.id === salleId && <Feather name="check" size={16} color={theme.primary} />}
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </Champ>

            <Champ label="Tarif unique de la place ($ CAD)" erreur={tentative || !tarifVide ? erreurs.tarif : ''}>
              <View style={[styles.iconInput, { borderColor: theme.border }]}>
                <Feather name="dollar-sign" size={16} color={theme.textSecondary} />
                <TextInput
                  value={tarifTexte}
                  onChangeText={setTarifTexte}
                  placeholder="25,00"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="decimal-pad"
                  style={[styles.iconInputText, { color: theme.text }]}
                />
              </View>
            </Champ>

            {apiError.length > 0 && (
              <ThemedText type="small" style={styles.error}>
                {apiError}
              </ThemedText>
            )}

            <View style={[styles.separator, { backgroundColor: theme.border }]} />

            <Pressable
              onPress={handlePublier}
              disabled={saving}
              style={[styles.button, { backgroundColor: theme.primary, opacity: saving ? 0.5 : 1 }]}
            >
              <ThemedText type="smallBold" style={styles.buttonTextPrimary}>
                {saving ? 'Publication…' : "Publier l'événement"}
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
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  page: { flex: 1, alignItems: 'center', padding: 24 },
  wrapper: { width: '100%', gap: 16 },
  heading: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 16 },
  cardTitle: { fontSize: 18 },
  champ: { gap: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  textarea: { minHeight: 100 },
  afficheRow: { flexDirection: 'row', gap: 12 },
  affichePreview: { width: 96, height: 144 },
  afficheControles: { flex: 1, gap: 8 },
  choisirFichier: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 8, paddingVertical: 10 },
  fichierRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fichierNom: { flex: 1 },
  row: { flexDirection: 'row', gap: 12 },
  iconInput: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12 },
  iconInputText: { flex: 1, paddingVertical: 12, fontSize: 16 },
  dateInput: { flex: 3 },
  heureInput: { flex: 2 },
  select: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 8, padding: 12 },
  selectText: { flex: 1 },
  menu: { borderWidth: 1, borderRadius: 8, marginTop: 4, overflow: 'hidden' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 12 },
  aucuneSalle: { gap: 4 },
  error: { color: '#DC2626' },
  separator: { height: 1 },
  button: { borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  buttonSecondary: { borderWidth: 1 },
  buttonTextPrimary: { color: '#ffffff' },
});

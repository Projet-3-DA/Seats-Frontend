import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_URL } from '@/constants/api';
import { MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { groupSiegesParRangee, lettreRangee } from '@/utils/salle';
import { preparerSections, prochaineCouleur } from '@/utils/sections';
import { formatMontant, parseTarif } from '@/utils/tarif';

// Sections tarifaires d'une salle (#11) : l'organisateur crée des sections (nom, prix) et leur assigne
// des groupes de sièges. Un siège appartient à une seule section ; hors section, il est vendu au tarif
// de l'événement. Modifiable seulement tant qu'aucun événement n'utilise la salle (même règle que #10).

let compteurCles = 0;
const nouvelleCle = () => `nouvelle-${++compteurCles}`;

export default function SectionsSalleScreen() {
  const { id } = useLocalSearchParams();
  const { token } = useAuth();
  const theme = useTheme();

  const [salle, setSalle] = useState(null);
  const [erreurChargement, setErreurChargement] = useState('');
  const [sections, setSections] = useState([]); // { cle, nom, prixTexte, couleur }
  const [assignation, setAssignation] = useState(new Map()); // id du siège → clé de sa section
  const [active, setActive] = useState(null); // clé de la section en cours d'assignation, null = gomme
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  useEffect(() => {
    let annule = false;
    async function charger() {
      try {
        const res = await fetch(`${API_URL}/salles/${id}`);
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Échec du chargement de la salle.');
        if (annule) return;
        const s = json.data;
        setSalle(s);
        const existantes = (s.sections ?? []).map((sec) => ({
          cle: `section-${sec.id}`,
          nom: sec.nom,
          prixTexte: String(sec.prix).replace('.', ','),
          couleur: sec.couleur,
        }));
        setSections(existantes);
        setAssignation(new Map(s.sieges.filter((sg) => sg.sectionId).map((sg) => [sg.id, `section-${sg.sectionId}`])));
        setActive(existantes[0]?.cle ?? null);
      } catch (err) {
        if (!annule) setErreurChargement(err.message || 'Échec du chargement de la salle.');
      }
    }
    charger();
    return () => {
      annule = true;
    };
  }, [id]);

  if (!salle) {
    return (
      <ThemedView style={styles.center}>
        <Stack.Screen options={{ title: 'Sections tarifaires' }} />
        {erreurChargement ? (
          <ThemedText style={styles.erreur}>{erreurChargement}</ThemedText>
        ) : (
          <ActivityIndicator color={theme.primary} />
        )}
      </ThemedView>
    );
  }

  const verrouillee = (salle._count?.evenements ?? 0) > 0;
  const sectionParCle = new Map(sections.map((s) => [s.cle, s]));
  const { rangees, numerosRangees } = groupSiegesParRangee(
    salle.sieges.map((s) => ({ ...s, rangee: s.numeroRangee, colonne: s.numeroColonne })),
  );
  const nombreParSection = (cle) => [...assignation.values()].filter((c) => c === cle).length;
  const horsSection = salle.sieges.length - assignation.size;

  function modifier(cle, champs) {
    setSucces('');
    setSections((precedentes) => precedentes.map((s) => (s.cle === cle ? { ...s, ...champs } : s)));
  }

  function ajouterSection() {
    setSucces('');
    const section = {
      cle: nouvelleCle(),
      nom: `Section ${sections.length + 1}`,
      prixTexte: '',
      couleur: prochaineCouleur(sections),
    };
    setSections((precedentes) => [...precedentes, section]);
    setActive(section.cle);
  }

  function supprimerSection(cle) {
    setSucces('');
    setSections((precedentes) => precedentes.filter((s) => s.cle !== cle));
    setAssignation((precedente) => new Map([...precedente].filter(([, c]) => c !== cle)));
    if (active === cle) setActive(null);
  }

  // Assigne (ou retire, avec la gomme) une liste de sièges. Un seul siège déjà dans la section active est
  // retiré : toucher deux fois un siège annule l'assignation.
  function assigner(siegeIds) {
    if (verrouillee) return;
    setSucces('');
    setAssignation((precedente) => {
      const suivante = new Map(precedente);
      const basculer = siegeIds.length === 1 && active && precedente.get(siegeIds[0]) === active;
      siegeIds.forEach((sid) => {
        if (active === null || basculer) suivante.delete(sid);
        else suivante.set(sid, active);
      });
      return suivante;
    });
  }

  async function enregistrer() {
    if (enregistrement) return;
    setErreur('');
    setSucces('');
    const { erreur: erreurLocale, sections: corps } = preparerSections(sections, assignation, parseTarif);
    if (erreurLocale) {
      setErreur(erreurLocale);
      return;
    }
    setEnregistrement(true);
    try {
      const res = await fetch(`${API_URL}/salles/${id}/sections`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sections: corps }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Échec de l'enregistrement des sections.");
      // Les clés locales deviennent les identifiants enregistrés par le serveur.
      const parNom = new Map(json.data.sections.map((s) => [s.nom, s]));
      const correspondance = new Map(sections.map((s) => [s.cle, `section-${parNom.get(s.nom.trim())?.id}`]));
      setSections((precedentes) => precedentes.map((s) => ({ ...s, cle: correspondance.get(s.cle), nom: s.nom.trim() })));
      setAssignation((precedente) => new Map([...precedente].map(([sid, cle]) => [sid, correspondance.get(cle)])));
      setActive((precedente) => (precedente ? correspondance.get(precedente) : null));
      setSucces('Sections enregistrées.');
    } catch (err) {
      setErreur(err.message || "Échec de l'enregistrement des sections.");
    } finally {
      setEnregistrement(false);
    }
  }

  const champStyle = [styles.champ, { borderColor: theme.border, color: theme.text }];

  return (
    <ScrollView contentContainerStyle={styles.scroll} style={{ backgroundColor: theme.background }}>
      <Stack.Screen options={{ title: 'Sections tarifaires' }} />
      <View style={[styles.page, { maxWidth: MaxContentWidth }]}>
        <View style={styles.entete}>
          <ThemedText style={styles.titre}>{salle.nom}</ThemedText>
          <ThemedText themeColor="textSecondary">
            Divisez la salle en sections à tarifs différents. Un siège hors section est vendu au tarif de
            l'événement.
          </ThemedText>
          {verrouillee && (
            <ThemedText style={styles.erreur}>
              Cette salle est déjà utilisée par un événement : ses sections ne peuvent plus être modifiées.
            </ThemedText>
          )}
        </View>

        <View style={styles.sections}>
          {sections.map((section) => {
            const estActive = active === section.cle;
            return (
              <Pressable
                key={section.cle}
                testID={`section-${section.nom}`}
                onPress={() => setActive(section.cle)}
                disabled={verrouillee}
                style={[
                  styles.section,
                  { backgroundColor: theme.backgroundElement, borderColor: estActive ? section.couleur : theme.border },
                  estActive && styles.sectionActive,
                ]}
              >
                <View style={[styles.pastille, { backgroundColor: section.couleur }]} />
                <TextInput
                  value={section.nom}
                  onChangeText={(nom) => modifier(section.cle, { nom })}
                  onFocus={() => setActive(section.cle)}
                  editable={!verrouillee}
                  maxLength={50}
                  accessibilityLabel={`Nom de la section ${section.nom}`}
                  style={[champStyle, styles.champNom]}
                />
                <TextInput
                  value={section.prixTexte}
                  onChangeText={(prixTexte) => modifier(section.cle, { prixTexte })}
                  onFocus={() => setActive(section.cle)}
                  editable={!verrouillee}
                  placeholder="Prix"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="decimal-pad"
                  accessibilityLabel={`Prix de la section ${section.nom}`}
                  style={[champStyle, styles.champPrix]}
                />
                <ThemedText type="small" themeColor="textSecondary" style={styles.nombre}>
                  {nombreParSection(section.cle)} sièges
                </ThemedText>
                {!verrouillee && (
                  <Pressable
                    onPress={() => supprimerSection(section.cle)}
                    accessibilityLabel={`Supprimer la section ${section.nom}`}
                    hitSlop={8}
                  >
                    <Feather name="trash-2" size={18} color={theme.textSecondary} />
                  </Pressable>
                )}
              </Pressable>
            );
          })}

          {!verrouillee && (
            <View style={styles.actions}>
              <Pressable
                onPress={ajouterSection}
                style={[styles.boutonSecondaire, { borderColor: theme.border }]}
              >
                <Feather name="plus" size={16} color={theme.text} />
                <ThemedText type="smallBold">Ajouter une section</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setActive(null)}
                accessibilityLabel="Gomme"
                style={[
                  styles.boutonSecondaire,
                  { borderColor: active === null ? theme.text : theme.border },
                ]}
              >
                <Feather name="slash" size={16} color={theme.text} />
                <ThemedText type="smallBold">Retirer de la section</ThemedText>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.plan}>
          <ThemedText type="smallBold">Plan de salle</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {active
              ? `Touchez des sièges pour les mettre dans « ${sectionParCle.get(active)?.nom} », ou la lettre d'une rangée pour toute la rangée.`
              : "Touchez des sièges (ou la lettre d'une rangée) pour les retirer de leur section."}
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View style={styles.grille}>
              {numerosRangees.map((rangee) => {
                const ids = rangees[rangee].map((s) => s.id);
                const lettre = (
                  <Pressable
                    onPress={() => assigner(ids)}
                    disabled={verrouillee}
                    accessibilityLabel={`Rangée ${lettreRangee(rangee)} entière`}
                    style={styles.lettreRangee}
                  >
                    <ThemedText type="smallBold" themeColor="textSecondary">
                      {lettreRangee(rangee)}
                    </ThemedText>
                  </Pressable>
                );
                return (
                  <View key={rangee} style={styles.rangee}>
                    {lettre}
                    {rangees[rangee].map((s) => {
                      const section = sectionParCle.get(assignation.get(s.id));
                      return (
                        <Pressable
                          key={s.id}
                          testID={`siege-${s.id}`}
                          accessibilityLabel={`Rangée ${lettreRangee(s.rangee)}, siège ${s.colonne} : ${section ? section.nom : 'hors section'}`}
                          onPress={() => assigner([s.id])}
                          disabled={verrouillee}
                          style={[
                            styles.siege,
                            section
                              ? { backgroundColor: section.couleur, borderColor: section.couleur }
                              : { borderColor: theme.border },
                          ]}
                        >
                          <ThemedText type="small" style={{ color: section ? '#ffffff' : theme.textSecondary }}>
                            {s.colonne}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                    {lettre}
                  </View>
                );
              })}
            </View>
          </ScrollView>
          <View style={styles.legende}>
            {sections.map((s) => {
              const prix = parseTarif(s.prixTexte);
              return (
                <View key={s.cle} style={styles.legendeItem}>
                  <View style={[styles.pastille, { backgroundColor: s.couleur }]} />
                  <ThemedText type="small" themeColor="textSecondary">
                    {s.nom.trim() || 'Sans nom'}
                    {prix === null ? '' : ` · ${formatMontant(prix)}`}
                  </ThemedText>
                </View>
              );
            })}
            <View style={styles.legendeItem}>
              <View style={[styles.pastille, styles.pastilleVide, { borderColor: theme.border }]} />
              <ThemedText type="small" themeColor="textSecondary">
                Hors section · tarif de l'événement ({horsSection} sièges)
              </ThemedText>
            </View>
          </View>
        </View>

        {erreur.length > 0 && <ThemedText style={styles.erreur}>{erreur}</ThemedText>}
        {succes.length > 0 && <ThemedText style={styles.succes}>{succes}</ThemedText>}

        {!verrouillee && (
          <Pressable
            onPress={enregistrer}
            disabled={enregistrement}
            style={[styles.bouton, { backgroundColor: theme.primary, opacity: enregistrement ? 0.5 : 1 }]}
          >
            <ThemedText type="smallBold" style={styles.boutonTexte}>
              {enregistrement ? 'Enregistrement…' : 'Enregistrer les sections'}
            </ThemedText>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scroll: { flexGrow: 1, alignItems: 'center' },
  page: { width: '100%', padding: 24, gap: 24 },
  entete: { gap: 6 },
  titre: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  sections: { gap: 12 },
  section: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
  sectionActive: { borderWidth: 2 },
  pastille: { width: 14, height: 14, borderRadius: 4 },
  pastilleVide: { borderWidth: 1 },
  champ: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 16 },
  champNom: { flexGrow: 1, flexBasis: 140 },
  champPrix: { width: 90 },
  nombre: { minWidth: 64 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  boutonSecondaire: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  plan: { gap: 12 },
  grille: { gap: 8 },
  rangee: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lettreRangee: { width: 20, alignItems: 'center' },
  siege: { width: 32, height: 32, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  legende: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  legendeItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bouton: { borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  boutonTexte: { color: '#ffffff' },
  erreur: { color: '#DC2626' },
  succes: { color: '#16a34a' },
});

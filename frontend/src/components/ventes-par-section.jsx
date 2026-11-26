import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { formatMontant } from '@/utils/tarif';

const COULEUR_VENDU = '#ef4444';

// Nom d'une ligne : la ligne sans section (id null) regroupe les sièges vendus au tarif de l'événement.
// Seule, c'est toute la salle au tarif unique.
function nomLigne(ligne, lignes) {
  if (ligne.id !== null) return ligne.nom;
  return lignes.length === 1 ? 'Tarif unique' : 'Sans section';
}

// Statistiques de vente par section tarifaire (#22), calculées par le backend sur les seules réservations
// confirmées. Une section sans vente reste affichée, à zéro. Le bloc est replié par défaut : la flèche à
// côté du titre l'ouvre et le referme.
export function VentesParSection({ parSection }) {
  const theme = useTheme();
  const [ouvert, setOuvert] = useState(false);
  if (!Array.isArray(parSection) || parSection.length === 0) return null;

  return (
    <View style={styles.bloc}>
      <Pressable
        onPress={() => setOuvert((o) => !o)}
        accessibilityRole="button"
        accessibilityLabel="Ventes par section"
        accessibilityState={{ expanded: ouvert }}
        style={styles.titre}
      >
        <ThemedText type="smallBold">Ventes par section</ThemedText>
        <Feather name={ouvert ? 'chevron-up' : 'chevron-down'} size={18} color={theme.text} />
      </Pressable>
      {ouvert && parSection.map((ligne) => {
        const nom = nomLigne(ligne, parSection);
        const taux = ligne.total > 0 ? Math.round((ligne.vendus / ligne.total) * 100) : 0;
        const revenu = ligne.revenu === null ? '—' : formatMontant(ligne.revenu);
        return (
          <View
            key={ligne.id ?? 'sans-section'}
            accessible
            accessibilityLabel={`${nom} : ${ligne.vendus} sur ${ligne.total} sièges vendus, revenu ${revenu}`}
            style={[styles.ligne, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
          >
            <View style={styles.entete}>
              <View style={styles.nom}>
                <View
                  style={[styles.cadre, { borderColor: ligne.couleur ?? theme.textSecondary }]}
                />
                <ThemedText type="smallBold">{nom}</ThemedText>
                {ligne.prix !== null && (
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatMontant(ligne.prix)} / place
                  </ThemedText>
                )}
              </View>
              <ThemedText type="smallBold">{revenu}</ThemedText>
            </View>
            <View style={[styles.barre, { backgroundColor: theme.background }]}>
              <View style={{ flex: ligne.vendus, backgroundColor: COULEUR_VENDU }} />
              <View style={{ flex: ligne.total - ligne.vendus }} />
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {`${ligne.vendus} / ${ligne.total} sièges vendus (${taux} %)`}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: { gap: 8 },
  titre: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  ligne: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 8 },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  nom: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', flexShrink: 1 },
  cadre: { width: 14, height: 14, borderRadius: 3, borderWidth: 3 },
  barre: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden' },
});

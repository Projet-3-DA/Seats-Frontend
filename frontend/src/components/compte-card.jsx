import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { API_URL } from '@/constants/api';
import { useTheme } from '@/hooks/use-theme';
import { formatDateHeure } from '@/utils/dates';

const LIBELLES_ROLE = { organisateur: 'Organisateur', spectateur: 'Spectateur' };
export const RAISON_MAX = 500;

// Carte d'un compte dans la supervision (#20) : l'administrateur le suspend, avec une raison
// optionnelle, ou le réactive. Le compte n'est jamais supprimé.
export function CompteCard({ compte, token, onMaj }) {
  const theme = useTheme();
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [raison, setRaison] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  const nom = `${compte.prenom} ${compte.nom}`;
  const suspendu = compte.statut === 'suspendu';

  async function changerStatut(statut) {
    setEnvoi(true);
    setErreur('');
    try {
      const res = await fetch(`${API_URL}/admin/comptes/${compte.id}/statut`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(statut === 'suspendu' ? { statut, raison } : { statut }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Échec du changement de statut.');
      setFormulaireOuvert(false);
      setRaison('');
      onMaj(json.data);
    } catch (err) {
      setErreur(err.message || 'Échec du changement de statut.');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <View
      accessibilityLabel={`Compte de ${nom}`}
      style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
    >
      <View style={styles.titreRow}>
        <ThemedText type="smallBold" style={styles.nom}>
          {nom}
        </ThemedText>
        <View
          style={[
            styles.badge,
            suspendu ? styles.badgeSuspendu : { borderColor: theme.border },
          ]}
        >
          <ThemedText type="small" style={suspendu ? styles.texteSuspendu : undefined} themeColor={suspendu ? undefined : 'textSecondary'}>
            {suspendu ? 'Suspendu' : 'Actif'}
          </ThemedText>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Feather name="mail" size={14} color={theme.textSecondary} />
        <ThemedText type="small" themeColor="textSecondary">
          {compte.email}
        </ThemedText>
      </View>
      <View style={styles.metaRow}>
        <Feather name="user" size={14} color={theme.textSecondary} />
        <ThemedText type="small" themeColor="textSecondary">
          {LIBELLES_ROLE[compte.role] ?? compte.role}
        </ThemedText>
      </View>

      {suspendu && (
        <View style={styles.suspension}>
          {compte.suspenduLe && (
            <ThemedText type="small" themeColor="textSecondary">
              {`Suspendu le ${formatDateHeure(compte.suspenduLe)}`}
            </ThemedText>
          )}
          <ThemedText type="small" themeColor="textSecondary">
            {compte.raisonSuspension ? `Raison : ${compte.raisonSuspension}` : 'Aucune raison indiquée.'}
          </ThemedText>
        </View>
      )}

      {formulaireOuvert && !suspendu && (
        <TextInput
          accessibilityLabel={`Raison de la suspension de ${nom}`}
          placeholder="Raison (optionnelle), par exemple : abus signalé"
          placeholderTextColor={theme.textSecondary}
          value={raison}
          onChangeText={setRaison}
          maxLength={RAISON_MAX}
          multiline
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />
      )}

      {erreur.length > 0 && (
        <ThemedText type="small" style={styles.erreur}>
          {erreur}
        </ThemedText>
      )}

      <View style={styles.actions}>
        {envoi && <ActivityIndicator color={theme.primary} />}
        {suspendu && (
          <Bouton label="Réactiver le compte" onPress={() => changerStatut('actif')} disabled={envoi} theme={theme} principal />
        )}
        {!suspendu && !formulaireOuvert && (
          <Bouton label="Suspendre le compte" onPress={() => setFormulaireOuvert(true)} disabled={envoi} theme={theme} danger />
        )}
        {!suspendu && formulaireOuvert && (
          <>
            <Bouton
              label="Confirmer la suspension"
              onPress={() => changerStatut('suspendu')}
              disabled={envoi}
              theme={theme}
              danger
            />
            <Bouton
              label="Annuler"
              onPress={() => {
                setFormulaireOuvert(false);
                setRaison('');
                setErreur('');
              }}
              disabled={envoi}
              theme={theme}
            />
          </>
        )}
      </View>
    </View>
  );
}

function Bouton({ label, onPress, disabled, theme, principal, danger }) {
  const plein = principal || danger;
  const couleur = danger ? '#DC2626' : theme.primary;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.bouton,
        { borderColor: plein ? couleur : theme.border, opacity: disabled ? 0.5 : 1 },
        plein && { backgroundColor: couleur },
      ]}
    >
      <ThemedText type="small" style={plein ? styles.boutonTextePlein : undefined}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 6 },
  titreRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  nom: { fontSize: 18 },
  badge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8 },
  badgeSuspendu: { borderColor: '#DC2626', backgroundColor: '#FEE2E2' },
  texteSuspendu: { color: '#991B1B' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  suspension: { gap: 2 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, minHeight: 60, textAlignVertical: 'top', marginTop: 6 },
  erreur: { color: '#DC2626' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 6 },
  bouton: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 },
  boutonTextePlein: { color: '#ffffff' },
});

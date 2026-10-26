import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Linking, Platform, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { API_URL } from "@/constants/api";
import { FOURNISSEURS, urlConnexion } from "@/constants/fournisseurs";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

// Sur le web, on quitte la page dans le même onglet : le backend nous renverra sur /connexion-externe.
function ouvrir(url) {
  if (Platform.OS === "web") {
    window.location.assign(url);
  } else {
    Linking.openURL(url);
  }
}

export function BoutonsConnexionExterne() {
  const theme = useTheme();
  // Tant que le backend n'a pas répondu (ou s'il est injoignable), aucun bouton n'est actif.
  const [disponibles, setDisponibles] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/auth/fournisseurs`)
      .then((res) => res.json())
      .then((json) => setDisponibles(json.data ?? []))
      .catch(() => setDisponibles([]));
  }, []);

  return (
    <View style={styles.liste}>
      {FOURNISSEURS.map(({ id, nom, icone }) => {
        const disponible = disponibles.includes(id);
        return (
          <Pressable
            key={id}
            testID={`connexion-${id}`}
            accessibilityRole="button"
            accessibilityState={{ disabled: !disponible }}
            disabled={!disponible}
            onPress={() => ouvrir(urlConnexion(id))}
            style={[
              styles.bouton,
              {
                borderColor: theme.backgroundSelected,
                opacity: disponible ? 1 : 0.5,
              },
            ]}
          >
            <Ionicons name={icone} size={20} color={theme.text} />
            <ThemedText style={styles.texte}>Continuer avec {nom}</ThemedText>
            {!disponible && (
              <ThemedText type="small" themeColor="textSecondary">
                Bientôt
              </ThemedText>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  liste: { gap: Spacing.two },
  bouton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  texte: { flex: 1, fontWeight: "600" },
});

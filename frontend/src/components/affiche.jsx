import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

// Affiche d'un événement. Sans `uri` (ou si l'image ne se charge pas), on montre l'affiche par défaut.
// ponytail: l'affiche par défaut est un pictogramme aux couleurs du thème, pas un fichier image,
// pour rester identique sur web/iOS/Android sans dépendance SVG. À remplacer par un visuel de l'équipe.
export function Affiche({ uri, style }) {
  const theme = useTheme();
  const [uriEnErreur, setUriEnErreur] = useState(null);
  const afficherImage = Boolean(uri) && uri !== uriEnErreur;

  return (
    <View style={[styles.affiche, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }, style]}>
      {afficherImage ? (
        <Image
          testID="affiche-image"
          source={{ uri }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setUriEnErreur(uri)}
        />
      ) : (
        <Feather testID="affiche-icone-defaut" name="film" size={28} color={theme.textSecondary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  affiche: { borderWidth: 1, borderRadius: 8, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
});

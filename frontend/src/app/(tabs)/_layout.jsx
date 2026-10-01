import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/hooks/use-theme';

function icone(nom) {
  function TabBarIcon({ color, size }) {
    return <Feather name={nom} size={size} color={color} />;
  }
  return TabBarIcon;
}

export default function TabsLayout() {
  const { user } = useAuth();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Hauteur explicite : celle par défaut est trop basse pour l'icône et le libellé sur mobile, qui sont
  // alors coupés. Comme elle remplace le calcul automatique, la zone sûre du bas (barre de geste iOS,
  // Android) est ajoutée ici à la main.
  const bas = Math.max(insets.bottom, 8);

  // Chaque fichier de ce dossier devient un onglet même sans <Tabs.Screen> explicite : `href: null`
  // est la seule façon de le retirer de la barre (et de le rendre non navigable) selon le rôle.
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          height: 56 + bas,
          paddingTop: 6,
          paddingBottom: bas,
        },
        tabBarLabelStyle: { fontSize: 11, lineHeight: 14 },
        headerShown: false,
      }}
    >
      <Tabs.Screen name="events" options={{ title: 'Événements', tabBarIcon: icone('calendar') }} />
      <Tabs.Screen
        name="reservations"
        options={{
          title: 'Mes réservations',
          tabBarIcon: icone('bookmark'),
          href: user?.role === 'spectateur' ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="salles"
        options={{
          title: 'Salles',
          tabBarIcon: icone('layout'),
          href: user?.role === 'organisateur' ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="organisateur"
        options={{
          title: 'Organiser',
          tabBarIcon: icone('clipboard'),
          href: user?.role === 'organisateur' ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: user ? 'Profil' : 'Se connecter',
          tabBarIcon: icone(user ? 'user' : 'log-in'),
          href: user ? undefined : '/(auth)/login',
        }}
      />
    </Tabs>
  );
}

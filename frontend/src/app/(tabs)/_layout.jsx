import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';

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

  // Chaque fichier de ce dossier devient un onglet même sans <Tabs.Screen> explicite : `href: null`
  // est la seule façon de le retirer de la barre (et de le rendre non navigable) selon le rôle.
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.background, borderTopColor: theme.border },
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
      <Tabs.Screen name="profil" options={{ title: 'Profil', tabBarIcon: icone('user') }} />
    </Tabs>
  );
}

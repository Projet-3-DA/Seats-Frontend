import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="events" options={{ title: 'Événements' }} />
      <Tabs.Screen name="reservations" options={{ title: 'Mes réservations' }} />
    </Tabs>
  );
}

import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { NavigationRacine } from '@/components/navigation-racine';
import { AuthProvider } from '@/lib/auth-context';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <NavigationRacine />
      </ThemeProvider>
    </AuthProvider>
  );
}
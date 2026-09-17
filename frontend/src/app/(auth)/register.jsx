import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export default function RegisterScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [role, setRole] = useState('spectateur');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit() {
    // TODO: brancher sur l'API d'inscription (récit #1)
    router.push('/(tabs)/events');
  }

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Image source={require('../../../assets/images/icon.png')} style={styles.logo} />
            <ThemedText type="subtitle">Seats</ThemedText>
          </View>

          <View style={[styles.card, { backgroundColor: theme.background }]}>
            <ThemedText type="title" style={styles.cardTitle}>
              Créer mon compte
            </ThemedText>

            <ThemedText type="small" style={styles.label}>
              Je souhaite m'inscrire en tant que
            </ThemedText>
            <View style={[styles.tabs, { backgroundColor: theme.backgroundElement }]}>
              <RoleTab label="Spectateur" active={role === 'spectateur'} onPress={() => setRole('spectateur')} />
              <RoleTab
                label="Organisateur"
                active={role === 'organisateur'}
                onPress={() => setRole('organisateur')}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.field}>
                <ThemedText type="small" style={styles.label}>
                  Prénom
                </ThemedText>
                <Input value={firstName} onChangeText={setFirstName} placeholder="Alexandre" />
              </View>
              <View style={styles.field}>
                <ThemedText type="small" style={styles.label}>
                  Nom
                </ThemedText>
                <Input value={lastName} onChangeText={setLastName} placeholder="Martin" />
              </View>
            </View>

            <ThemedText type="small" style={styles.label}>
              Adresse email
            </ThemedText>
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="votre@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <ThemedText type="small" style={styles.label}>
              Mot de passe
            </ThemedText>
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="Minimum 8 caractères"
              secureTextEntry
            />

            <Pressable style={[styles.submit, { backgroundColor: theme.primary }]} onPress={handleSubmit}>
              <ThemedText type="smallBold" themeColor="primaryText">
                Créer mon compte
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <ThemedText themeColor="textSecondary" type="small">
              Vous avez déjà un compte ?{' '}
            </ThemedText>
            <Link href="/(auth)/login">
              <ThemedText type="smallBold" themeColor="primary">
                Se connecter
              </ThemedText>
            </Link>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function RoleTab({ label, active, onPress }) {
  const theme = useTheme();

  return (
    <Pressable style={[styles.tab, active && { backgroundColor: theme.background }]} onPress={onPress}>
      <ThemedText type="smallBold" themeColor={active ? 'primary' : 'textSecondary'}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function Input(props) {
  const theme = useTheme();

  return (
    <TextInput
      placeholderTextColor={theme.textSecondary}
      style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 4,
  },
  label: {
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  submit: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

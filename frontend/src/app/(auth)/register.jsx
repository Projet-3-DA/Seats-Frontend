import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { registerUser } from '@/services/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

export default function RegisterScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [role, setRole] = useState('spectateur');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const nextErrors = {};
    if (!firstName.trim()) {
      nextErrors.firstName = 'Le prénom est requis';
    }
    if (!lastName.trim()) {
      nextErrors.lastName = 'Le nom est requis';
    }
    if (!EMAIL_REGEX.test(email)) {
      nextErrors.email = 'Adresse email invalide (ex: nom@domaine.com)';
    }
    if (password.length < 8) {
      nextErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      await registerUser({ email, password, nom: lastName.trim(), prenom: firstName.trim(), role });
      router.push('/(tabs)/events');
    } catch (error) {
      setErrors({ form: error.message });
    } finally {
      setSubmitting(false);
    }
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
                <Input
                  value={firstName}
                  onChangeText={(text) => {
                    setFirstName(text);
                    setErrors((prev) => ({ ...prev, firstName: undefined }));
                  }}
                  placeholder="Alexandre"
                />
                {errors.firstName && (
                  <ThemedText type="small" themeColor="error">
                    {errors.firstName}
                  </ThemedText>
                )}
              </View>
              <View style={styles.field}>
                <ThemedText type="small" style={styles.label}>
                  Nom
                </ThemedText>
                <Input
                  value={lastName}
                  onChangeText={(text) => {
                    setLastName(text);
                    setErrors((prev) => ({ ...prev, lastName: undefined }));
                  }}
                  placeholder="Martin"
                />
                {errors.lastName && (
                  <ThemedText type="small" themeColor="error">
                    {errors.lastName}
                  </ThemedText>
                )}
              </View>
            </View>

            <ThemedText type="small" style={styles.label}>
              Adresse email
            </ThemedText>
            <Input
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="votre@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && (
              <ThemedText type="small" themeColor="error">
                {errors.email}
              </ThemedText>
            )}

            <ThemedText type="small" style={styles.label}>
              Mot de passe
            </ThemedText>
            <Input
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="Minimum 8 caractères"
              secureTextEntry
            />
            {errors.password && (
              <ThemedText type="small" themeColor="error">
                {errors.password}
              </ThemedText>
            )}

            {errors.form && (
              <ThemedText type="small" themeColor="error">
                {errors.form}
              </ThemedText>
            )}

            <Pressable
              style={[styles.submit, { backgroundColor: theme.primary, opacity: submitting ? 0.6 : 1 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <ThemedText type="smallBold" themeColor="primaryText">
                {submitting ? 'Création en cours…' : 'Créer mon compte'}
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

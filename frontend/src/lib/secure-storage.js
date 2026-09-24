import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// expo-secure-store n'a pas d'implémentation native sur le web.
// On bascule sur localStorage dans ce cas — jamais utilisé en production mobile,
// seulement pratique pour développer/tester avec `npm run web`.
const isWeb = Platform.OS === 'web';

export async function getItemAsync(key) {
  if (isWeb) return localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

export async function setItemAsync(key, value) {
  if (isWeb) return localStorage.setItem(key, value);
  return SecureStore.setItemAsync(key, value);
}

export async function deleteItemAsync(key) {
  if (isWeb) return localStorage.removeItem(key);
  return SecureStore.deleteItemAsync(key);
}
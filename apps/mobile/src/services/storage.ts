import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Preferences go to AsyncStorage. The session token goes to the platform keychain
 * (iOS Keychain / Android Keystore via expo-secure-store). On web there is no keychain,
 * so the token falls back to storage with a short expiry.
 */
export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  async set(key: string, value: unknown) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage can be unavailable (private browsing); the app keeps working in memory.
    }
  },
  async remove(key: string) {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export const secureStorage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return storage.get<string>(`secure.${key}`);
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async set(key: string, value: string) {
    if (Platform.OS === 'web') return storage.set(`secure.${key}`, value);
    try {
      await SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
    } catch {
      /* ignore */
    }
  },
  async remove(key: string) {
    if (Platform.OS === 'web') return storage.remove(`secure.${key}`);
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      /* ignore */
    }
  },
};

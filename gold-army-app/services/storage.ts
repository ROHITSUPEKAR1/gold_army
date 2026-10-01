import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Universal safe storage adapter:
 * - Uses expo-secure-store for Android & iOS
 * - Safely falls back to localStorage on Web (avoids "setValueWithKeyAsync is not a function" error)
 */
export const safeStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      }
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      console.warn(`[Storage] Failed to read key: ${key}`, err);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.warn(`[Storage] Failed to set key: ${key}`, err);
    }
  },

  async deleteItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.warn(`[Storage] Failed to delete key: ${key}`, err);
    }
  },
};

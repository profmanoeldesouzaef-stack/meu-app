import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Universal Storage Helper (supports Web & React Native / Expo)
 * Combines @react-native-async-storage/async-storage with robust window.localStorage fallbacks.
 */
export class AppStorage {
  async getItem<T = any>(key: string, fallback: T | null = null): Promise<T | null> {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const raw = window.localStorage.getItem(key);
        if (raw !== null) {
          try {
            return JSON.parse(raw) as T;
          } catch {
            return raw as unknown as T;
          }
        }
      }
      const raw = await AsyncStorage.getItem(key);
      if (raw !== null) {
        try {
          return JSON.parse(raw) as T;
        } catch {
          return raw as unknown as T;
        }
      }
      return fallback;
    } catch (e) {
      console.warn(`[AppStorage] Error reading ${key}:`, e);
      return fallback;
    }
  }

  async setItem<T = any>(key: string, value: T): Promise<boolean> {
    try {
      const serialized = typeof value === "string" ? value : JSON.stringify(value);
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, serialized);
      }
      await AsyncStorage.setItem(key, serialized);
      return true;
    } catch (e) {
      console.warn(`[AppStorage] Error saving ${key}:`, e);
      return false;
    }
  }

  async removeItem(key: string): Promise<boolean> {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      await AsyncStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`[AppStorage] Error removing ${key}:`, e);
      return false;
    }
  }
}

export const appStorage = new AppStorage();
export { AsyncStorage };
export default appStorage;

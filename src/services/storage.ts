import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Thin JSON persistence layer. Every read is defensive: a corrupt or
 * incompatible value is reported as `null` rather than crashing the app.
 */
export const StorageKeys = {
  save: 'lifeloop.save.v1',
  settings: 'lifeloop.settings.v1',
  graveyard: 'lifeloop.graveyard.v1',
  premium: 'lifeloop.premium.v1',
  adsMeta: 'lifeloop.adsmeta.v1',
} as const;

export async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeJson(key: string, value: unknown): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export async function remove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // ignore
  }
}

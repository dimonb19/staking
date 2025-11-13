const isBrowser = typeof window !== 'undefined';

export const POTENTIALS_KEY = 'potentials-cache';
export const TTL_MONTH = 60 * 60 * 24 * 30; // seconds

const getStorage = () => (isBrowser ? window.localStorage : undefined);

export function SetCache(key: string, value: unknown, ttlSeconds: number) {
  const storage = getStorage();
  if (!storage) return;
  const expires = Date.now() + ttlSeconds * 1000;
  storage.setItem(
    key,
    JSON.stringify({ value, expires })
  );
}

export function ClearCache(key: string) {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(key);
}

export function GetCache<T>(key: string): T | null {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed.expires && parsed.expires < Date.now()) {
      storage.removeItem(key);
      return null;
    }
    return parsed.value as T;
  } catch (e) {
    storage.removeItem(key);
    return null;
  }
}

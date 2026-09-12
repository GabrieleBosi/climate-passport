import type { IndoorOverrides, Location, SavedPlant } from './types';

/** localStorage persistence for the personal collection and last-used home profile. */

const COLLECTION_KEY = 'climate-passport:collection';
const HOME_KEY = 'climate-passport:home';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be unavailable (private mode, quota). The app still works without it.
  }
}

export function loadCollection(): SavedPlant[] {
  return read<SavedPlant[]>(COLLECTION_KEY, []);
}

export function saveCollection(items: SavedPlant[]): void {
  write(COLLECTION_KEY, items);
}

export interface HomeProfile {
  location: Location;
  overrides: IndoorOverrides;
}

export function loadHome(): HomeProfile | null {
  return read<HomeProfile | null>(HOME_KEY, null);
}

export function saveHome(profile: HomeProfile): void {
  write(HOME_KEY, profile);
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

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

function isLocation(v: unknown): v is Location {
  if (!v || typeof v !== 'object') return false;
  const l = v as Partial<Location>;
  return typeof l.name === 'string' && Number.isFinite(l.lat) && Number.isFinite(l.lon);
}

function isSavedPlant(v: unknown): v is SavedPlant {
  if (!v || typeof v !== 'object') return false;
  const s = v as Partial<SavedPlant>;
  return typeof s.id === 'string' && typeof s.plantId === 'string' && isLocation(s.location);
}

/** Load the collection, dropping any entry that does not have the expected shape. */
export function loadCollection(): SavedPlant[] {
  const raw = read<unknown>(COLLECTION_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter(isSavedPlant).map((s) => ({ ...s, overrides: s.overrides ?? {} }));
}

export function saveCollection(items: SavedPlant[]): void {
  write(COLLECTION_KEY, items);
}

export interface HomeProfile {
  location: Location;
  overrides: IndoorOverrides;
}

export function loadHome(): HomeProfile | null {
  const raw = read<Partial<HomeProfile> | null>(HOME_KEY, null);
  if (!raw || !isLocation(raw.location)) return null;
  return { location: raw.location, overrides: raw.overrides ?? {} };
}

export function saveHome(profile: HomeProfile): void {
  write(HOME_KEY, profile);
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

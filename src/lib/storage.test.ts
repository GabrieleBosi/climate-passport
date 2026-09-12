import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadCollection, loadHome, saveCollection, saveHome } from './storage';

// Minimal localStorage stand-in for the node test environment.
function fakeStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  } as unknown as Storage;
}

describe('storage', () => {
  beforeEach(() => {
    (globalThis as { localStorage?: Storage }).localStorage = fakeStorage();
  });
  afterEach(() => {
    delete (globalThis as { localStorage?: Storage }).localStorage;
  });

  it('round-trips a valid collection', () => {
    const item = {
      id: 'a',
      plantId: 'ficus-lyrata',
      location: { name: 'Berlin', lat: 52.5, lon: 13.4 },
      overrides: { humidity: 40 },
      savedAt: '2026-01-01T00:00:00Z',
    };
    saveCollection([item]);
    expect(loadCollection()).toEqual([item]);
  });

  it('drops malformed entries instead of crashing', () => {
    localStorage.setItem(
      'climate-passport:collection',
      JSON.stringify([
        { id: 'ok', plantId: 'aloe-vera', location: { name: 'Rome', lat: 41.9, lon: 12.5 } },
        { id: 'no-location', plantId: 'aloe-vera' },
        { id: 'bad-coords', plantId: 'aloe-vera', location: { name: 'x', lat: 'north', lon: 1 } },
        'garbage',
        null,
      ]),
    );
    const items = loadCollection();
    expect(items.map((i) => i.id)).toEqual(['ok']);
    expect(items[0].overrides).toEqual({});
  });

  it('returns an empty collection for unparseable or non-array data', () => {
    localStorage.setItem('climate-passport:collection', '{not json');
    expect(loadCollection()).toEqual([]);
    localStorage.setItem('climate-passport:collection', JSON.stringify({ a: 1 }));
    expect(loadCollection()).toEqual([]);
  });

  it('validates the home profile', () => {
    saveHome({ location: { name: 'Oslo', lat: 59.9, lon: 10.7 }, overrides: { light: 'low' } });
    expect(loadHome()?.location.name).toBe('Oslo');
    localStorage.setItem('climate-passport:home', JSON.stringify({ overrides: {} }));
    expect(loadHome()).toBeNull();
  });
});

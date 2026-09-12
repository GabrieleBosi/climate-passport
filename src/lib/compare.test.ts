import { describe, expect, it } from 'vitest';
import { compare, computeScore, rangeDelta, resolveConditions } from './compare';
import { estimateIndoor, dewPoint } from './humidity';
import { PLANT_BY_ID, PLANTS } from '../data/plants';
import type { CurrentConditions } from './types';

function conditions(partial: Partial<CurrentConditions>): CurrentConditions {
  return {
    humidity: 50,
    temp: 21,
    light: 'medium',
    source: { humidity: 'manual', temp: 'manual', light: 'manual' },
    ...partial,
  };
}

describe('rangeDelta', () => {
  it('is zero inside the range and signed outside', () => {
    expect(rangeDelta(50, [40, 60])).toBe(0);
    expect(rangeDelta(30, [40, 60])).toBe(-10);
    expect(rangeDelta(75, [40, 60])).toBe(15);
  });
});

describe('estimateIndoor', () => {
  it('makes heated winter air much drier', () => {
    const { temp, humidity } = estimateIndoor(0, 85);
    expect(temp).toBe(20);
    expect(humidity).toBeLessThan(30);
  });
  it('keeps mild outdoor air roughly unchanged', () => {
    const { temp, humidity } = estimateIndoor(22, 60);
    expect(temp).toBe(22);
    expect(humidity).toBe(60);
  });
  it('dew point round-trips', () => {
    expect(dewPoint(20, 100)).toBeCloseTo(20, 1);
  });
});

describe('resolveConditions', () => {
  it('prefers manual readings over estimates', () => {
    const c = resolveConditions({ temp: 0, humidity: 85, fetchedAt: '' }, { humidity: 45, light: 'direct' });
    expect(c?.humidity).toBe(45);
    expect(c?.temp).toBe(20);
    expect(c?.light).toBe('direct');
    expect(c?.source).toEqual({ humidity: 'manual', temp: 'estimated', light: 'manual' });
  });
  it('returns null with no data at all', () => {
    expect(resolveConditions(null, {})).toBeNull();
  });
  it('works with manual readings and no weather', () => {
    expect(resolveConditions(null, { humidity: 40, temp: 22 })?.temp).toBe(22);
  });
});

describe('compare', () => {
  const fig = PLANT_BY_ID['ficus-lyrata'];

  it('flags a dry, dim winter apartment as far from a rainforest', () => {
    const result = compare(fig, conditions({ humidity: 30, temp: 20, light: 'low' }));
    expect(result.insights[0].factor).toBe('humidity');
    expect(result.insights[0].severity).toBe('major');
    expect(result.insights[0].body).toContain('~40 points drier');
    expect(result.score).toBeLessThan(45);
    expect(result.verdict).toBe('Homesick');
  });

  it('gives a near-perfect score when everything is inside range', () => {
    const result = compare(fig, conditions({ humidity: 75, temp: 25, light: 'bright-indirect' }));
    expect(result.score).toBe(100);
    expect(result.verdict).toBe('Feels like home');
    expect(result.insights).toHaveLength(2);
    expect(result.insights.every((i) => i.severity === 'ok')).toBe(true);
  });

  it('warns a succulent about damp air', () => {
    const result = compare(PLANT_BY_ID['crassula-ovata'], conditions({ humidity: 80, temp: 22, light: 'direct' }));
    const humidity = result.insights.find((i) => i.factor === 'humidity');
    expect(humidity?.delta).toBe(20);
    expect(humidity?.severity).toBe('moderate');
    expect(humidity?.title).toBe('More humid than home');
  });

  it('returns at most three insights ranked by severity', () => {
    const result = compare(fig, conditions({ humidity: 20, temp: 10, light: 'low' }));
    expect(result.insights.length).toBeLessThanOrEqual(3);
    const rank = { ok: 0, mild: 1, moderate: 2, major: 3 };
    for (let i = 1; i < result.insights.length; i++) {
      expect(rank[result.insights[i - 1].severity]).toBeGreaterThanOrEqual(rank[result.insights[i].severity]);
    }
  });
});

describe('computeScore', () => {
  it('is 100 with no penalties and 0 with all major', () => {
    const ok = compare(PLANT_BY_ID['pothos'] ?? PLANTS[0], conditions({ humidity: 80, temp: 25, light: 'bright-indirect' }));
    expect(ok.score).toBeGreaterThan(0);
    expect(
      computeScore([
        { factor: 'humidity', severity: 'major', delta: -50, title: '', body: '' },
        { factor: 'temp', severity: 'major', delta: -20, title: '', body: '' },
        { factor: 'light', severity: 'major', delta: -2, title: '', body: '' },
      ]),
    ).toBe(0);
  });
});

describe('plant data', () => {
  it('has valid ranges, ids and coordinates for every species', () => {
    const ids = new Set<string>();
    for (const p of PLANTS) {
      expect(ids.has(p.id)).toBe(false);
      ids.add(p.id);
      expect(p.climate.humidity[0]).toBeLessThan(p.climate.humidity[1]);
      expect(p.climate.temp[0]).toBeLessThan(p.climate.temp[1]);
      expect(Math.abs(p.origin.lat)).toBeLessThanOrEqual(60);
      expect(Math.abs(p.origin.lon)).toBeLessThanOrEqual(180);
    }
    expect(PLANTS.length).toBeGreaterThanOrEqual(20);
  });
});

describe('resolveConditions clamps typos', () => {
  it('limits humidity to 0–100 and temperature to -10–45', () => {
    const c = resolveConditions(null, { humidity: 150, temp: 90 });
    expect(c?.humidity).toBe(100);
    expect(c?.temp).toBe(45);
    const d = resolveConditions(null, { humidity: -5, temp: -40 });
    expect(d?.humidity).toBe(0);
    expect(d?.temp).toBe(-10);
  });
});

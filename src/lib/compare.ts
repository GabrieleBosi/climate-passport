import { LIGHT_LEVELS, LIGHT_LABELS } from './types';
import type {
  Comparison,
  CurrentConditions,
  IndoorOverrides,
  Insight,
  Plant,
  Severity,
  WeatherReading,
} from './types';
import { estimateIndoor } from './humidity';

/**
 * Comparison engine: native climate profile vs the plant's actual conditions.
 *
 * Each factor gets a signed delta (how far outside the native range the home
 * is) and a severity band. Insights are ranked by severity and the top 2-3
 * are returned as plain-language sentences.
 */

const DEFAULT_LIGHT = 'medium' as const;

/** Physical bounds for readings; anything outside is a typo, not a room. */
export const HUMIDITY_BOUNDS: [number, number] = [0, 100];
export const TEMP_BOUNDS: [number, number] = [-10, 45];

function clamp(n: number, [lo, hi]: [number, number]): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Resolve what the plant actually experiences: manual readings win over estimates. */
export function resolveConditions(
  weather: WeatherReading | null,
  overrides: IndoorOverrides,
): CurrentConditions | null {
  const estimate = weather ? estimateIndoor(weather.temp, weather.humidity) : null;
  const humidity = overrides.humidity ?? estimate?.humidity;
  const temp = overrides.temp ?? estimate?.temp;
  if (humidity === undefined || temp === undefined) return null;
  return {
    humidity: clamp(humidity, HUMIDITY_BOUNDS),
    temp: clamp(temp, TEMP_BOUNDS),
    light: overrides.light ?? DEFAULT_LIGHT,
    source: {
      humidity: overrides.humidity !== undefined ? 'manual' : 'estimated',
      temp: overrides.temp !== undefined ? 'manual' : 'estimated',
      light: overrides.light !== undefined ? 'manual' : 'default',
    },
  };
}

/** Signed distance from a value to a [min, max] range; 0 when inside. */
export function rangeDelta(value: number, [min, max]: [number, number]): number {
  if (value < min) return value - min;
  if (value > max) return value - max;
  return 0;
}

function humiditySeverity(delta: number): Severity {
  const d = Math.abs(delta);
  if (d < 5) return 'ok';
  if (d < 15) return 'mild';
  if (d < 30) return 'moderate';
  return 'major';
}

function tempSeverity(delta: number): Severity {
  const d = Math.abs(delta);
  if (d < 2) return 'ok';
  if (d < 5) return 'mild';
  if (d < 9) return 'moderate';
  return 'major';
}

function lightSeverity(delta: number): Severity {
  const d = Math.abs(delta);
  if (d === 0) return 'ok';
  if (d === 1) return 'mild';
  return 'major';
}

const SEVERITY_RANK: Record<Severity, number> = { ok: 0, mild: 1, moderate: 2, major: 3 };

function approx(n: number): string {
  return `~${Math.round(Math.abs(n))}`;
}

function humidityInsight(plant: Plant, current: CurrentConditions): Insight {
  const [min, max] = plant.climate.humidity;
  const delta = rangeDelta(current.humidity, plant.climate.humidity);
  const severity = humiditySeverity(delta);
  const name = plant.commonName.toLowerCase();

  if (severity === 'ok' && delta === 0) {
    return {
      factor: 'humidity',
      severity,
      delta,
      title: 'Humidity matches',
      body: `At ${current.humidity}% your air sits inside the ${min}–${max}% band of the ${plant.habitat}. No change needed.`,
    };
  }
  if (delta < 0) {
    return {
      factor: 'humidity',
      severity,
      delta,
      title: severity === 'major' ? 'Far too dry' : 'Drier than home',
      body: `Your room is running ${approx(delta)} points drier than the ${min}–${max}% humidity of the ${plant.habitat}. ${
        severity === 'major'
          ? `Expect crispy leaf edges on a ${name}. A humidifier or a pebble tray in a grouped cluster of plants helps most.`
          : severity === 'moderate'
            ? 'Group plants together or move it away from radiators and vents.'
            : 'Close enough that most plants adapt, but keep it away from heaters.'
      }`,
    };
  }
  return {
    factor: 'humidity',
    severity,
    delta,
    title: 'More humid than home',
    body: `Your air is ${approx(delta)} points more humid than the ${min}–${max}% this ${name} evolved in. ${
      severity === 'major' || severity === 'moderate'
        ? 'Let the soil dry well between waterings and give it airflow, or rot will follow.'
        : 'Not a problem as long as the soil drains freely.'
    }`,
  };
}

function tempInsight(plant: Plant, current: CurrentConditions): Insight {
  const [min, max] = plant.climate.temp;
  const delta = rangeDelta(current.temp, plant.climate.temp);
  const severity = tempSeverity(delta);
  const name = plant.commonName.toLowerCase();

  if (delta === 0) {
    return {
      factor: 'temp',
      severity: 'ok',
      delta,
      title: 'Temperature matches',
      body: `${current.temp} °C is inside the ${min}–${max} °C this ${name} grows in. It will feel at home.`,
    };
  }
  if (delta < 0) {
    return {
      factor: 'temp',
      severity,
      delta,
      title: severity === 'major' ? 'Much too cold' : 'Cooler than home',
      body: `Your room is ${approx(delta)} °C cooler than the ${min}–${max} °C of ${plant.regionLabel}. ${
        severity === 'major'
          ? 'Growth will stall and cold soil rots roots. Water far less until it warms up.'
          : severity === 'moderate'
            ? 'Growth slows. Water less often and keep it off cold windowsills at night.'
            : 'A small gap. Keep it away from draughts and it will cope.'
      }`,
    };
  }
  return {
    factor: 'temp',
    severity,
    delta,
    title: 'Warmer than home',
    body: `Your room is ${approx(delta)} °C warmer than the ${min}–${max} °C of ${plant.regionLabel}. ${
      severity === 'major' || severity === 'moderate'
        ? 'Heat speeds up water loss, so check the soil more often and shade it from hot afternoon sun.'
        : 'Slightly warm. Watch for faster drying of the soil.'
    }`,
  };
}

function lightInsight(plant: Plant, current: CurrentConditions): Insight {
  const nativeIdx = LIGHT_LEVELS.indexOf(plant.climate.light);
  const currentIdx = LIGHT_LEVELS.indexOf(current.light);
  const delta = currentIdx - nativeIdx;
  const severity = lightSeverity(delta);
  const nativeLabel = LIGHT_LABELS[plant.climate.light].toLowerCase();
  const currentLabel = LIGHT_LABELS[current.light].toLowerCase();
  const defaultNote =
    current.source.light === 'default' ? ' (assumed medium light; log your real spot to refine this)' : '';

  if (delta === 0) {
    return {
      factor: 'light',
      severity,
      delta,
      title: 'Light matches',
      body: `${LIGHT_LABELS[current.light]} is exactly what this ${plant.habitat} offers${defaultNote}.`,
    };
  }
  if (delta < 0) {
    return {
      factor: 'light',
      severity,
      delta,
      title: severity === 'major' ? 'Far too dark' : 'Darker than home',
      body: `You have ${currentLabel}, but in the ${plant.habitat} this plant gets ${nativeLabel}${defaultNote}. ${
        severity === 'major'
          ? 'It will stretch and drop leaves. Move it to your brightest window or add a grow light.'
          : 'Growth will be slower and leggier. Move it a step closer to a window if you can.'
      }`,
    };
  }
  return {
    factor: 'light',
    severity,
    delta,
    title: severity === 'major' ? 'Far too bright' : 'Brighter than home',
    body: `You have ${currentLabel}, but this plant evolved in ${nativeLabel} under the ${plant.habitat}${defaultNote}. ${
      severity === 'major'
        ? 'Direct sun will scorch its leaves. Pull it back from the glass or filter the light with a sheer curtain.'
        : 'A little extra light is fine, but keep it out of hot midday sun.'
    }`,
  };
}

export function compare(plant: Plant, current: CurrentConditions): Comparison {
  const all = [humidityInsight(plant, current), tempInsight(plant, current), lightInsight(plant, current)];
  const ranked = [...all].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);

  // Show every mismatch, but always at least two lines so a perfect match still tells a story.
  const mismatches = ranked.filter((i) => i.severity !== 'ok');
  const insights = mismatches.length >= 2 ? mismatches.slice(0, 3) : ranked.slice(0, 2);

  const score = computeScore(all);
  const { verdict, tagline } = verdictFor(plant, ranked[0], score);
  return { insights, score, verdict, tagline };
}

/** Weighted 0–100 score; humidity and light matter most for houseplants. */
export function computeScore(insights: Insight[]): number {
  const weights: Record<Insight['factor'], number> = { humidity: 40, light: 35, temp: 25 };
  const penalty: Record<Severity, number> = { ok: 0, mild: 0.3, moderate: 0.65, major: 1 };
  const lost = insights.reduce((sum, i) => sum + weights[i.factor] * penalty[i.severity], 0);
  return Math.round(100 - lost);
}

function verdictFor(plant: Plant, worst: Insight, score: number): { verdict: string; tagline: string } {
  const factorWord: Record<Insight['factor'], string> = {
    humidity: worst.delta < 0 ? 'dry air' : 'damp air',
    temp: worst.delta < 0 ? 'the cold' : 'the heat',
    light: worst.delta < 0 ? 'the gloom' : 'the glare',
  };
  if (score >= 90) {
    return { verdict: 'Feels like home', tagline: `Your place could pass for ${plant.regionLabel}.` };
  }
  if (score >= 70) {
    return { verdict: 'Close to home', tagline: `A short flight from ${plant.regionLabel}. One tweak and it settles in.` };
  }
  if (score >= 45) {
    return { verdict: 'A long way from home', tagline: `Missing ${plant.regionLabel} mostly because of ${factorWord[worst.factor]}.` };
  }
  return { verdict: 'Homesick', tagline: `${factorWord[worst.factor].replace(/^./, (c) => c.toUpperCase())} makes this feel nothing like ${plant.regionLabel}.` };
}

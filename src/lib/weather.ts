import type { Location, WeatherReading } from './types';

/**
 * Open-Meteo client. Free, no API key, CORS enabled.
 *  - Geocoding: https://open-meteo.com/en/docs/geocoding-api
 *  - Forecast:  https://open-meteo.com/en/docs
 */

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

async function errorReason(res: Response, prefix: string): Promise<string> {
  try {
    const body = (await res.json()) as { reason?: string };
    if (body.reason) return `${prefix}: ${body.reason}`;
  } catch {
    /* body was not JSON */
  }
  return `${prefix} (${res.status})`;
}

interface GeocodeResult {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

export async function geocode(query: string): Promise<Location[]> {
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(await errorReason(res, 'Geocoding failed'));
  const data = (await res.json()) as { results?: GeocodeResult[] };
  return (data.results ?? []).map((r) => ({
    name: r.admin1 && r.admin1 !== r.name ? `${r.name}, ${r.admin1}` : r.name,
    country: r.country,
    lat: r.latitude,
    lon: r.longitude,
  }));
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherReading> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,relative_humidity_2m',
    daily: 'temperature_2m_max,temperature_2m_min',
    forecast_days: '1',
    timezone: 'auto',
  });
  const res = await fetch(`${FORECAST_URL}?${params}`);
  if (!res.ok) throw new Error(await errorReason(res, 'Weather request failed'));
  const data = (await res.json()) as {
    timezone?: string;
    current: { time: string; temperature_2m: number; relative_humidity_2m: number };
    daily?: { temperature_2m_max: number[]; temperature_2m_min: number[] };
  };
  return {
    temp: data.current.temperature_2m,
    humidity: data.current.relative_humidity_2m,
    tempMax: data.daily?.temperature_2m_max?.[0],
    tempMin: data.daily?.temperature_2m_min?.[0],
    fetchedAt: new Date().toISOString(),
    timezone: data.timezone,
  };
}

/** Browser geolocation wrapped in a promise. */
export function currentPosition(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not available in this browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          name: 'My location',
          lat: Math.round(pos.coords.latitude * 100) / 100,
          lon: Math.round(pos.coords.longitude * 100) / 100,
        }),
      (err) => reject(new Error(err.message || 'Could not read your location')),
      { timeout: 10000, maximumAge: 10 * 60 * 1000 },
    );
  });
}

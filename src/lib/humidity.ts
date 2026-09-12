/**
 * Simple psychrometrics for estimating indoor conditions from outdoor weather.
 *
 * Homes are heated or cooled to a narrow band, but the water content of the
 * air stays roughly the same as outside once it comes in. Heating cold winter
 * air is what makes apartments dry: the same water vapour spread across warmer
 * air gives a much lower relative humidity. We use the Magnus formula for
 * saturation vapour pressure (Alduchov & Eskridge 1996 constants).
 */

const A = 17.625;
const B = 243.04;

/** Saturation vapour pressure, hPa, at temperature t (°C). */
export function saturationVapourPressure(t: number): number {
  return 6.1094 * Math.exp((A * t) / (B + t));
}

/** Dew point (°C) from temperature (°C) and relative humidity (%). */
export function dewPoint(t: number, rh: number): number {
  const clamped = Math.max(1, Math.min(100, rh));
  const gamma = Math.log(clamped / 100) + (A * t) / (B + t);
  return (B * gamma) / (A - gamma);
}

/** Relative humidity (%) that air with the given dew point has at temperature t. */
export function relativeHumidityAt(t: number, dew: number): number {
  const rh = (saturationVapourPressure(dew) / saturationVapourPressure(t)) * 100;
  return Math.max(5, Math.min(100, rh));
}

export interface IndoorEstimate {
  temp: number;
  humidity: number;
}

/**
 * Estimate indoor temperature and humidity from outdoor readings.
 *
 * Assumes people heat to about 20 °C and cool to about 26 °C, and that the
 * indoor air carries the same moisture as outdoors (no humidifier, some
 * moisture from cooking and showers, which we ignore for v1).
 */
export function estimateIndoor(outdoorTemp: number, outdoorHumidity: number): IndoorEstimate {
  const temp = Math.max(20, Math.min(26, outdoorTemp));
  const dew = dewPoint(outdoorTemp, outdoorHumidity);
  const humidity = relativeHumidityAt(temp, dew);
  return { temp: round1(temp), humidity: Math.round(humidity) };
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

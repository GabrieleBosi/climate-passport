/** Light level scale shared by native habitats and indoor readings. */
export type LightLevel = 'low' | 'medium' | 'bright-indirect' | 'direct';

export const LIGHT_LEVELS: LightLevel[] = ['low', 'medium', 'bright-indirect', 'direct'];

export const LIGHT_LABELS: Record<LightLevel, string> = {
  low: 'Low light',
  medium: 'Medium light',
  'bright-indirect': 'Bright indirect',
  direct: 'Direct sun',
};

export interface NativeClimate {
  /** Typical relative humidity range in the native habitat, % RH. */
  humidity: [number, number];
  /** Typical daytime temperature range in the growing season, °C. */
  temp: [number, number];
  /** Light the plant receives in its native niche (understory, canopy, open ground). */
  light: LightLevel;
  /** Plain-language rainfall pattern. */
  rainfall: string;
}

export interface Plant {
  id: string;
  commonName: string;
  scientificName: string;
  family: string;
  /** Full native range, human readable. */
  nativeRegion: string;
  /** Short label for the card, e.g. "West Africa". */
  regionLabel: string;
  /** Habitat description, e.g. "lowland tropical rainforest understory". */
  habitat: string;
  /** Representative point inside the native range, for the card map. */
  origin: { lat: number; lon: number };
  climate: NativeClimate;
  /** One or two sentences of origin story. */
  story: string;
}

export interface Location {
  name: string;
  country?: string;
  lat: number;
  lon: number;
}

export interface WeatherReading {
  /** Outdoor air temperature, °C. */
  temp: number;
  /** Outdoor relative humidity, % RH. */
  humidity: number;
  /** Daily max/min for context, °C. */
  tempMax?: number;
  tempMin?: number;
  fetchedAt: string;
  timezone?: string;
}

export interface IndoorOverrides {
  humidity?: number;
  temp?: number;
  light?: LightLevel;
}

/** The conditions the plant actually lives in, after overrides and indoor estimation. */
export interface CurrentConditions {
  humidity: number;
  temp: number;
  light: LightLevel;
  /** Which values came from manual readings vs estimated from outdoor weather. */
  source: {
    humidity: 'manual' | 'estimated';
    temp: 'manual' | 'estimated';
    light: 'manual' | 'default';
  };
}

export type Severity = 'ok' | 'mild' | 'moderate' | 'major';

export type Factor = 'humidity' | 'temp' | 'light';

export interface Insight {
  factor: Factor;
  severity: Severity;
  /** Signed delta: negative means the home is lower than the native range. */
  delta: number;
  title: string;
  body: string;
}

export interface Comparison {
  insights: Insight[];
  /** Overall 0–100 match score, 100 = fully inside native ranges. */
  score: number;
  verdict: string;
  tagline: string;
}

export interface SavedPlant {
  id: string;
  plantId: string;
  nickname?: string;
  location: Location;
  overrides: IndoorOverrides;
  savedAt: string;
}

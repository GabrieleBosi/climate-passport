import { useState } from 'react';
import { currentPosition, geocode } from '../lib/weather';
import { estimateIndoor } from '../lib/humidity';
import type { Location, WeatherReading } from '../lib/types';

interface Props {
  location: Location | null;
  weather: WeatherReading | null;
  loading: boolean;
  error: string | null;
  onLocation: (loc: Location) => void;
}

export default function HomeProfile({ location, weather, loading, error, onLocation }: Props) {
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState<Location[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const found = await geocode(query);
      if (found.length === 0) setSearchError('No place found. Try a city name or a postcode with country.');
      if (found.length === 1) {
        onLocation(found[0]);
        setCandidates([]);
      } else {
        setCandidates(found);
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  }

  async function useMyLocation() {
    setSearchError(null);
    try {
      onLocation(await currentPosition());
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Could not read location');
    }
  }

  const indoor = weather ? estimateIndoor(weather.temp, weather.humidity) : null;

  return (
    <section className="panel">
      <h2 className="panel__title">2. Where does it live now?</h2>
      <form className="row" onSubmit={search}>
        <input
          className="input"
          type="text"
          placeholder="City or postcode, e.g. Bologna or 10115 Berlin"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Your city or postcode"
        />
        <button className="btn" type="submit" disabled={searching}>
          {searching ? 'Searching…' : 'Look up'}
        </button>
        <button className="btn btn--ghost" type="button" onClick={useMyLocation}>
          Use my location
        </button>
      </form>
      {candidates.length > 1 && (
        <ul className="candidates">
          {candidates.map((c) => (
            <li key={`${c.lat},${c.lon}`}>
              <button
                type="button"
                className="candidates__item"
                onClick={() => {
                  onLocation(c);
                  setCandidates([]);
                }}
              >
                {c.name}
                {c.country ? `, ${c.country}` : ''}
              </button>
            </li>
          ))}
        </ul>
      )}
      {(searchError || error) && <p className="error">{searchError ?? error}</p>}
      {loading && <p className="muted">Fetching local weather from Open-Meteo…</p>}
      {location && weather && indoor && (
        <div className="weather">
          <p className="weather__place">
            <strong>
              {location.name}
              {location.country ? `, ${location.country}` : ''}
            </strong>{' '}
            <span className="muted">· right now, outdoors</span>
          </p>
          <dl className="weather__grid">
            <div>
              <dt>Outdoor</dt>
              <dd>
                {Math.round(weather.temp)} °C · {Math.round(weather.humidity)}% RH
              </dd>
            </div>
            <div>
              <dt>Indoor estimate</dt>
              <dd>
                {Math.round(indoor.temp)} °C · {indoor.humidity}% RH
              </dd>
            </div>
          </dl>
          <p className="muted small">
            Indoor estimate assumes a room heated to 20 °C or cooled to 26 °C with the same moisture as outside. Log a real
            reading below to override it.
          </p>
        </div>
      )}
    </section>
  );
}

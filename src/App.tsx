import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import PlantSearch from './components/PlantSearch';
import HomeProfile from './components/HomeProfile';
import IndoorOverrides from './components/IndoorOverrides';
import Insights from './components/Insights';
import PassportCard from './components/PassportCard';
import Collection from './components/Collection';
import { PLANT_BY_ID } from './data/plants';
import { compare, resolveConditions } from './lib/compare';
import { fetchWeather } from './lib/weather';
import { loadCollection, loadHome, newId, saveCollection, saveHome } from './lib/storage';
import type { IndoorOverrides as Overrides, Location, Plant, SavedPlant, WeatherReading } from './lib/types';

export default function App() {
  const home = useMemo(loadHome, []);
  const [plant, setPlant] = useState<Plant | null>(null);
  const [location, setLocation] = useState<Location | null>(home?.location ?? null);
  const [weather, setWeather] = useState<WeatherReading | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Overrides>(home?.overrides ?? {});
  const [collection, setCollection] = useState<SavedPlant[]>(loadCollection);
  const [activeSavedId, setActiveSavedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Fetch weather whenever the location changes.
  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    setWeatherLoading(true);
    setWeatherError(null);
    fetchWeather(location.lat, location.lon)
      .then((w) => {
        if (!cancelled) setWeather(w);
      })
      .catch((err: unknown) => {
        if (!cancelled) setWeatherError(err instanceof Error ? err.message : 'Weather lookup failed');
      })
      .finally(() => {
        if (!cancelled) setWeatherLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [location]);

  // Remember the home profile between visits.
  useEffect(() => {
    if (location) saveHome({ location, overrides });
  }, [location, overrides]);

  useEffect(() => {
    saveCollection(collection);
  }, [collection]);

  const current = useMemo(() => resolveConditions(weather, overrides), [weather, overrides]);
  const comparison = useMemo(() => (plant && current ? compare(plant, current) : null), [plant, current]);

  const flash = useCallback((msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 2500);
  }, []);

  function savePlant() {
    if (!plant || !location) return;
    const existing = activeSavedId ? collection.find((c) => c.id === activeSavedId) : undefined;
    if (existing && existing.plantId === plant.id) {
      setCollection((items) =>
        items.map((c) => (c.id === existing.id ? { ...c, location, overrides, savedAt: new Date().toISOString() } : c)),
      );
      flash('Collection updated');
      return;
    }
    const item: SavedPlant = { id: newId(), plantId: plant.id, location, overrides, savedAt: new Date().toISOString() };
    setCollection((items) => [item, ...items]);
    setActiveSavedId(item.id);
    flash('Saved to collection');
  }

  function openSaved(item: SavedPlant) {
    setPlant(PLANT_BY_ID[item.plantId] ?? null);
    setOverrides(item.overrides);
    setActiveSavedId(item.id);
    if (!location || location.lat !== item.location.lat || location.lon !== item.location.lon) {
      setLocation(item.location);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function removeSaved(id: string) {
    setCollection((items) => items.filter((c) => c.id !== id));
    if (activeSavedId === id) setActiveSavedId(null);
  }

  async function exportPng() {
    const node = cardRef.current;
    if (!node || !plant) return;
    setExporting(true);
    try {
      const options = { pixelRatio: 2, cacheBust: true };
      let dataUrl: string;
      try {
        dataUrl = await toPng(node, options);
      } catch {
        // Cross-origin font stylesheets can block export; retry without embedding fonts.
        dataUrl = await toPng(node, { ...options, skipFonts: true });
      }
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `climate-passport-${plant.id}.png`;
      a.click();
      flash('PNG downloaded');
    } catch (err) {
      flash(err instanceof Error ? `Export failed: ${err.message}` : 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  async function share() {
    if (!plant || !comparison || !location) return;
    const text = `${plant.commonName} (${plant.scientificName}) — native to ${plant.regionLabel}. ${comparison.verdict}: ${comparison.tagline} Climate match ${comparison.score}/100 in ${location.name}.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Climate Passport', text });
      } else {
        await navigator.clipboard.writeText(text);
        flash('Summary copied to clipboard');
      }
    } catch {
      /* user cancelled the share sheet */
    }
  }

  return (
    <div className="app">
      <header className="hero">
        <p className="hero__eyebrow">🌿 Climate Passport</p>
        <h1 className="hero__title">Where does your plant think it lives?</h1>
        <p className="hero__lead">
          Every houseplant carries the climate of its ancestors. Compare that native climate with the room it sits in now,
          and see which gap it feels most.
        </p>
      </header>

      <main className="layout">
        <div className="layout__form">
          <PlantSearch selected={plant} onSelect={(p) => { setPlant(p); setActiveSavedId(null); }} />
          <HomeProfile
            location={location}
            weather={weather}
            loading={weatherLoading}
            error={weatherError}
            onLocation={setLocation}
          />
          <IndoorOverrides value={overrides} onChange={setOverrides} />
          {comparison && <Insights comparison={comparison} />}
        </div>

        <aside className="layout__card">
          {plant && location && current && comparison ? (
            <>
              <PassportCard ref={cardRef} plant={plant} location={location} current={current} comparison={comparison} />
              <div className="actions">
                <button className="btn" type="button" onClick={exportPng} disabled={exporting}>
                  {exporting ? 'Rendering…' : 'Download PNG'}
                </button>
                <button className="btn btn--ghost" type="button" onClick={share}>
                  Share
                </button>
                <button className="btn btn--ghost" type="button" onClick={savePlant}>
                  {activeSavedId && collection.some((c) => c.id === activeSavedId && c.plantId === plant.id)
                    ? 'Update in collection'
                    : 'Save to collection'}
                </button>
              </div>
            </>
          ) : (
            <div className="placeholder">
              <p className="placeholder__title">Your passport appears here</p>
              <p className="muted">
                {!plant ? 'Pick a plant to begin.' : !location ? 'Add your location to fetch the local climate.' : weatherLoading ? 'Fetching weather…' : 'Enter indoor readings or wait for the weather to load.'}
              </p>
            </div>
          )}
          <Collection items={collection} activeId={activeSavedId} onOpen={openSaved} onRemove={removeSaved} />
        </aside>
      </main>

      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}

      <footer className="footer">
        <p className="muted small">
          Weather by <a href="https://open-meteo.com/">Open-Meteo</a>. Native climate profiles are typical growing-season
          ranges for each species&apos; habitat and are meant as a guide, not a lab measurement.
        </p>
      </footer>
    </div>
  );
}

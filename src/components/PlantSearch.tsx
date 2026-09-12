import { useMemo, useState } from 'react';
import { searchPlants } from '../data/plants';
import type { Plant } from '../lib/types';

interface Props {
  selected: Plant | null;
  onSelect: (plant: Plant) => void;
}

export default function PlantSearch({ selected, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const results = useMemo(() => searchPlants(query), [query]);

  return (
    <section className="panel">
      <h2 className="panel__title">1. Pick a plant</h2>
      <div className="search">
        <input
          className="input"
          type="search"
          placeholder="Search by common or scientific name…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          aria-label="Search plants"
        />
        {open && (
          <ul className="search__results" role="listbox">
            {results.length === 0 && <li className="search__empty">No match. Try a different name.</li>}
            {results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected?.id === p.id}
                  className={`search__item ${selected?.id === p.id ? 'is-selected' : ''}`}
                  onClick={() => {
                    onSelect(p);
                    setOpen(false);
                    setQuery('');
                  }}
                >
                  <span className="search__common">{p.commonName}</span>
                  <span className="search__sci">{p.scientificName}</span>
                  <span className="search__region">{p.regionLabel}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {selected && (
        <div className="plant-summary">
          <p className="plant-summary__lead">
            <strong>{selected.scientificName}</strong> — native to the {selected.habitat} of {selected.nativeRegion}.
          </p>
          <p className="plant-summary__story">{selected.story}</p>
          <dl className="plant-summary__facts">
            <div>
              <dt>Humidity</dt>
              <dd>
                {selected.climate.humidity[0]}–{selected.climate.humidity[1]}%
              </dd>
            </div>
            <div>
              <dt>Temperature</dt>
              <dd>
                {selected.climate.temp[0]}–{selected.climate.temp[1]} °C
              </dd>
            </div>
            <div>
              <dt>Rainfall</dt>
              <dd>{selected.climate.rainfall}</dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  );
}

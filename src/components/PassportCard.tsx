import { forwardRef } from 'react';
import WorldMap from './WorldMap';
import { LIGHT_LABELS } from '../lib/types';
import type { Comparison, CurrentConditions, Location, Plant } from '../lib/types';

interface Props {
  plant: Plant;
  location: Location;
  current: CurrentConditions;
  comparison: Comparison;
}

function tone(severity: string): string {
  return severity === 'ok' ? 'good' : severity === 'mild' ? 'warn' : 'bad';
}

/**
 * The shareable "Climate Passport" card. Rendered as plain DOM so it can be
 * exported to PNG with html-to-image; keep styles self-contained in .passport.
 */
const PassportCard = forwardRef<HTMLDivElement, Props>(function PassportCard(
  { plant, location, current, comparison },
  ref,
) {
  const byFactor = Object.fromEntries(comparison.insights.map((i) => [i.factor, i]));
  const sev = (f: 'humidity' | 'temp' | 'light') => byFactor[f]?.severity ?? 'ok';
  const place = location.country ? `${location.name}, ${location.country}` : location.name;
  const issued = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div ref={ref} className="passport">
      <header className="passport__head">
        <div>
          <p className="passport__eyebrow">Climate Passport</p>
          <h3 className="passport__name">{plant.commonName}</h3>
          <p className="passport__sci">{plant.scientificName}</p>
        </div>
        <div className="passport__score" aria-label={`Match score ${comparison.score} out of 100`}>
          <span className="passport__score-num">{comparison.score}</span>
          <span className="passport__score-label">match</span>
        </div>
      </header>

      <div className="passport__map">
        <WorldMap lat={plant.origin.lat} lon={plant.origin.lon} label={plant.regionLabel} />
        <p className="passport__origin">
          <span className="passport__origin-label">Place of origin</span>
          <span className="passport__origin-value">{plant.regionLabel}</span>
          <span className="passport__origin-sub">{plant.habitat}</span>
        </p>
      </div>

      <table className="passport__table">
        <thead>
          <tr>
            <th scope="col"></th>
            <th scope="col">Native</th>
            <th scope="col">{location.name.split(',')[0]}</th>
          </tr>
        </thead>
        <tbody>
          <tr className={`is-${tone(sev('humidity'))}`}>
            <th scope="row">Humidity</th>
            <td>
              {plant.climate.humidity[0]}–{plant.climate.humidity[1]}%
            </td>
            <td>{Math.round(current.humidity)}%</td>
          </tr>
          <tr className={`is-${tone(sev('temp'))}`}>
            <th scope="row">Temperature</th>
            <td>
              {plant.climate.temp[0]}–{plant.climate.temp[1]} °C
            </td>
            <td>{Math.round(current.temp)} °C</td>
          </tr>
          <tr className={`is-${tone(sev('light'))}`}>
            <th scope="row">Light</th>
            <td>{LIGHT_LABELS[plant.climate.light]}</td>
            <td>{LIGHT_LABELS[current.light]}</td>
          </tr>
        </tbody>
      </table>

      <footer className="passport__foot">
        <p className="passport__verdict">{comparison.verdict}</p>
        <p className="passport__tagline">{comparison.tagline}</p>
        <p className="passport__meta">
          Issued {issued} · {place}
        </p>
      </footer>
      <span className="passport__stamp" aria-hidden="true">
        {comparison.score >= 70 ? 'ADMITTED' : 'ADJUSTING'}
      </span>
    </div>
  );
});

export default PassportCard;

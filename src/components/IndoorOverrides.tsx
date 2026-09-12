import { LIGHT_LEVELS, LIGHT_LABELS } from '../lib/types';
import type { IndoorOverrides as Overrides, LightLevel } from '../lib/types';

interface Props {
  value: Overrides;
  onChange: (next: Overrides) => void;
}

function numOrUndefined(raw: string): number | undefined {
  if (raw.trim() === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export default function IndoorOverrides({ value, onChange }: Props) {
  return (
    <section className="panel">
      <h2 className="panel__title">3. Indoor readings (optional)</h2>
      <p className="muted small">Rooms rarely match the weather outside. Log what a hygrometer or thermometer says.</p>
      <div className="overrides">
        <label className="field">
          <span>Humidity, % RH</span>
          <input
            className="input"
            type="number"
            min={5}
            max={100}
            inputMode="numeric"
            placeholder="e.g. 38"
            value={value.humidity ?? ''}
            onChange={(e) => onChange({ ...value, humidity: numOrUndefined(e.target.value) })}
          />
        </label>
        <label className="field">
          <span>Temperature, °C</span>
          <input
            className="input"
            type="number"
            min={-10}
            max={45}
            step={0.5}
            inputMode="decimal"
            placeholder="e.g. 21"
            value={value.temp ?? ''}
            onChange={(e) => onChange({ ...value, temp: numOrUndefined(e.target.value) })}
          />
        </label>
        <fieldset className="field field--wide">
          <legend>Light where it sits</legend>
          <div className="chips">
            {LIGHT_LEVELS.map((level: LightLevel) => (
              <button
                key={level}
                type="button"
                className={`chip ${value.light === level ? 'is-active' : ''}`}
                onClick={() => onChange({ ...value, light: value.light === level ? undefined : level })}
                aria-pressed={value.light === level}
              >
                {LIGHT_LABELS[level]}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    </section>
  );
}

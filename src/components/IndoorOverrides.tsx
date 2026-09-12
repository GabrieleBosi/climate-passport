import { useEffect, useState } from 'react';
import { LIGHT_LEVELS, LIGHT_LABELS } from '../lib/types';
import type { IndoorOverrides as Overrides, LightLevel } from '../lib/types';

interface Props {
  value: Overrides;
  onChange: (next: Overrides) => void;
}

function parse(raw: string): number | undefined {
  if (raw.trim() === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * A number input that owns its text while the user types, so partial input
 * like "20." or "-" is not thrown away by a controlled re-render. The parsed
 * value is pushed up on every change; the text is re-synced only when the
 * parent value changes to something the text does not already represent.
 */
function NumberField({
  label,
  value,
  onChange,
  ...inputProps
}: {
  label: string;
  value: number | undefined;
  onChange: (n: number | undefined) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const [text, setText] = useState(value === undefined ? '' : String(value));

  useEffect(() => {
    if (parse(text) !== value) setText(value === undefined ? '' : String(value));
    // Only re-sync when the parent value changes, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <label className="field">
      <span>{label}</span>
      <input
        className="input"
        type="number"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(parse(e.target.value));
        }}
        {...inputProps}
      />
    </label>
  );
}

export default function IndoorOverrides({ value, onChange }: Props) {
  return (
    <section className="panel">
      <h2 className="panel__title">3. Indoor readings (optional)</h2>
      <p className="muted small">Rooms rarely match the weather outside. Log what a hygrometer or thermometer says.</p>
      <div className="overrides">
        <NumberField
          label="Humidity, % RH"
          value={value.humidity}
          onChange={(humidity) => onChange({ ...value, humidity })}
          min={5}
          max={100}
          inputMode="numeric"
          placeholder="e.g. 38"
        />
        <NumberField
          label="Temperature, °C"
          value={value.temp}
          onChange={(temp) => onChange({ ...value, temp })}
          min={-10}
          max={45}
          step={0.5}
          inputMode="decimal"
          placeholder="e.g. 21"
        />
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

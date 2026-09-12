import type { Comparison } from '../lib/types';

interface Props {
  comparison: Comparison;
}

const ICON: Record<string, string> = { humidity: '💧', temp: '🌡️', light: '☀️' };

export default function Insights({ comparison }: Props) {
  return (
    <section className="panel">
      <h2 className="panel__title">4. What the plant notices</h2>
      <ul className="insights">
        {comparison.insights.map((i) => (
          <li key={i.factor} className={`insight insight--${i.severity}`}>
            <span className="insight__icon" aria-hidden="true">
              {ICON[i.factor]}
            </span>
            <div>
              <p className="insight__title">
                {i.title} <span className="insight__badge">{i.severity}</span>
              </p>
              <p className="insight__body">{i.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

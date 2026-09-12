import { PLANT_BY_ID } from '../data/plants';
import type { SavedPlant } from '../lib/types';

interface Props {
  items: SavedPlant[];
  activeId: string | null;
  onOpen: (item: SavedPlant) => void;
  onRemove: (id: string) => void;
}

export default function Collection({ items, activeId, onOpen, onRemove }: Props) {
  if (items.length === 0) {
    return (
      <section className="panel panel--collection">
        <h2 className="panel__title">My collection</h2>
        <p className="muted small">Saved plants appear here. Build a passport, then press “Save to collection”.</p>
      </section>
    );
  }
  return (
    <section className="panel panel--collection">
      <h2 className="panel__title">My collection ({items.length})</h2>
      <ul className="collection">
        {items.map((item) => {
          const plant = PLANT_BY_ID[item.plantId];
          if (!plant) return null;
          return (
            <li key={item.id} className={`collection__item ${item.id === activeId ? 'is-active' : ''}`}>
              <button type="button" className="collection__open" onClick={() => onOpen(item)}>
                <span className="collection__name">{item.nickname || plant.commonName}</span>
                <span className="collection__sub">
                  {plant.scientificName} · {item.location.name}
                </span>
              </button>
              <button
                type="button"
                className="collection__remove"
                onClick={() => onRemove(item.id)}
                aria-label={`Remove ${item.nickname || plant.commonName}`}
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

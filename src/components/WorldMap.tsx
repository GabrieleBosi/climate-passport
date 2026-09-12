import { LAND } from '../data/world';

interface Props {
  lat: number;
  lon: number;
  label: string;
}

const W = 360;
const H = 160;
const LAT_TOP = 80;
const LAT_BOTTOM = -60;

function project(lon: number, lat: number): [number, number] {
  const x = ((lon + 180) / 360) * W;
  const y = ((LAT_TOP - lat) / (LAT_TOP - LAT_BOTTOM)) * H;
  return [x, y];
}

const LAND_PATH = LAND.map(
  (ring) => 'M' + ring.map(([lon, lat]) => project(lon, lat).map((n) => n.toFixed(1)).join(',')).join('L') + 'Z',
).join(' ');

/** Small equirectangular world map with a marker on the plant's native region. */
export default function WorldMap({ lat, lon, label }: Props) {
  const [x, y] = project(lon, lat);
  return (
    <svg className="world-map" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Map showing ${label}`}>
      <rect width={W} height={H} fill="transparent" />
      <path d={LAND_PATH} fill="rgba(244,239,226,0.16)" stroke="rgba(244,239,226,0.28)" strokeWidth={0.6} strokeLinejoin="round" />
      <circle cx={x} cy={y} r={9} fill="rgba(255,214,102,0.28)" />
      <circle cx={x} cy={y} r={3.5} fill="#ffd666" stroke="#0f2d1f" strokeWidth={1} />
    </svg>
  );
}

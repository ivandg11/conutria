import { somatotype } from '../lib/calculations';

const CATEGORIES = [
  { id: 'central', label: 'Central' },
  { id: 'balanced-endomorph', label: 'Endomorfo balanceado' },
  { id: 'mesomorphic-endomorph', label: 'Endomorfo mesomórfico' },
  { id: 'mesomorph-endomorph', label: 'Mesomorfo-endomorfo' },
  { id: 'endomorphic-mesomorph', label: 'Mesomorfo endomórfico' },
  { id: 'balanced-mesomorph', label: 'Mesomorfo balanceado' },
  { id: 'ectomorphic-mesomorph', label: 'Mesomorfo ectomórfico' },
  { id: 'mesomorph-ectomorph', label: 'Mesomorfo-ectomorfo' },
  { id: 'mesomorphic-ectomorph', label: 'Ectomorfo mesomórfico' },
  { id: 'balanced-ectomorph', label: 'Ectomorfo balanceado' },
  { id: 'endomorphic-ectomorph', label: 'Ectomorfo endomórfico' },
  { id: 'endomorph-ectomorph', label: 'Endomorfo-ectomorfo' },
  { id: 'ectomorphic-endomorph', label: 'Endomorfo ectomórfico' },
];

function classifySomatotype({ endo, meso, ecto }) {
  const components = [endo, meso, ecto];
  const max = Math.max(...components);
  const min = Math.min(...components);

  if (max - min <= 1) return CATEGORIES[0];

  const sorted = [...components].sort((a, b) => b - a);
  if (sorted[0] - sorted[1] <= 0.5) {
    if (Math.abs(endo - meso) <= 0.5 && ecto < Math.min(endo, meso)) {
      return CATEGORIES[3];
    }
    if (Math.abs(meso - ecto) <= 0.5 && endo < Math.min(meso, ecto)) {
      return CATEGORIES[7];
    }
    if (Math.abs(endo - ecto) <= 0.5 && meso < Math.min(endo, ecto)) {
      return CATEGORIES[11];
    }
  }

  if (endo > meso && endo > ecto) {
    if (Math.abs(meso - ecto) <= 0.5) return CATEGORIES[1];
    return meso > ecto ? CATEGORIES[2] : CATEGORIES[12];
  }
  if (meso > endo && meso > ecto) {
    if (Math.abs(endo - ecto) <= 0.5) return CATEGORIES[5];
    return endo > ecto ? CATEGORIES[4] : CATEGORIES[6];
  }
  if (Math.abs(endo - meso) <= 0.5 && endo > ecto) return CATEGORIES[3];
  if (Math.abs(meso - ecto) <= 0.5 && meso > endo) return CATEGORIES[7];
  if (Math.abs(endo - ecto) <= 0.5 && endo > meso) return CATEGORIES[11];
  if (Math.abs(endo - meso) <= 0.5 && meso > ecto) return CATEGORIES[3];
  if (Math.abs(meso - ecto) <= 0.5 && ecto > endo) return CATEGORIES[7];
  if (Math.abs(endo - ecto) <= 0.5 && ecto > meso) return CATEGORIES[11];

  if (ecto > endo && ecto > meso) {
    if (Math.abs(endo - meso) <= 0.5) return CATEGORIES[9];
    return endo > meso ? CATEGORIES[10] : CATEGORIES[8];
  }

  return CATEGORIES[0];
}

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('es-MX', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });

function Somatochart({ points }) {
  const unit = 20;
  const pad = 20;
  const px = (x) => pad + (x + 8) * unit;
  const py = (y) => pad + (16 - y) * unit;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const xs = [];
  for (let i = -8; i <= 8; i += 2) xs.push(i);
  const ys = [];
  for (let j = -8; j <= 16; j += 2) ys.push(j);
  const coords = points.map((point) => ({
    cx: px(clamp(point.s.x, -8, 8)),
    cy: py(clamp(point.s.y, -8, 16)),
  }));

  return (
    <svg viewBox="0 0 360 520" className="mx-auto w-full max-w-sm" role="img" aria-label="Somatocarta Heath-Carter con la trayectoria de las consultas">
      {xs.map((x) => (
        <line key={`x${x}`} x1={px(x)} y1={py(16)} x2={px(x)} y2={py(-8)} stroke={x === 0 ? '#6b7280' : '#e5e7eb'} />
      ))}
      {ys.map((y) => (
        <line key={`y${y}`} x1={px(-8)} y1={py(y)} x2={px(8)} y2={py(y)} stroke={y === 0 ? '#6b7280' : '#e5e7eb'} />
      ))}
      <text x={px(0)} y={14} textAnchor="middle" fontSize="12" fill="#374151">Mesomorfia</text>
      <text x={px(-8)} y={512} fontSize="12" fill="#374151">Endomorfia</text>
      <text x={px(8)} y={512} textAnchor="end" fontSize="12" fill="#374151">Ectomorfia</text>
      {coords.length > 1 && <polyline points={coords.map((c) => `${c.cx},${c.cy}`).join(' ')} fill="none" stroke="#6ee7b7" strokeWidth="2" />}
      {coords.map((c, i) => <circle key={i} cx={c.cx} cy={c.cy} r={i === coords.length - 1 ? 7 : 4} fill={i === coords.length - 1 ? '#047857' : '#6ee7b7'} />)}
    </svg>
  );
}

export default function SomatotypePanel({ consultations }) {
  const results = consultations.map((c) => ({ c, s: somatotype(c) }));
  const complete = results.filter((r) => !r.s.missing);
  const latestResult = results[results.length - 1];

  if (complete.length === 0) {
    const missing = latestResult?.s.missing ?? [];
    return (
      <details className="rounded bg-white p-4 shadow">
        <summary className="cursor-pointer font-semibold">Somatotipo (Heath-Carter)</summary>
        <p className="mt-3 text-sm text-gray-600">Faltan datos en la última consulta: {missing.join(', ')}.</p>
      </details>
    );
  }

  const { c, s } = complete[complete.length - 1];
  const category = classifySomatotype(s);
  const parts = [
    ['Endomorfia', s.endo],
    ['Mesomorfia', s.meso],
    ['Ectomorfia', s.ecto],
  ];
  const outOfRange = parts.some(([, value]) => value < 0.5 || value > 9);

  return (
    <details className="rounded bg-white p-4 shadow">
      <summary className="cursor-pointer font-semibold">Somatotipo (Heath-Carter)</summary>
      <div className="mt-3 space-y-3 text-sm">
        <p className="text-gray-600">Consulta del {fmtDate(c.date)}</p>
        <p className="text-lg font-semibold text-emerald-700">{s.endo} – {s.meso} – {s.ecto}</p>
        <p>Endomorfia {s.endo} · Mesomorfia {s.meso} · Ectomorfia {s.ecto}.</p>
        <p className="somato-category-result"><span>Clasificación Heath–Carter</span><strong>{category.label}</strong></p>
        {outOfRange && (
          <p className="rounded bg-amber-50 p-2 text-amber-700">Algún componente está fuera del rango habitual (0.5 a 9). Revisa que las medidas estén bien capturadas.</p>
        )}
        <Somatochart points={complete} />
        <div className="somato-category-list" aria-label="Categorías clásicas de Heath-Carter">
          {CATEGORIES.map((item) => (
            <span key={item.id} className={`somato-category-chip ${category.id === item.id ? 'is-current' : ''}`} aria-current={category.id === item.id ? 'true' : undefined}>
              {item.label}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-500">Coordenadas: X = {s.x}, Y = {s.y}. La línea une las consultas anteriores.</p>
      </div>
    </details>
  );
}


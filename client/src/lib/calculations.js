const num = (v) =>
  v === null || v === undefined || v === '' ? null : Number(v);
const round1 = (v) => Math.round(v * 10) / 10;

// ---------- Edad ----------
export function ageFromBirthDate(birthDate, ref = new Date()) {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  let age = ref.getUTCFullYear() - b.getUTCFullYear();
  const m = ref.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && ref.getUTCDate() < b.getUTCDate())) age--;
  return age;
}

// ---------- Gasto energético ----------
export const ACTIVITY_LEVELS = [
  { value: 1.2, label: 'Sedentario (poco o nada de ejercicio)' },
  { value: 1.375, label: 'Ligero (1-3 días por semana)' },
  { value: 1.55, label: 'Moderado (3-5 días por semana)' },
  { value: 1.725, label: 'Intenso (6-7 días por semana)' },
  { value: 1.9, label: 'Muy intenso (doble sesión o trabajo físico)' },
];

// Mifflin-St Jeor: GER = 10P + 6.25T - 5E + (5 hombres | -161 mujeres)
export function mifflin({ weight, height, age, sex }) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return Math.round(sex === 'M' ? base + 5 : base - 161);
}

// Kcal por gramo: proteína 4, carbohidrato 4, grasa 9
export function macroGrams(kcal, pct) {
  return {
    protein: Math.round((kcal * pct.protein) / 100 / 4),
    carbs: Math.round((kcal * pct.carbs) / 100 / 4),
    fat: Math.round((kcal * pct.fat) / 100 / 9),
  };
}

// ---------- Somatotipo Heath-Carter (método antropométrico) ----------
export function somatotype(c) {
  const m = c.measures ?? {};
  const required = {
    Peso: num(c.weightKg),
    Talla: num(c.heightCm),
    'Pliegue tríceps': num(m.pliegues?.triceps),
    'Pliegue subescapular': num(m.pliegues?.subescapular),
    'Pliegue supraespinal': num(m.pliegues?.supraespinal),
    'Pliegue pantorrilla': num(m.pliegues?.pierna),
    'Perímetro brazo flexionado': num(m.perimetros?.brazoContraido),
    'Perímetro pierna': num(m.perimetros?.piernaPerimetro),
    'Diámetro húmero': num(m.diametros?.humero),
    'Diámetro fémur': num(m.diametros?.femur),
  };
  const missing = Object.entries(required)
    .filter(([, v]) => v === null || !(v > 0))
    .map(([k]) => k);
  if (missing.length) return { missing };

  const w = required.Peso;
  const h = required.Talla;
  const triceps = required['Pliegue tríceps'];

  // Endomorfia
  const X =
    (triceps +
      required['Pliegue subescapular'] +
      required['Pliegue supraespinal']) *
    (170.18 / h);
  const endo = -0.7182 + 0.1451 * X - 0.00068 * X ** 2 + 0.0000014 * X ** 3;

  // Mesomorfia (pliegues mm -> cm para corregir los perímetros)
  const armCorrected = required['Perímetro brazo flexionado'] - triceps / 10;
  const calfCorrected =
    required['Perímetro pierna'] - required['Pliegue pantorrilla'] / 10;
  const meso =
    0.858 * required['Diámetro húmero'] +
    0.601 * required['Diámetro fémur'] +
    0.188 * armCorrected +
    0.161 * calfCorrected -
    h * 0.131 +
    4.5;

  // Ectomorfia (índice altura-peso)
  const hwr = h / Math.cbrt(w);
  let ecto;
  if (hwr >= 40.75) ecto = 0.732 * hwr - 28.58;
  else if (hwr > 38.25) ecto = 0.463 * hwr - 17.63;
  else ecto = 0.1;

  return {
    endo: round1(endo),
    meso: round1(meso),
    ecto: round1(ecto),
    // Coordenadas de la somatocarta
    x: round1(ecto - endo),
    y: round1(2 * meso - (endo + ecto)),
  };
}

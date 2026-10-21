import { useMemo } from 'react';
import { ACTIVITY_LEVELS, ageFromBirthDate, macroGrams, mifflin } from '../lib/calculations';

const DEFAULT_MACROS = { protein: 20, carbs: 50, fat: 30 };

export default function Dietocalculo({ patient, weight, height, value = {}, onChange }) {
  const age = ageFromBirthDate(patient?.birthDate);
  const macroPct = { ...DEFAULT_MACROS, ...value.macroPct };
  const formulaSex = value.formulaSex ?? (['F', 'M'].includes(patient?.sex) ? patient.sex : '');
  const activityFactor = Number(value.activityFactor ?? ACTIVITY_LEVELS[0].value);
  const adjustment = Number(value.energyAdjustment ?? 0);
  const macroTotal = Number(macroPct.protein) + Number(macroPct.carbs) + Number(macroPct.fat);
  const update = (patch) => onChange({ ...value, ...patch });

  const result = useMemo(() => {
    const currentWeight = Number(weight);
    const currentHeight = Number(height);
    if (!age || !currentWeight || !currentHeight || !formulaSex) return null;
    const bmr = mifflin({ weight: currentWeight, height: currentHeight, age, sex: formulaSex });
    const estimatedGet = Math.round(bmr * activityFactor);
    const enteredCalories = Number(value.caloriesOverride);
    const calories = enteredCalories > 0 ? Math.round(enteredCalories) : Math.round(estimatedGet * (1 + adjustment / 100));
    return { bmr, estimatedGet, calories, macros: macroTotal === 100 ? macroGrams(calories, {
      protein: Number(macroPct.protein), carbs: Number(macroPct.carbs), fat: Number(macroPct.fat),
    }) : null };
  }, [activityFactor, age, adjustment, formulaSex, height, macroPct.carbs, macroPct.fat, macroPct.protein, macroTotal, value.caloriesOverride, weight]);

  const labelClass = 'grid gap-1 text-sm font-medium text-slate-700';
  const inputClass = 'w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm';
  return (
    <details className="consultation-section consultation-dietocalculo rounded border p-3" open>
      <summary className="cursor-pointer font-semibold">Dietocálculo</summary>
      <p className="mt-3 text-sm text-slate-600">Estima energía y macronutrientes para apoyar la elaboración del plan. Revisa y ajusta los resultados según tu criterio profesional.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className={labelClass}>Fórmula de referencia<select className={`${inputClass} dietocalculo-select`} value={formulaSex} onChange={(e) => update({ formulaSex: e.target.value })}><option value="">Selecciona una opción</option><option value="F">Mujer</option><option value="M">Hombre</option></select></label>
        <label className={labelClass}>Actividad física<select className={`${inputClass} dietocalculo-select`} value={activityFactor} onChange={(e) => update({ activityFactor: Number(e.target.value) })}>{ACTIVITY_LEVELS.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}</select></label>
        <label className={labelClass}>Ajuste de energía<select className={`${inputClass} dietocalculo-select`} value={adjustment} onChange={(e) => update({ energyAdjustment: Number(e.target.value) })}><option value={-20}>−20%</option><option value={-15}>−15%</option><option value={-10}>−10%</option><option value={0}>Sin ajuste</option><option value={10}>+10%</option><option value={15}>+15%</option><option value={20}>+20%</option></select></label>
        <label className={labelClass}>Peso objetivo (kg)<input className={inputClass} type="number" min="1" max="500" step="0.1" value={value.targetWeight ?? ''} onChange={(e) => update({ targetWeight: e.target.value })} placeholder="Opcional" /></label>
        <label className={labelClass}>Energía indicada (kcal)<input className={inputClass} type="number" min="1" max="10000" step="1" value={value.caloriesOverride ?? ''} onChange={(e) => update({ caloriesOverride: e.target.value })} placeholder={result ? `Automático: ${result.calories}` : 'Automático'} /></label>
      </div>
      <div className="mt-5 rounded-2xl border border-emerald-100 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h3 className="font-semibold text-emerald-950">Distribución de macronutrientes</h3><p className="text-xs text-slate-500">Ajusta los porcentajes hasta sumar 100%.</p></div><span className={macroTotal === 100 ? 'text-sm font-semibold text-emerald-700' : 'text-sm font-semibold text-amber-700'}>{macroTotal}%</span></div>
        <div className="grid gap-3 sm:grid-cols-3">{[['protein', 'Proteína'], ['carbs', 'Carbohidratos'], ['fat', 'Grasas']].map(([key, title]) => <label key={key} className={labelClass}>{title} (%)<input className={inputClass} type="number" min="0" max="100" step="1" value={macroPct[key]} onChange={(e) => update({ macroPct: { ...macroPct, [key]: e.target.value === '' ? '' : Number(e.target.value) } })} /></label>)}</div>
      </div>
      {!result ? <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Completa peso, talla, fecha de nacimiento y fórmula de referencia para calcular.</p> : <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-xl bg-emerald-50 p-3"><span className="text-xs text-emerald-800">Metabolismo basal</span><p className="mt-1 text-lg font-bold text-emerald-950">{result.bmr} kcal</p></div><div className="rounded-xl bg-emerald-50 p-3"><span className="text-xs text-emerald-800">Gasto estimado</span><p className="mt-1 text-lg font-bold text-emerald-950">{result.estimatedGet} kcal</p></div><div className="rounded-xl bg-teal-50 p-3"><span className="text-xs text-teal-800">Energía indicada</span><p className="mt-1 text-lg font-bold text-teal-950">{result.calories} kcal</p></div><div className="rounded-xl bg-slate-50 p-3"><span className="text-xs text-slate-600">Macronutrientes</span><p className="mt-1 text-sm font-semibold">{result.macros ? `${result.macros.protein} g proteína · ${result.macros.carbs} g carbohidratos · ${result.macros.fat} g grasas` : 'Ajusta los porcentajes para que sumen 100%.'}</p></div></div>}
    </details>
  );
}
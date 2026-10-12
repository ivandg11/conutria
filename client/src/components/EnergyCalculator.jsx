import { useMemo, useState } from 'react';
import { ACTIVITY_LEVELS, ageFromBirthDate, macroGrams, mifflin } from '../lib/calculations';

export default function EnergyCalculator({ patient, consultation }) {
  const [activity, setActivity] = useState(ACTIVITY_LEVELS[0].value);
  const age = ageFromBirthDate(patient.birthDate);
  const weight = Number(consultation.weightKg);
  const height = Number(consultation.heightCm);

  const result = useMemo(() => {
    if (!age || !weight || !height) return null;
    const bmr = mifflin({ weight, height, age, sex: patient.sex });
    const calories = Math.round(bmr * Number(activity));
    return { bmr, calories, macros: macroGrams(calories, { protein: 20, carbs: 50, fat: 30 }) };
  }, [activity, age, height, patient.sex, weight]);

  return (
    <section className="rounded bg-white p-4 shadow">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Estimación energética</h2>
          <p className="mt-1 text-sm text-gray-500">Fórmula de Mifflin-St Jeor · valores orientativos</p>
        </div>
        <label className="grid gap-1 text-sm text-gray-600">
          Nivel de actividad
          <select value={activity} onChange={(event) => setActivity(event.target.value)}>
            {ACTIVITY_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
        </label>
      </div>
      {!result ? (
        <p className="mt-4 text-sm text-gray-500">Agrega fecha de nacimiento, peso y estatura para calcular una estimación.</p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-emerald-50 p-3"><span className="text-xs text-gray-500">Metabolismo basal</span><p className="mt-1 text-lg font-semibold text-emerald-800">{result.bmr} kcal</p></div>
          <div className="rounded-xl bg-emerald-50 p-3"><span className="text-xs text-gray-500">Gasto estimado</span><p className="mt-1 text-lg font-semibold text-emerald-800">{result.calories} kcal</p></div>
          <div className="rounded-xl bg-slate-50 p-3"><span className="text-xs text-gray-500">Proteína · 20%</span><p className="mt-1 font-semibold">{result.macros.protein} g</p></div>
          <div className="rounded-xl bg-slate-50 p-3"><span className="text-xs text-gray-500">Carbohidratos · 50% / Grasas · 30%</span><p className="mt-1 font-semibold">{result.macros.carbs} g / {result.macros.fat} g</p></div>
        </div>
      )}
    </section>
  );
}

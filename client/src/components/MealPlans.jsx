import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const GROUPS = [
  'Verduras',
  'Frutas',
  'Cereales y tubérculos sin grasa',
  'Cereales y tubérculos con grasa',
  'Leguminosas',
  'Alimentos de origen animal muy bajos en grasa',
  'Alimentos de origen animal bajos en grasa',
  'Alimentos de origen animal moderados en grasa',
  'Alimentos de origen animal altos en grasa',
  'Leche',
  'Grasas sin proteína',
  'Grasas con proteína',
  'Azúcares sin grasa',
  'Azúcares con grasa',
  'Alimentos libres en energía',
  'Bebidas',
  'Otro',
];

const FOOD_SUGGESTIONS = {
  Verduras: ['Calabacita', 'Jitomate', 'Nopal', 'Brócoli', 'Zanahoria', 'Espinaca', 'Pepino', 'Lechuga'],
  Frutas: ['Manzana', 'Plátano', 'Naranja', 'Papaya', 'Guayaba', 'Mango', 'Pera', 'Fresas'],
  'Cereales y tubérculos sin grasa': ['Tortilla de maíz', 'Arroz cocido', 'Avena', 'Papa cocida', 'Bolillo', 'Pasta cocida', 'Pan de caja'],
  'Cereales y tubérculos con grasa': ['Granola', 'Galletas', 'Totopos', 'Pan dulce'],
  Leguminosas: ['Frijoles de la olla', 'Lentejas', 'Garbanzo', 'Habas'],
  'Alimentos de origen animal muy bajos en grasa': ['Pechuga de pollo sin piel', 'Atún en agua', 'Clara de huevo', 'Filete de pescado'],
  'Alimentos de origen animal bajos en grasa': ['Queso panela', 'Jamón de pavo', 'Bistec magro'],
  'Alimentos de origen animal moderados en grasa': ['Huevo entero', 'Queso fresco', 'Carne de res'],
  'Alimentos de origen animal altos en grasa': ['Chorizo', 'Tocino', 'Salchicha'],
  Leche: ['Leche', 'Yogur natural', 'Jocoque'],
  'Grasas sin proteína': ['Aceite', 'Aguacate', 'Mantequilla'],
  'Grasas con proteína': ['Almendras', 'Nueces', 'Cacahuates', 'Crema de cacahuate'],
  'Azúcares sin grasa': ['Azúcar', 'Miel', 'Mermelada'],
  'Azúcares con grasa': ['Chocolate', 'Cajeta', 'Helado'],
  'Alimentos libres en energía': ['Gelatina sin azúcar', 'Infusión sin azúcar'],
  Bebidas: ['Agua', 'Café sin azúcar', 'Té sin azúcar'],
};

const MEALS = ['Desayuno', 'Colación matutina', 'Comida', 'Colación vespertina', 'Cena'];
const today = () => new Date().toISOString().slice(0, 10);
const emptyFood = () => ({ name: '', group: GROUPS[0], portion: '', equivalents: '1' });
const emptyMeal = (name = 'Nuevo tiempo') => ({ name, time: '', foods: [emptyFood()] });
const emptyForm = () => ({ title: 'Plan de alimentación', startDate: today(), meals: [emptyMeal(MEALS[0]), emptyMeal(MEALS[2]), emptyMeal(MEALS[4])], notes: '' });

function asDate(value) {
  return new Date(value).toLocaleDateString('es-MX', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' });
}

function equivalentTotals(meals = []) {
  const totals = {};
  meals.forEach((meal) => meal.foods?.forEach((food) => {
    if (!food.group || !food.name) return;
    totals[food.group] = (totals[food.group] ?? 0) + Number(food.equivalents || 0);
  }));
  return Object.entries(totals).filter(([, amount]) => amount > 0);
}

export default function MealPlans({ patientId }) {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadPlans() {
    try {
      const response = await api.get(`/patients/${patientId}/meal-plans`);
      setPlans(response.data);
    } catch (err) {
      setError(err.response?.data?.error ?? 'No se pudieron cargar los planes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPlans(); }, [patientId]);

  function startNew() {
    setForm(emptyForm());
    setEditingId(null);
    setError('');
    setOpen(true);
  }

  function editPlan(plan) {
    setForm({ title: plan.title, startDate: plan.startDate.slice(0, 10), meals: plan.content?.meals ?? [], notes: plan.content?.notes ?? '' });
    setEditingId(plan.id);
    setError('');
    setOpen(true);
  }

  function updateMeal(mealIndex, field, value) {
    setForm((current) => ({ ...current, meals: current.meals.map((meal, i) => i === mealIndex ? { ...meal, [field]: value } : meal) }));
  }

  function updateFood(mealIndex, foodIndex, field, value) {
    setForm((current) => ({ ...current, meals: current.meals.map((meal, i) => i === mealIndex ? { ...meal, foods: meal.foods.map((food, j) => j === foodIndex ? { ...food, [field]: value } : food) } : meal) }));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      title: form.title,
      startDate: form.startDate,
      content: {
        meals: form.meals.map((meal) => ({ ...meal, foods: meal.foods.filter((food) => food.name.trim()) })),
        notes: form.notes,
      },
    };
    try {
      if (editingId) await api.put(`/patients/${patientId}/meal-plans/${editingId}`, payload);
      else await api.post(`/patients/${patientId}/meal-plans`, payload);
      setOpen(false);
      await loadPlans();
    } catch (err) {
      setError(err.response?.data?.error ?? 'No se pudo guardar el plan. Revisa los datos e inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  async function removePlan(plan) {
    if (!window.confirm(`¿Eliminar “${plan.title}”?`)) return;
    try {
      await api.delete(`/patients/${patientId}/meal-plans/${plan.id}`);
      setPlans((current) => current.filter((item) => item.id !== plan.id));
    } catch (err) {
      setError(err.response?.data?.error ?? 'No se pudo eliminar el plan.');
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Planes de alimentación</h2>
          <p className="mt-1 text-sm text-gray-500">Organiza por tiempos, porciones y equivalentes de grupos SMAE.</p>
        </div>
        <button type="button" onClick={startNew} className="rounded bg-emerald-700 px-4 py-2 text-sm text-white">+ Crear plan</button>
      </div>

      {error && !open && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading ? <p className="text-sm text-gray-500">Cargando planes…</p> : plans.length === 0 ? (
        <p className="rounded bg-white p-6 text-center text-sm text-gray-500 shadow">Aún no hay planes para este paciente.</p>
      ) : plans.map((plan) => (
        <article key={plan.id} className="rounded bg-white p-4 shadow">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h3 className="font-semibold">{plan.title}</h3><p className="text-xs text-gray-500">Vigente desde {asDate(plan.startDate)}</p></div>
            <div className="flex gap-3 text-sm"><button type="button" onClick={() => editPlan(plan)} className="text-emerald-700">Editar</button><button type="button" onClick={() => removePlan(plan)} className="text-red-600">Eliminar</button></div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(plan.content?.meals ?? []).map((meal, i) => (
              <div key={`${meal.name}-${i}`} className="rounded-xl bg-gray-50 p-3">
                <p className="font-medium">{meal.name}{meal.time ? ` · ${meal.time}` : ''}</p>
                {meal.foods?.length ? <ul className="mt-2 space-y-1 text-sm text-gray-600">{meal.foods.map((food, j) => <li key={`${food.name}-${j}`}>{food.name} — {food.portion} <span className="text-gray-400">({food.equivalents} eq. · {food.group})</span></li>)}</ul> : <p className="mt-2 text-sm text-gray-400">Sin alimentos</p>}
              </div>
            ))}
          </div>
          {equivalentTotals(plan.content?.meals).length > 0 && <p className="mt-3 text-xs text-gray-500"><b>Equivalentes del día:</b> {equivalentTotals(plan.content?.meals).map(([group, amount]) => `${group}: ${amount}`).join(' · ')}</p>}
          {plan.content?.notes && <p className="mt-3 whitespace-pre-line text-sm text-gray-600">{plan.content.notes}</p>}
        </article>
      ))}

      {open && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 p-3 sm:p-6">
        <form onSubmit={save} className="mx-auto my-4 max-w-4xl space-y-5 rounded-2xl bg-white p-5 shadow-xl sm:p-7">
          <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold">{editingId ? 'Editar plan' : 'Nuevo plan de alimentación'}</h2><p className="mt-1 text-sm text-gray-500">Agrega alimentos, porción indicada y equivalentes por grupo.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="text-2xl text-gray-400">×</button></div>
          {error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1 text-sm">Nombre del plan<input required maxLength="120" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><label className="grid gap-1 text-sm">Fecha de inicio<input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></label></div>
          <div className="space-y-4">
            {form.meals.map((meal, mi) => <fieldset key={mi} className="space-y-3 rounded-xl border border-gray-200 p-3 sm:p-4">
              <div className="flex flex-wrap items-end gap-3"><label className="grid flex-1 gap-1 text-sm">Tiempo de comida<input required maxLength="80" value={meal.name} onChange={(e) => updateMeal(mi, 'name', e.target.value)} /></label><label className="grid gap-1 text-sm">Hora<input type="time" value={meal.time ?? ''} onChange={(e) => updateMeal(mi, 'time', e.target.value)} /></label><button type="button" onClick={() => setForm({ ...form, meals: form.meals.filter((_, i) => i !== mi) })} className="pb-2 text-sm text-red-600">Quitar tiempo</button></div>
              <div className="space-y-2">{meal.foods.map((food, fi) => <div key={fi} className="grid gap-2 rounded-lg bg-gray-50 p-3 sm:grid-cols-12 sm:items-end">
                <label className="grid gap-1 text-sm sm:col-span-3">Alimento<input required maxLength="120" list={`foods-${mi}-${fi}`} placeholder="Busca o escribe un alimento" value={food.name} onChange={(e) => updateFood(mi, fi, 'name', e.target.value)} /><datalist id={`foods-${mi}-${fi}`}>{(FOOD_SUGGESTIONS[food.group] ?? []).map((name) => <option key={name} value={name} />)}</datalist></label>
                <label className="grid gap-1 text-sm sm:col-span-4">Grupo SMAE<select value={food.group} onChange={(e) => updateFood(mi, fi, 'group', e.target.value)}>{GROUPS.map((g) => <option key={g}>{g}</option>)}</select></label>
                <label className="grid gap-1 text-sm sm:col-span-2">Porción<input required maxLength="80" placeholder="1 pieza, ½ taza" value={food.portion} onChange={(e) => updateFood(mi, fi, 'portion', e.target.value)} /></label>
                <label className="grid gap-1 text-sm sm:col-span-2">Equivalentes<input required type="number" min="0" max="100" step="0.25" value={food.equivalents} onChange={(e) => updateFood(mi, fi, 'equivalents', e.target.value)} /></label>
                <button type="button" aria-label="Quitar alimento" onClick={() => updateMeal(mi, 'foods', meal.foods.filter((_, i) => i !== fi))} className="pb-2 text-sm text-red-600 sm:col-span-1">Quitar</button>
              </div>)}</div>
              <button type="button" onClick={() => updateMeal(mi, 'foods', [...meal.foods, emptyFood()])} className="text-sm font-medium text-emerald-700">+ Agregar alimento</button>
            </fieldset>)}
          </div>
          <button type="button" disabled={form.meals.length >= 12} onClick={() => setForm({ ...form, meals: [...form.meals, emptyMeal()] })} className="text-sm font-medium text-emerald-700">+ Agregar tiempo de comida</button>
          {equivalentTotals(form.meals).length > 0 && <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900"><b>Equivalentes del día:</b><p className="mt-1">{equivalentTotals(form.meals).map(([group, amount]) => `${group}: ${amount}`).join(' · ')}</p></div>}
          <label className="grid gap-1 text-sm">Indicaciones o notas<textarea rows="3" maxLength="3000" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          <p className="text-xs text-gray-500">Los grupos siguen la organización SMAE. Verifica porciones y equivalentes con la edición o fuente profesional que utilizas.</p>
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4"><button type="button" onClick={() => setOpen(false)} className="rounded border px-4 py-2 text-sm">Cancelar</button><button disabled={saving} className="rounded bg-emerald-700 px-4 py-2 text-sm text-white">{saving ? 'Guardando…' : 'Guardar plan'}</button></div>
        </form>
      </div>}
    </section>
  );
}

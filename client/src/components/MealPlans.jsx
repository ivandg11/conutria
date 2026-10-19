import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
const PORTION_OPTIONS = ['1 taza', '½ taza', '¼ taza', '1 pieza', '2 piezas', '100 g', '50 g', '30 g', '1 cucharada', '1 cucharadita', '1 rebanada', '1 vaso', '240 ml'];
const today = () => new Date().toISOString().slice(0, 10);
const emptyFood = () => ({ name: '', group: GROUPS[0], portion: '', equivalents: '' });
const emptyMeal = (name = 'Nuevo tiempo') => ({ name, time: '', foods: [emptyFood()] });
const emptyForm = (startDate = today()) => ({ title: 'Plan de alimentación', startDate, meals: [emptyMeal(MEALS[0]), emptyMeal(MEALS[2]), emptyMeal(MEALS[4])], notes: '' });

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

export default function MealPlans({ patientId, defaultStartDate, consultationContext = false }) {
  const [plans, setPlans] = useState([]);
  const [customFoods, setCustomFoods] = useState([]);
  const [foodDraft, setFoodDraft] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeFood, setActiveFood] = useState('');
  const [activeGroup, setActiveGroup] = useState('');
  const [activePortion, setActivePortion] = useState('');
  const [customPortion, setCustomPortion] = useState('');

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

  useEffect(() => {
    api.get('/patients/meal-foods').then(({ data }) => setCustomFoods(data)).catch(() => {});
  }, []);

  function startNew() {
    setForm(emptyForm(defaultStartDate || today()));
    setEditingId(null);
    setFoodDraft(null);
    setActiveFood('');
    setActiveGroup('');
    setActivePortion('');
    setError('');
    setOpen(true);
  }

  function editPlan(plan) {
    setForm({ title: plan.title, startDate: plan.startDate.slice(0, 10), meals: plan.content?.meals ?? [], notes: plan.content?.notes ?? '' });
    setEditingId(plan.id);
    setFoodDraft(null);
    setActiveFood('');
    setActiveGroup('');
    setActivePortion('');
    setError('');
    setOpen(true);
  }

  function closeEditor() {
    setOpen(false);
    setFoodDraft(null);
    setActiveFood('');
    setActiveGroup('');
    setActivePortion('');
  }

  function updateMeal(mealIndex, field, value) {
    setForm((current) => ({ ...current, meals: current.meals.map((meal, i) => i === mealIndex ? { ...meal, [field]: value } : meal) }));
  }

  function updateFood(mealIndex, foodIndex, field, value) {
    setForm((current) => ({ ...current, meals: current.meals.map((meal, i) => i === mealIndex ? { ...meal, foods: meal.foods.map((food, j) => j === foodIndex ? { ...food, [field]: value } : food) } : meal) }));
  }

  function selectFood(mealIndex, foodIndex, name) {
    const savedFood = customFoods.find((item) => item.name === name && item.group === form.meals[mealIndex]?.foods[foodIndex]?.group);
    setForm((current) => ({ ...current, meals: current.meals.map((meal, i) => i === mealIndex ? { ...meal, foods: meal.foods.map((food, j) => j === foodIndex ? { ...food, name, portion: savedFood?.portion ?? '', equivalents: String(savedFood?.equivalents ?? '') } : food) } : meal) }));
  }

  async function saveCustomFood() {
    if (!foodDraft) return;
    try {
      const { data } = await api.post('/patients/meal-foods', {
        name: foodDraft.name, group: foodDraft.group, portion: foodDraft.portion, equivalents: foodDraft.equivalents,
      });
      setCustomFoods((current) => [...current.filter((food) => !(food.name === data.name && food.group === data.group)), data]);
      setForm((current) => ({ ...current, meals: current.meals.map((meal, i) => i === foodDraft.mealIndex ? { ...meal, foods: meal.foods.map((food, j) => j === foodDraft.foodIndex ? { ...food, name: data.name, group: data.group, portion: data.portion, equivalents: String(data.equivalents) } : food) } : meal) }));
      setFoodDraft(null);
    } catch (err) {
      setError(err.response?.data?.error ?? 'No se pudo guardar el alimento en tu catálogo.');
    }
  }

  function selectGroup(mealIndex, foodIndex, group) {
    setForm((current) => ({ ...current, meals: current.meals.map((meal, i) => i === mealIndex ? { ...meal, foods: meal.foods.map((food, j) => j === foodIndex ? { ...food, group, name: '', equivalents: '' } : food) } : meal) }));
    setActiveFood('');
    setActivePortion('');
  }

  async function save(e) {
    e.preventDefault();
    const incompleteFood = form.meals.some((meal) => meal.foods.some((food) => food.name && (!food.portion.trim() || food.equivalents === '')));
    if (incompleteFood) {
      setError('Completa la porción y los equivalentes de cada alimento seleccionado.');
      return;
    }
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
      closeEditor();
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
    <section className="meal-plans space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">{consultationContext ? 'Plan de alimentación' : 'Planes de alimentación'}</h2>
          <p className="mt-1 text-sm text-gray-500">{consultationContext ? 'Prepara el plan para esta etapa. Se guarda en el expediente del paciente con la fecha de la consulta.' : 'Organiza por tiempos, porciones y equivalentes de grupos SMAE.'}</p>
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

      {open && createPortal(<div className="meal-plan-editor-backdrop fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 p-3 sm:p-6">
        <form onSubmit={(event) => { event.stopPropagation(); save(event); }} className="meal-plan-editor mx-auto my-4 max-w-4xl space-y-5 rounded-2xl bg-white p-5 shadow-xl sm:p-7">
          <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold">{editingId ? 'Editar plan' : 'Nuevo plan de alimentación'}</h2><p className="mt-1 text-sm text-gray-500">Agrega alimentos, porción indicada y equivalentes por grupo.</p></div><button type="button" onClick={closeEditor} aria-label="Cerrar" className="text-2xl text-gray-400">×</button></div>
          {error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1 text-sm">Nombre del plan<input required maxLength="120" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><label className="grid gap-1 text-sm">Fecha de inicio<input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></label></div>
          <div className="space-y-4">
            {form.meals.map((meal, mi) => <fieldset key={mi} className="space-y-3 rounded-xl border border-gray-200 p-3 sm:p-4">
              <div className="flex flex-wrap items-end gap-3"><label className="grid flex-1 gap-1 text-sm">Tiempo de comida<input required maxLength="80" value={meal.name} onChange={(e) => updateMeal(mi, 'name', e.target.value)} /></label><label className="grid gap-1 text-sm">Hora<input type="time" value={meal.time ?? ''} onChange={(e) => updateMeal(mi, 'time', e.target.value)} /></label><button type="button" onClick={() => setForm({ ...form, meals: form.meals.filter((_, i) => i !== mi) })} className="pb-2 text-sm text-red-600">Quitar tiempo</button></div>
              <div className="space-y-2">{meal.foods.map((food, fi) => {
                const foodKey = `${mi}-${fi}`;
                const suggestions = [...(FOOD_SUGGESTIONS[food.group] ?? []), ...customFoods.filter((item) => item.group === food.group).map((item) => item.name)].filter((name, index, all) => all.indexOf(name) === index);
                return <div key={foodKey} className="meal-food-entry grid gap-2 rounded-lg bg-gray-50 p-3 sm:grid-cols-12 sm:items-end">
                <div className="meal-food-search relative grid gap-1 text-sm sm:col-span-3">
                  <label htmlFor={`food-${foodKey}`}>Alimento</label>
                  <button id={`food-${foodKey}`} type="button" className="meal-group-trigger" aria-haspopup="listbox" aria-expanded={activeFood === foodKey} onClick={() => { setActiveGroup(''); setActivePortion(''); setActiveFood((current) => current === foodKey ? '' : foodKey); }}>
                    <span>{food.name || 'Selecciona un alimento'}</span><span aria-hidden="true" className="meal-group-chevron">⌄</span>
                  </button>
                  {activeFood === foodKey && <div className="meal-group-options" role="listbox" aria-label="Alimentos">
                    {suggestions.map((name) => <button key={name} type="button" role="option" aria-selected={food.name === name} onClick={() => { selectFood(mi, fi, name); setActiveFood(''); }}>{name}{customFoods.some((item) => item.name === name && item.group === food.group) ? ' · Mi cuenta' : ''}</button>)}
                    <button type="button" className="meal-create-food-option" onClick={() => { setFoodDraft({ mealIndex: mi, foodIndex: fi, name: '', group: food.group, portion: '', equivalents: '1' }); setActiveFood(''); }}>Crear alimento</button>
                  </div>}
                  {foodDraft?.mealIndex === mi && foodDraft?.foodIndex === fi && <div className="mt-2 space-y-2 rounded-lg border border-emerald-200 bg-white p-3">
                    <label className="grid gap-1">Nuevo alimento<input required maxLength="120" value={foodDraft.name} onChange={(e) => setFoodDraft({ ...foodDraft, name: e.target.value })} /></label>
                    <div className="relative grid gap-1"><span>Porción de referencia</span><button type="button" className="meal-group-trigger" aria-haspopup="listbox" aria-expanded={activePortion === `draft-${foodKey}`} onClick={() => setActivePortion((current) => current === `draft-${foodKey}` ? '' : `draft-${foodKey}`)}><span>{foodDraft.portion || 'Selecciona una porción'}</span><span aria-hidden="true" className="meal-group-chevron">⌄</span></button>{activePortion === `draft-${foodKey}` && <div className="meal-group-options" role="listbox" aria-label="Porciones para alimento nuevo">{PORTION_OPTIONS.map((portion) => <button key={portion} type="button" role="option" aria-selected={foodDraft.portion === portion} onClick={() => { setFoodDraft({ ...foodDraft, portion }); setActivePortion(''); setCustomPortion(''); }}>{portion}</button>)}<button type="button" className="meal-create-food-option" onClick={() => setCustomPortion(`draft-${foodKey}`)}>Otra medida</button>{customPortion === `draft-${foodKey}` && <input autoFocus required maxLength="80" placeholder="Escribe la porción" value={foodDraft.portion} onChange={(e) => setFoodDraft({ ...foodDraft, portion: e.target.value })} />}</div>}</div>
                    <label className="grid gap-1">Equivalentes de esa porción<input required type="number" min="0" max="100" step="0.25" value={foodDraft.equivalents} onChange={(e) => setFoodDraft({ ...foodDraft, equivalents: e.target.value })} /></label>
                    <div className="flex gap-3"><button type="button" disabled={!foodDraft.name.trim() || !foodDraft.portion.trim() || foodDraft.equivalents === ''} className="text-emerald-700 disabled:opacity-50" onClick={saveCustomFood}>Guardar en mi cuenta</button><button type="button" onClick={() => { setFoodDraft(null); setCustomPortion(''); }}>Cancelar</button></div>
                  </div>}
                </div>
                <div className="meal-group-picker relative grid gap-1 text-sm sm:col-span-4">
                  <span id={`group-label-${foodKey}`}>Grupo SMAE</span>
                  <button type="button" className="meal-group-trigger" aria-labelledby={`group-label-${foodKey}`} aria-haspopup="listbox" aria-expanded={activeGroup === foodKey} onClick={() => { setActiveFood(''); setActivePortion(''); setActiveGroup((current) => current === foodKey ? '' : foodKey); }}>
                    <span>{food.group}</span><span aria-hidden="true" className="meal-group-chevron">⌄</span>
                  </button>
                  {activeGroup === foodKey && <div className="meal-group-options" role="listbox" aria-label="Grupos SMAE">{GROUPS.map((group) => <button key={group} type="button" role="option" aria-selected={food.group === group} onClick={() => { selectGroup(mi, fi, group); setActiveGroup(''); }}>{group}</button>)}</div>}
                </div>
                <div className="meal-portion-field relative grid gap-1 text-sm sm:col-span-2"><span>Porción</span><button type="button" className="meal-group-trigger" aria-haspopup="listbox" aria-expanded={activePortion === foodKey} onClick={() => { setActiveFood(''); setActiveGroup(''); setActivePortion((current) => current === foodKey ? '' : foodKey); }}><span>{food.portion || 'Selecciona una porción'}</span><span aria-hidden="true" className="meal-group-chevron">⌄</span></button>{activePortion === foodKey && <div className="meal-group-options" role="listbox" aria-label="Porciones">{PORTION_OPTIONS.map((portion) => <button key={portion} type="button" role="option" aria-selected={food.portion === portion} onClick={() => { updateFood(mi, fi, 'portion', portion); setCustomPortion(''); setActivePortion(''); }}>{portion}</button>)}<button type="button" className="meal-create-food-option" onClick={() => setCustomPortion(foodKey)}>Otra medida</button>{customPortion === foodKey && <input autoFocus maxLength="80" placeholder="Escribe la porción" value={food.portion} onChange={(e) => updateFood(mi, fi, 'portion', e.target.value)} />}</div>}</div>
                <label className="meal-equivalents-field grid gap-1 text-sm sm:col-span-2">Equivalentes<input required type="number" min="0" max="100" step="0.25" value={food.equivalents} onChange={(e) => updateFood(mi, fi, 'equivalents', e.target.value)} /></label>
                <button type="button" aria-label="Quitar alimento" onClick={() => updateMeal(mi, 'foods', meal.foods.filter((_, i) => i !== fi))} className="meal-food-remove pb-2 text-sm text-red-600 sm:col-span-1">Quitar</button>
              </div>; })}</div>
              <button type="button" onClick={() => updateMeal(mi, 'foods', [...meal.foods, emptyFood()])} className="text-sm font-medium text-emerald-700">+ Agregar alimento</button>
            </fieldset>)}
          </div>
          <button type="button" disabled={form.meals.length >= 12} onClick={() => setForm({ ...form, meals: [...form.meals, emptyMeal()] })} className="text-sm font-medium text-emerald-700">+ Agregar tiempo de comida</button>
          {equivalentTotals(form.meals).length > 0 && <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900"><b>Equivalentes del día:</b><p className="mt-1">{equivalentTotals(form.meals).map(([group, amount]) => `${group}: ${amount}`).join(' · ')}</p></div>}
          <label className="grid gap-1 text-sm">Indicaciones o notas<textarea rows="3" maxLength="3000" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          <p className="text-xs text-gray-500">Los grupos siguen la organización SMAE. Verifica porciones y equivalentes con la edición o fuente profesional que utilizas.</p>
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4"><button type="button" onClick={closeEditor} className="rounded border px-4 py-2 text-sm">Cancelar</button><button disabled={saving} className="rounded bg-emerald-700 px-4 py-2 text-sm text-white">{saving ? 'Guardando…' : 'Guardar plan'}</button></div>
        </form>
      </div>, document.body)}
    </section>
  );
}

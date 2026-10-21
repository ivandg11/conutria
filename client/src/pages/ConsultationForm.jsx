import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import Dietocalculo from '../components/Dietocalculo';
import { MEASURE_GROUPS } from '../lib/measures';
import { DEFAULT_MEALS, FREQ_GROUPS, FREQ_OPTIONS } from '../lib/clinical';
import MealPlans from '../components/MealPlans';

const today = () => new Date().toISOString().slice(0, 10);
const defaultRecall = () =>
  DEFAULT_MEALS.map((meal) => ({ meal, time: '', description: '' }));

export default function ConsultationForm() {
  const { id: patientIdParam, consultationId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const editing = Boolean(consultationId);

  const [patientId, setPatientId] = useState(patientIdParam);
  const [form, setForm] = useState({
    type: state?.isFirst ? 'INITIAL' : 'FOLLOWUP',
    date: today(),
    weightKg: '',
    heightCm: state?.lastHeight ?? '',
    bodyFatPct: '',
    notes: '',
  });
  const [measures, setMeasures] = useState({});
  const [patientProfile, setPatientProfile] = useState(null);
  const [recall, setRecall] = useState(defaultRecall());
  const [freq, setFreq] = useState({});
  const [patientReport, setPatientReport] = useState({});
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!patientId) return undefined;
    let active = true;
    api.get(`/patients/${patientId}`).then((res) => { if (active) setPatientProfile(res.data); }).catch(() => {});
    return () => { active = false; };
  }, [patientId]);

  useEffect(() => {
    if (!editing) return;
    api.get(`/consultations/${consultationId}`).then((res) => {
      const c = res.data;
      setPatientId(c.patientId);
      setForm({
        type: c.type,
        date: c.date.slice(0, 10),
        weightKg: c.weightKg ?? '',
        heightCm: c.heightCm ?? '',
        bodyFatPct: c.bodyFatPct ?? '',
        notes: c.notes ?? '',
      });
      setMeasures(c.measures ?? {});
      setRecall(c.recall24h?.length ? c.recall24h : defaultRecall());
      setFreq(c.foodFrequency ?? {});
      setPatientReport(c.patientReport ?? {});
    });
  }, [editing, consultationId]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleMeasure(group, key, value) {
    setMeasures((prev) => ({
      ...prev,
      [group]: { ...prev[group], [key]: value },
    }));
  }

  function updateRecall(i, field, value) {
    setRecall((rows) =>
      rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)),
    );
  }

  function handleFreq(key, value) {
    setFreq((prev) => {
      const next = { ...prev };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        measures,
        recall24h: recall.filter((r) => r.description.trim()),
        foodFrequency: freq,
        patientReport,
      };
      if (editing) await api.put(`/consultations/${consultationId}`, payload);
      else await api.post(`/patients/${patientId}/consultations`, payload);
      navigate(`/patients/${patientId}`);
    } catch (err) {
      const details = err.response?.data?.details;
      setErrors(
        details?.map((d) => `${d.field}: ${d.message}`) ?? [
          err.response?.data?.error ?? 'Error al guardar',
        ],
      );
    } finally {
      setSubmitting(false);
    }
  }

  const input = 'w-full rounded border p-2';
  const label = 'mb-1 block text-sm text-gray-600';

  return (
    <form
      onSubmit={handleSubmit}
      className="consultation-form space-y-4 rounded bg-white p-6 shadow"
    >
      <h1 className="text-xl font-bold">
        {editing ? 'Editar consulta' : 'Crear consulta'}
      </h1>

      {errors.length > 0 && (
        <ul className="rounded bg-red-50 p-3 text-sm text-red-700">
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Tipo de consulta</label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className={input}
          >
            <option value="INITIAL">Inicial</option>
            <option value="FOLLOWUP">Seguimiento</option>
          </select>
        </div>
        <div>
          <label className={label}>Fecha *</label>
          <input
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            className={input}
            required
          />
        </div>
        <div>
          <label className={label}>Peso (kg)</label>
          <input
            name="weightKg"
            type="number"
            step="0.1"
            value={form.weightKg}
            onChange={handleChange}
            className={input}
          />
        </div>
        <div>
          <label className={label}>Talla (cm)</label>
          <input
            name="heightCm"
            type="number"
            step="0.1"
            value={form.heightCm}
            onChange={handleChange}
            className={input}
          />
        </div>
        <div>
          <label className={label}>% de grasa (báscula)</label>
          <input
            name="bodyFatPct"
            type="number"
            step="0.1"
            value={form.bodyFatPct}
            onChange={handleChange}
            className={input}
          />
        </div>
      </div>

      {patientId && <Dietocalculo patient={patientProfile} weight={form.weightKg} height={form.heightCm} value={patientReport.dietCalculation ?? {}} onChange={(dietCalculation) => setPatientReport((prev) => ({ ...prev, dietCalculation }))} />}

      {MEASURE_GROUPS.map((group) => (
        <details key={group.key} className="consultation-section consultation-measures rounded border p-3">
          <summary className="cursor-pointer font-medium">
            {group.title}
          </summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {group.fields.map((f) => (
              <div key={f.key}>
                <label className={label}>
                  {f.label} ({f.unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={measures[group.key]?.[f.key] ?? ''}
                  onChange={(e) =>
                    handleMeasure(group.key, f.key, e.target.value)
                  }
                  className={input}
                />
              </div>
            ))}
          </div>
        </details>
      ))}

      <details className="consultation-section consultation-recall rounded border p-3" open={form.type === 'INITIAL'}>
        <summary className="cursor-pointer font-medium">
          Recordatorio de 24 horas
        </summary>
        <div className="mt-3 space-y-3">
          {recall.map((r, i) => (
            <div key={i} className="space-y-2 rounded bg-gray-50 p-3">
              <div className="flex gap-2">
                <input
                  value={r.meal}
                  onChange={(e) => updateRecall(i, 'meal', e.target.value)}
                  placeholder="Tiempo de comida"
                  className={input}
                />
                <input
                  type="time"
                  value={r.time ?? ''}
                  onChange={(e) => updateRecall(i, 'time', e.target.value)}
                  className="rounded border p-2"
                />
                <button
                  type="button"
                  onClick={() =>
                    setRecall((rows) => rows.filter((_, idx) => idx !== i))
                  }
                  className="px-2 text-red-600"
                  aria-label="Quitar"
                >
                  ✕
                </button>
              </div>
              <textarea
                value={r.description}
                onChange={(e) => updateRecall(i, 'description', e.target.value)}
                placeholder="¿Qué comió y en qué cantidad?"
                className={input}
                rows={2}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setRecall((rows) => [
                ...rows,
                { meal: '', time: '', description: '' },
              ])
            }
            className="text-sm text-emerald-700 hover:underline"
          >
            + Agregar tiempo de comida
          </button>
        </div>
      </details>

      <details className="consultation-section consultation-frequency rounded border p-3">
        <summary className="cursor-pointer font-medium">
          Frecuencia de alimentos · valoración habitual
        </summary>
        <p className="mt-2 text-sm text-gray-500">Registra el patrón que el paciente ya tiene; el plan de alimentación se captura arriba como intervención para esta etapa.</p>
        <div className="mt-3 space-y-2">
          {FREQ_GROUPS.map((g) => (
            <div
              key={g.key}
              className="flex items-center justify-between gap-3"
            >
              <span className="text-sm">{g.label}</span>
              <select
                value={freq[g.key] ?? ''}
                onChange={(e) => handleFreq(g.key, e.target.value)}
                className="rounded border p-1 text-sm"
              >
                <option value="">—</option>
                {FREQ_OPTIONS.map(([value, text]) => (
                  <option key={value} value={value}>
                    {text}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </details>

      {patientId && <MealPlans patientId={patientId} defaultStartDate={form.date} consultationContext />}

      <details className="consultation-section consultation-report rounded border p-3" open>
        <summary className="cursor-pointer font-medium">Contenido del reporte para el paciente</summary>
        <p className="mt-2 text-sm text-gray-500">Estos datos quedan guardados en esta consulta y se cargan automáticamente en la vista previa del PDF. Las notas clínicas de abajo se mantienen privadas.</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">Motivo de consulta<textarea className={input} rows={2} maxLength={1000} value={patientReport.reason ?? ''} onChange={(e) => setPatientReport({ ...patientReport, reason: e.target.value })} /></label>
          <label className="grid gap-1 text-sm">Objetivo acordado<textarea className={input} rows={2} maxLength={1000} value={patientReport.objective ?? ''} onChange={(e) => setPatientReport({ ...patientReport, objective: e.target.value })} /></label>
          <label className="grid gap-1 text-sm sm:col-span-2">Observación para el paciente<textarea className={input} rows={3} maxLength={2000} value={patientReport.patientNote ?? ''} onChange={(e) => setPatientReport({ ...patientReport, patientNote: e.target.value })} /></label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={Boolean(patientReport.includeMacros)} onChange={(e) => setPatientReport({ ...patientReport, includeMacros: e.target.checked })} /> Incluir calorías y macronutrientes en el PDF</label>
          {patientReport.includeMacros && <>
            <label className="grid gap-1 text-sm">Calorías<textarea className={input} rows={2} maxLength={80} value={patientReport.calories ?? ''} onChange={(e) => setPatientReport({ ...patientReport, calories: e.target.value })} placeholder="Ej. 1,800 kcal" /></label>
            <label className="grid gap-1 text-sm">Distribución de macronutrientes<textarea className={input} rows={2} maxLength={300} value={patientReport.macros ?? ''} onChange={(e) => setPatientReport({ ...patientReport, macros: e.target.value })} placeholder="Ej. carbohidratos, proteínas y grasas" /></label>
          </>}
          {[
            ['hydration', 'Hidratación'], ['activity', 'Actividad física'], ['rest', 'Descanso'],
            ['foodsToLimit', 'Alimentos a evitar o limitar'], ['supplements', 'Suplementos (dosis y duración)'],
            ['goals', 'Metas medibles para la próxima consulta'], ['labs', 'Estudios de laboratorio'],
            ['warningSigns', 'Señales de alerta e indicaciones médicas'], ['rescheduleInfo', 'Cómo reprogramar la próxima cita'],
          ].map(([key, title]) => <label key={key} className="grid gap-1 text-sm">{title}<textarea className={input} rows={2} maxLength={2000} value={patientReport[key] ?? ''} onChange={(e) => setPatientReport({ ...patientReport, [key]: e.target.value })} /></label>)}
        </div>
      </details>

      <div>
        <label className={label}>Notas de la consulta</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          className={input}
          rows={4}
        />
      </div>

      <div className="flex gap-3">
        <button
          disabled={submitting}
          className="rounded bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {submitting ? 'Guardando...' : 'Guardar'}
        </button>
        <Link
          to={patientId ? `/patients/${patientId}` : '/'}
          className="rounded border px-4 py-2 hover:bg-gray-100"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}

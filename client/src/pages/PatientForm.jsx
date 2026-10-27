import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { HISTORY_FIELDS, parseHistoryValue, serializeHistoryValue } from '../lib/clinical';
import { invalidatePatientLists } from '../lib/patientCache';
import { readDraft, removeDraft, writeDraft } from '../lib/localDraft';
import { useAuth } from '../context/useAuth';
const empty = {
  firstName: '',
  lastName: '',
  birthDate: '',
  sex: '',
  phone: '',
  email: '',
  goal: '',
  allergies: '',
  notes: '',
  medicalHistory: {},
};

export default function PatientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const draftKey = `patient:${user?.id ?? user?.email ?? 'user'}:${id ?? 'new'}`;
  const [draftAvailable, setDraftAvailable] = useState(() => Boolean(readDraft(draftKey)));
  const [draftResolved, setDraftResolved] = useState(() => !readDraft(draftKey));
  const [formReady, setFormReady] = useState(!id);
  const [form, setForm] = useState(empty);
  const baselineRef = useRef(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/patients/${id}`).then((res) => {
      const p = res.data;
      const loadedForm = {
        ...empty,
        ...Object.fromEntries(Object.entries(p).filter(([, v]) => v !== null)),
        birthDate: p.birthDate ? p.birthDate.slice(0, 10) : '',
      };
      baselineRef.current = loadedForm;
      setForm(loadedForm);
      setFormReady(true);
    });
  }, [id]);

  useEffect(() => {
    if (!draftResolved || !formReady || saving || JSON.stringify(form) === JSON.stringify(baselineRef.current)) return undefined;
    const timer = window.setTimeout(() => writeDraft(draftKey, form), 400);
    return () => window.clearTimeout(timer);
  }, [draftKey, draftResolved, form, formReady, saving]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  function handleHistory(key, answer, details = '') {
    setForm((f) => ({
      ...f,
      medicalHistory: {
        ...f.medicalHistory,
        [key]: serializeHistoryValue(answer, details),
      },
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSaving(true);
    setError('');
    // Quitar campos vacíos para que Zod no los rechace
    const payload = Object.fromEntries(
      Object.entries(form).filter(
        ([k, v]) => v !== '' && !['id', 'userId', 'createdAt'].includes(k),
      ),
    );
    try {
      if (id) await api.put(`/patients/${id}`, payload);
      else await api.post('/patients', payload);
      removeDraft(draftKey);
      invalidatePatientLists();
      navigate(id ? `/patients/${id}` : '/dashboard', {
        state: {
          successMessage: id
            ? 'Cambios del paciente guardados correctamente.'
            : 'Paciente creado correctamente.',
        },
      });
    } catch (err) {
      const details = err.response?.data?.details;
      setError(
        details
          ? details.map((d) => `${d.field}: ${d.message}`).join(' · ')
          : 'No se pudo guardar',
      );
      submittingRef.current = false;
      setSaving(false);
    }
  }

  const input = 'w-full rounded border p-2';

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded bg-white p-6 shadow"
    >
      <h2 className="text-xl font-semibold">
        {id ? 'Editar paciente' : 'Nuevo paciente'}
      </h2>
      {draftAvailable && (
        <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Hay un borrador de este formulario en esta pestaña.
          <button type="button" className="ml-2 underline" onClick={() => {
            const draft = readDraft(draftKey);
            if (draft?.value) setForm(draft.value);
            setDraftAvailable(false);
            setDraftResolved(true);
          }}>Restaurar</button>
          <button type="button" className="ml-2 underline" onClick={() => {
            removeDraft(draftKey);
            setDraftAvailable(false);
            setDraftResolved(true);
          }}>Descartar</button>
        </div>
      )}
      {error && (
        <p className="rounded bg-red-100 p-2 text-sm text-red-700">{error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <input
          name="firstName"
          placeholder="Nombre(s)"
          value={form.firstName}
          onChange={handleChange}
          className={input}
          required
        />
        <input
          name="lastName"
          placeholder="Apellidos"
          value={form.lastName}
          onChange={handleChange}
          className={input}
          required
        />
        <input
          name="birthDate"
          type="date"
          value={form.birthDate}
          onChange={handleChange}
          className={input}
        />
        <select
          name="sex"
          value={form.sex}
          onChange={handleChange}
          className={input}
        >
          <option value="">Sexo</option>
          <option value="F">Femenino</option>
          <option value="M">Masculino</option>
          <option value="O">Otro</option>
        </select>
        <input
          name="phone"
          placeholder="Teléfono"
          value={form.phone}
          onChange={handleChange}
          className={input}
        />
        <input
          name="email"
          type="email"
          placeholder="Correo"
          value={form.email}
          onChange={handleChange}
          className={input}
        />
      </div>

      <textarea
        name="goal"
        placeholder="Objetivo"
        value={form.goal}
        onChange={handleChange}
        className={input}
        rows="2"
      />
      <textarea
        name="allergies"
        placeholder="Alergias / intolerancias"
        value={form.allergies}
        onChange={handleChange}
        className={input}
        rows="2"
      />
      <textarea
        name="notes"
        placeholder="Notas"
        value={form.notes}
        onChange={handleChange}
        className={input}
        rows="3"
      />
      <details className="history-panel">
        <summary className="history-summary">
          Historia clínica
        </summary>
        <p className="history-hint">Selecciona una respuesta. Si eliges Sí, describe los detalles.</p>
        <div className="history-grid">
          {form.medicalHistory?.habitos && (
            <p className="history-legacy">
              Registro anterior de agua, alcohol y tabaco: {form.medicalHistory.habitos}
            </p>
          )}
          {HISTORY_FIELDS.map((f) => {
            const entry = parseHistoryValue(form.medicalHistory?.[f.key]);
            return (
              <fieldset key={f.key} className="history-question">
                <legend className="history-question-title">{f.label}</legend>
                <div className="history-options">
                  {[[ 'yes', 'S\u00ed' ], [ 'no', 'No' ]].map(([value, label]) => (
                    <label key={value} className={`history-option ${entry.answer === value ? 'is-selected' : ''}`}>
                      <input
                        type="radio"
                        name={`history-${f.key}`}
                        value={value}
                        checked={entry.answer === value}
                        onChange={() => handleHistory(f.key, value, entry.details)}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
                {entry.answer === 'yes' && f.details !== false && f.detailType === 'number' && (
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={entry.details}
                    onChange={(e) => handleHistory(f.key, 'yes', e.target.value)}
                    placeholder={f.detailPrompt}
                    className="history-detail"
                    required
                  />
                )}
                {entry.answer === 'yes' && f.details !== false && f.detailType !== 'number' && (
                  <textarea
                    value={entry.details}
                    onChange={(e) => handleHistory(f.key, 'yes', e.target.value)}
                    placeholder={f.detailPrompt}
                    className="history-detail"
                    rows={2}
                    maxLength={1995}
                    required
                  />
                )}
              </fieldset>
            );
          })}
        </div>
      </details>
      <div className="flex gap-3">
        <button disabled={saving} className="rounded bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60">
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="rounded border px-4 py-2"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

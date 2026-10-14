import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { HISTORY_FIELDS } from '../lib/clinical';
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
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api.get(`/patients/${id}`).then((res) => {
      const p = res.data;
      setForm({
        ...empty,
        ...Object.fromEntries(Object.entries(p).filter(([, v]) => v !== null)),
        birthDate: p.birthDate ? p.birthDate.slice(0, 10) : '',
      });
    });
  }, [id]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  function handleHistory(key, value) {
    setForm((f) => ({
      ...f,
      medicalHistory: { ...f.medicalHistory, [key]: value },
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
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
      navigate('/dashboard');
    } catch (err) {
      const details = err.response?.data?.details;
      setError(
        details
          ? details.map((d) => `${d.field}: ${d.message}`).join(' · ')
          : 'No se pudo guardar',
      );
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
      <details className="rounded border p-3">
        <summary className="cursor-pointer font-medium">
          Historia clínica
        </summary>
        <div className="mt-3 space-y-3">
          {HISTORY_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-sm text-gray-600">
                {f.label}
              </label>
              <textarea
                value={form.medicalHistory?.[f.key] ?? ''}
                onChange={(e) => handleHistory(f.key, e.target.value)}
                className={input}
                rows={2}
              />
            </div>
          ))}
        </div>
      </details>
      <div className="flex gap-3">
        <button className="rounded bg-emerald-700 px-4 py-2 text-white hover:bg-emerald-800">
          Guardar
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

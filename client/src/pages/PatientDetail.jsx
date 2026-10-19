import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../lib/api';
import ConfirmDialog from '../components/ConfirmDialog';
import { ALL_MEASURES, MEASURE_GROUPS } from '../lib/measures';
import { HISTORY_FIELDS, FREQ_GROUPS, FREQ_OPTIONS, displayHistoryValue } from '../lib/clinical';
import EnergyCalculator from '../components/EnergyCalculator';
import SomatotypePanel from '../components/SomatotypePanel';
import WeeklyCheckins from '../components/WeeklyCheckins';
import MealPlans from '../components/MealPlans';
import { invalidatePatientLists } from '../lib/patientCache';
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('es-MX', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

function imc(weight, height) {
  if (!weight || !height) return null;
  const m = Number(height) / 100;
  return (Number(weight) / (m * m)).toFixed(1);
}

function getValue(c, metric) {
  if (metric === 'weightKg') return c.weightKg;
  const m = ALL_MEASURES.find((x) => x.key === metric);
  return c.measures?.[m.group]?.[metric] ?? null;
}

export default function PatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState('weightKg');
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/patients/${id}`),
      api.get(`/patients/${id}/consultations`),
    ])
      .then(([p, c]) => {
        setPatient(p.data);
        setConsultations(c.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete(c) {
    setConfirmation({
      title: 'Eliminar consulta',
      message:
        'Se eliminará esta consulta del historial del paciente. Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      danger: true,
      onConfirm: async () => {
        setConfirmation(null);
        await api.delete(`/consultations/${c.id}`);
        setConsultations((prev) => prev.filter((x) => x.id !== c.id));
      },
    });
  }

  async function toggleStatus() {
    const next = patient.status === 'ACTIVE' ? 'DISCHARGED' : 'ACTIVE';
    const msg =
      next === 'DISCHARGED'
        ? '¿Dar de alta a este paciente? Saldrá de "En seguimiento", pero conservarás todo su historial.'
        : '¿Reactivar a este paciente?';
    setConfirmation({
      title:
        next === 'DISCHARGED'
          ? 'Dar de alta al paciente'
          : 'Reactivar paciente',
      message: msg,
      confirmLabel: next === 'DISCHARGED' ? 'Dar de alta' : 'Reactivar',
      onConfirm: async () => {
        setConfirmation(null);
        const res = await api.patch(`/patients/${id}/status`, { status: next });
        invalidatePatientLists();
        setPatient(res.data);
      },
    });
  }

  if (loading) return <p className="text-gray-500">Cargando...</p>;
  if (!patient) return <p>Paciente no encontrado.</p>;

  const metricInfo =
    metric === 'weightKg'
      ? { label: 'Peso', unit: 'kg' }
      : ALL_MEASURES.find((m) => m.key === metric);

  const chartData = consultations
    .filter((c) => getValue(c, metric) !== null)
    .map((c) => ({
      fecha: fmtDate(c.date),
      valor: Number(getValue(c, metric)),
    }));

  const last = consultations[consultations.length - 1];
  const latestWithBasics = [...consultations]
    .reverse()
    .find((c) => c.weightKg && c.heightCm);
  const withMetric = consultations.filter((c) => getValue(c, metric) !== null);
  const firstM = withMetric[0];
  const lastM = withMetric[withMetric.length - 1];
  const diff =
    firstM && lastM && firstM.id !== lastM.id
      ? (
          Number(getValue(lastM, metric)) - Number(getValue(firstM, metric))
        ).toFixed(1)
      : null;

  const hasHistory =
    patient.medicalHistory &&
    Object.values(patient.medicalHistory).some(Boolean);

  return (
    <div className="space-y-6">
      {confirmation && (
        <ConfirmDialog
          {...confirmation}
          onCancel={() => setConfirmation(null)}
          onConfirm={confirmation.onConfirm}
        />
      )}
      <div className="rounded bg-white p-4 shadow">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold">
              {patient.firstName} {patient.lastName}
              {patient.status === 'DISCHARGED' && (
                <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-600">
                  Dado de alta
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500">
              {patient.phone ?? 'Sin teléfono'} ·{' '}
              {patient.email ?? 'Sin correo'}
            </p>
          </div>
          <div className="space-x-3 text-sm">
            <Link
              to={`/patients/${id}/edit`}
              className="text-emerald-700 hover:underline"
            >
              Editar
            </Link>
            <button
              onClick={toggleStatus}
              className="text-gray-600 hover:underline"
            >
              {patient.status === 'ACTIVE' ? 'Dar de alta' : 'Reactivar'}
            </button>
          </div>
        </div>
        {patient.goal && (
          <p className="mt-3 text-sm">
            <b>Objetivo:</b> {patient.goal}
          </p>
        )}
        {patient.allergies && (
          <p className="mt-1 text-sm">
            <b>Alergias:</b> {patient.allergies}
          </p>
        )}
        {patient.notes && (
          <p className="mt-1 text-sm">
            <b>Notas:</b> {patient.notes}
          </p>
        )}
      </div>

      <WeeklyCheckins patient={patient} />

      {hasHistory && (
        <details className="rounded bg-white p-4 shadow">
          <summary className="cursor-pointer font-semibold">
            Historia clínica
          </summary>
          <div className="mt-3 space-y-2 text-sm">
            {patient.medicalHistory.habitos && (
              <p><b>Registro anterior de agua, alcohol y tabaco:</b> {patient.medicalHistory.habitos}</p>
            )}
            {HISTORY_FIELDS.filter((f) => patient.medicalHistory[f.key]).map(
              (f) => (
                <p key={f.key}>
                  <b>{f.label}</b> {displayHistoryValue(patient.medicalHistory[f.key])}
                </p>
              ),
            )}
          </div>
        </details>
      )}
      {latestWithBasics && (
        <EnergyCalculator patient={patient} consultation={latestWithBasics} />
      )}
      {consultations.length > 0 && (
        <SomatotypePanel consultations={consultations} />
      )}
      <div className="rounded bg-white p-4 shadow">
        <MealPlans patientId={id} />
      </div>
      {consultations.length > 0 && (
        <div className="rounded bg-white p-4 shadow">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold">Evolución</h2>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="rounded border p-1 text-sm"
              >
                <option value="weightKg">Peso</option>
                {MEASURE_GROUPS.map((g) => (
                  <optgroup key={g.key} label={g.title}>
                    {g.fields.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            {diff !== null && (
              <span
                className={`text-sm font-medium ${Number(diff) <= 0 ? 'text-emerald-700' : 'text-amber-600'}`}
              >
                {Number(diff) > 0 ? '+' : ''}
                {diff} {metricInfo.unit} desde la primera consulta
              </span>
            )}
          </div>

          {chartData.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">
              Aún no hay datos de "{metricInfo.label}".
            </p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" fontSize={12} />
                  <YAxis
                    domain={['dataMin - 2', 'dataMax + 2']}
                    fontSize={12}
                    unit={` ${metricInfo.unit}`}
                    width={60}
                  />
                  <Tooltip
                    formatter={(v) => [
                      `${v} ${metricInfo.unit}`,
                      metricInfo.label,
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="valor"
                    stroke="#047857"
                    strokeWidth={2}
                    dot
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Consultas</h2>
          <Link
            to={`/patients/${id}/consultations/new`}
            state={{
              lastHeight: last?.heightCm,
              isFirst: consultations.length === 0,
            }}
            className="rounded bg-emerald-700 px-4 py-2 text-sm text-white hover:bg-emerald-800"
          >
            + Nueva consulta
          </Link>
        </div>

        {consultations.length === 0 ? (
          <p className="rounded bg-white p-6 text-center text-gray-500 shadow">
            Aún no hay consultas registradas.
          </p>
        ) : (
          [...consultations].reverse().map((c) => (
            <div key={c.id} className="rounded bg-white p-4 shadow">
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  {fmtDate(c.date)}
                  <span className="ml-2 rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                    {c.type === 'INITIAL' ? 'Inicial' : 'Seguimiento'}
                  </span>
                </p>
                <div className="space-x-3 text-sm">
                  <Link
                    to={`/consultations/${c.id}/edit`}
                    className="text-emerald-700 hover:underline"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(c)}
                    className="text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-700">
                {c.weightKg && <span>Peso: {c.weightKg} kg</span>}
                {c.heightCm && <span>Talla: {c.heightCm} cm</span>}
                {imc(c.weightKg, c.heightCm) && (
                  <span>IMC: {imc(c.weightKg, c.heightCm)}</span>
                )}
                {c.bodyFatPct && <span>% grasa: {c.bodyFatPct}</span>}
                {c.measures?.perimetros?.cintura && (
                  <span>Cintura: {c.measures.perimetros.cintura} cm</span>
                )}
                {c.measures?.perimetros?.cadera && (
                  <span>Cadera: {c.measures.perimetros.cadera} cm</span>
                )}
              </div>

              {c.notes && (
                <p className="mt-2 whitespace-pre-line text-sm">{c.notes}</p>
              )}

              {c.recall24h?.length > 0 && (
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer text-gray-600">
                    Recordatorio de 24 h
                  </summary>
                  <div className="mt-1 space-y-1">
                    {c.recall24h.map((r, i) => (
                      <p key={i}>
                        <b>
                          {r.meal}
                          {r.time ? ` (${r.time})` : ''}:
                        </b>{' '}
                        {r.description}
                      </p>
                    ))}
                  </div>
                </details>
              )}

              {c.foodFrequency && Object.keys(c.foodFrequency).length > 0 && (
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer text-gray-600">
                    Frecuencia de alimentos
                  </summary>
                  <div className="mt-1 space-y-1">
                    {FREQ_GROUPS.filter((g) => c.foodFrequency[g.key]).map(
                      (g) => (
                        <p key={g.key}>
                          {g.label}:{' '}
                          {
                            FREQ_OPTIONS.find(
                              ([v]) => v === c.foodFrequency[g.key],
                            )?.[1]
                          }
                        </p>
                      ),
                    )}
                  </div>
                </details>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
